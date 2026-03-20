from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Iterable, List, Optional, Sequence

import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error


def regression_metrics(y_true: Iterable[float], y_pred: Iterable[float]) -> Dict[str, float]:
    y_true_arr = np.asarray(list(y_true), dtype=float)
    y_pred_arr = np.asarray(list(y_pred), dtype=float)
    rmse = float(np.sqrt(mean_squared_error(y_true_arr, y_pred_arr)))
    mae = float(mean_absolute_error(y_true_arr, y_pred_arr))
    return {"mae": mae, "rmse": rmse}


def threshold_accuracy_metrics(
    y_true: Iterable[float],
    y_pred: Iterable[float],
    tolerance: float = 0.5,
) -> Dict[str, float]:
    y_true_arr = np.asarray(list(y_true), dtype=float)
    y_pred_arr = np.asarray(list(y_pred), dtype=float)
    abs_error = np.abs(y_true_arr - y_pred_arr)
    hit_mask = abs_error <= float(tolerance)
    hit_count = int(hit_mask.sum())
    total_count = int(len(abs_error))
    accuracy_pct = (hit_count / total_count * 100.0) if total_count else 0.0
    return {
        "tolerance": float(tolerance),
        "hit_count": hit_count,
        "total_count": total_count,
        "accuracy_pct": float(accuracy_pct),
    }


def evaluate_horizon_predictions(
    y_true: pd.Series,
    baseline_pred: np.ndarray,
    main_pred: np.ndarray,
    horizon: int,
) -> List[Dict[str, float]]:
    base = regression_metrics(y_true, baseline_pred)
    main = regression_metrics(y_true, main_pred)
    return [
        {"horizon": horizon, "model": "baseline_linear", "mae": base["mae"], "rmse": base["rmse"]},
        {"horizon": horizon, "model": "xgboost", "mae": main["mae"], "rmse": main["rmse"]},
    ]


def season_error_table(predictions: pd.DataFrame) -> pd.DataFrame:
    required = {"model", "horizon", "is_dry_season", "actual", "predicted"}
    missing = required - set(predictions.columns)
    if missing:
        raise ValueError(f"Predictions thiếu cột bắt buộc: {sorted(missing)}")

    rows = []
    for (model_name, horizon, dry_flag), group in predictions.groupby(["model", "horizon", "is_dry_season"]):
        metrics = regression_metrics(group["actual"], group["predicted"])
        rows.append(
            {
                "model": model_name,
                "horizon": int(horizon),
                "season": "dry" if int(dry_flag) == 1 else "rainy",
                "mae": metrics["mae"],
                "rmse": metrics["rmse"],
                "sample_size": int(len(group)),
            }
        )
    return pd.DataFrame(rows).sort_values(["model", "horizon", "season"]).reset_index(drop=True)


def prediction_threshold_table(predictions: pd.DataFrame, tolerance: float = 0.5) -> pd.DataFrame:
    required = {"model", "horizon", "actual", "predicted"}
    missing = required - set(predictions.columns)
    if missing:
        raise ValueError(f"Predictions thiếu cột bắt buộc: {sorted(missing)}")

    rows = []
    for (model_name, horizon), group in predictions.groupby(["model", "horizon"]):
        metrics = threshold_accuracy_metrics(group["actual"], group["predicted"], tolerance=tolerance)
        rows.append(
            {
                "model": model_name,
                "horizon": int(horizon),
                "tolerance_ppt": metrics["tolerance"],
                "hit_count": metrics["hit_count"],
                "total_count": metrics["total_count"],
                "accuracy_pct": metrics["accuracy_pct"],
            }
        )
    return pd.DataFrame(rows).sort_values(["horizon", "model"]).reset_index(drop=True)


def policy_threshold_table(
    predictions: pd.DataFrame,
    acceptance_rules: Dict[int, Dict[str, float]],
) -> pd.DataFrame:
    required = {"model", "horizon", "actual", "predicted"}
    missing = required - set(predictions.columns)
    if missing:
        raise ValueError(f"Predictions thiếu cột bắt buộc: {sorted(missing)}")

    rows = []
    for (model_name, horizon), group in predictions.groupby(["model", "horizon"]):
        horizon_int = int(horizon)
        rule = acceptance_rules.get(horizon_int)
        if rule is None:
            continue
        tolerance = float(rule["tolerance_ppt"])
        target_accuracy_pct = float(rule["target_accuracy_pct"])
        metrics = threshold_accuracy_metrics(group["actual"], group["predicted"], tolerance=tolerance)
        rows.append(
            {
                "model": model_name,
                "horizon": horizon_int,
                "tolerance_ppt": tolerance,
                "hit_count": metrics["hit_count"],
                "total_count": metrics["total_count"],
                "accuracy_pct": metrics["accuracy_pct"],
                "target_accuracy_pct": target_accuracy_pct,
                "accuracy_status": "pass" if metrics["accuracy_pct"] >= target_accuracy_pct else "fail",
            }
        )
    return pd.DataFrame(rows).sort_values(["horizon", "model"]).reset_index(drop=True)


@dataclass(frozen=True)
class RollingWindow:
    fold_id: int
    train_end_date: pd.Timestamp
    val_end_date: pd.Timestamp
    test_end_date: pd.Timestamp


def build_rolling_origin_windows(
    unique_dates: Sequence[pd.Timestamp],
    min_train_days: int = 180,
    val_days: int = 30,
    test_days: int = 30,
    step_days: int = 14,
) -> List[RollingWindow]:
    dates = [pd.Timestamp(item) for item in unique_dates]
    if len(dates) < (min_train_days + val_days + test_days):
        return []

    windows: List[RollingWindow] = []
    fold_id = 1
    max_train_end_idx = len(dates) - val_days - test_days - 1
    for train_end_idx in range(min_train_days - 1, max_train_end_idx + 1, step_days):
        val_end_idx = train_end_idx + val_days
        test_end_idx = val_end_idx + test_days
        windows.append(
            RollingWindow(
                fold_id=fold_id,
                train_end_date=dates[train_end_idx],
                val_end_date=dates[val_end_idx],
                test_end_date=dates[test_end_idx],
            )
        )
        fold_id += 1
    return windows


def summarize_backtest_metrics(backtest_df: pd.DataFrame) -> pd.DataFrame:
    if backtest_df.empty:
        return pd.DataFrame(
            columns=["model", "horizon", "mae_mean", "mae_std", "rmse_mean", "rmse_std", "fold_count"]
        )
    grouped = (
        backtest_df.groupby(["model", "horizon"], as_index=False)
        .agg(
            mae_mean=("mae", "mean"),
            mae_std=("mae", "std"),
            rmse_mean=("rmse", "mean"),
            rmse_std=("rmse", "std"),
            fold_count=("fold_id", "nunique"),
        )
        .sort_values(["horizon", "model"])
        .reset_index(drop=True)
    )
    grouped["mae_std"] = grouped["mae_std"].fillna(0.0)
    grouped["rmse_std"] = grouped["rmse_std"].fillna(0.0)
    return grouped


def build_acceptance_summary(
    metrics_df: pd.DataFrame,
    threshold_df: pd.DataFrame,
    champion_by_horizon: Dict[str, str],
    regression_check_df: pd.DataFrame,
    acceptance_rules: Optional[Dict[int, Dict[str, float]]] = None,
) -> pd.DataFrame:
    if metrics_df.empty:
        return pd.DataFrame(
            columns=[
                "horizon",
                "selected_model",
                "evaluation_model",
                "selected_rmse",
                "evaluation_rmse",
                "baseline_rmse",
                "vs_baseline_status",
                "within_tolerance_accuracy_pct",
                "tolerance_ppt",
                "target_accuracy_pct",
                "accuracy_status",
                "selection_status",
                "regression_status",
                "overall_status",
            ]
        )

    regression_map: Dict[int, str] = {}
    if not regression_check_df.empty and {"horizon", "status"}.issubset(regression_check_df.columns):
        regression_map = {
            int(row["horizon"]): str(row["status"])
            for _, row in regression_check_df.iterrows()
        }

    rows = []
    for horizon in sorted(metrics_df["horizon"].dropna().astype(int).unique().tolist()):
        metric_subset = metrics_df[metrics_df["horizon"] == horizon].copy()
        if metric_subset.empty:
            continue
        metric_subset = metric_subset.sort_values("rmse", ascending=True).reset_index(drop=True)
        evaluation_model_row = metric_subset.iloc[0]
        evaluation_model = str(evaluation_model_row["model"])
        selected_model = champion_by_horizon.get(f"day{horizon}", evaluation_model)
        selected_metric = metric_subset[metric_subset["model"] == selected_model]
        if selected_metric.empty:
            selected_metric = metric_subset.iloc[[0]]
        selected_metric = selected_metric.iloc[0]
        evaluation_metric = metric_subset[metric_subset["model"] == evaluation_model].iloc[0]

        baseline_subset = metric_subset[metric_subset["model"] == "baseline_linear"]
        baseline_rmse = float(baseline_subset.iloc[0]["rmse"]) if not baseline_subset.empty else None

        threshold_subset = threshold_df[
            (threshold_df["horizon"] == horizon) & (threshold_df["model"] == evaluation_model)
        ]
        accuracy_pct = float(threshold_subset.iloc[0]["accuracy_pct"]) if not threshold_subset.empty else None
        tolerance_ppt = float(threshold_subset.iloc[0]["tolerance_ppt"]) if not threshold_subset.empty else None
        target_accuracy_pct = (
            float(threshold_subset.iloc[0]["target_accuracy_pct"])
            if not threshold_subset.empty and "target_accuracy_pct" in threshold_subset.columns
            else float(acceptance_rules.get(horizon, {}).get("target_accuracy_pct", 0.0))
            if acceptance_rules
            else 0.0
        )

        vs_baseline_status = (
            "not_checked"
            if baseline_rmse is None
            else "pass"
            if float(evaluation_metric["rmse"]) <= baseline_rmse
            else "fail"
        )
        accuracy_status = (
            "pass"
            if accuracy_pct is not None and accuracy_pct >= target_accuracy_pct
            else "fail"
        )
        selection_status = "pass" if str(selected_model) == evaluation_model else "warning"
        regression_status = regression_map.get(horizon, "not_checked")
        overall_status = (
            "pass"
            if accuracy_status == "pass"
            and vs_baseline_status != "fail"
            and regression_status != "fail"
            else "fail"
        )

        rows.append(
            {
                "horizon": horizon,
                "selected_model": str(selected_model),
                "evaluation_model": evaluation_model,
                "selected_rmse": float(selected_metric["rmse"]),
                "evaluation_rmse": float(evaluation_metric["rmse"]),
                "baseline_rmse": baseline_rmse,
                "vs_baseline_status": vs_baseline_status,
                "within_tolerance_accuracy_pct": accuracy_pct,
                "tolerance_ppt": tolerance_ppt,
                "target_accuracy_pct": target_accuracy_pct,
                "accuracy_status": accuracy_status,
                "selection_status": selection_status,
                "regression_status": regression_status,
                "overall_status": overall_status,
            }
        )
    return pd.DataFrame(rows).sort_values("horizon").reset_index(drop=True)


def choose_champion_by_policy(
    metrics_df: pd.DataFrame,
    threshold_df: pd.DataFrame,
    fallback_champions: Optional[Dict[str, str]] = None,
) -> Dict[str, str]:
    fallback = fallback_champions or {}
    if metrics_df.empty:
        return dict(fallback)

    if threshold_df.empty:
        return {
            f"day{int(horizon)}": str(
                metrics_df[metrics_df["horizon"] == horizon].sort_values(["rmse", "mae"]).iloc[0]["model"]
            )
            for horizon in sorted(metrics_df["horizon"].dropna().astype(int).unique().tolist())
        }

    merged = metrics_df.merge(
        threshold_df[["model", "horizon", "accuracy_status"]],
        on=["model", "horizon"],
        how="left",
    )

    champion_map: Dict[str, str] = {}
    for horizon in sorted(merged["horizon"].dropna().astype(int).unique().tolist()):
        subset = merged[merged["horizon"] == horizon].copy()
        if subset.empty:
            continue
        passing = subset[subset["accuracy_status"] == "pass"].copy()
        candidate_pool = passing if not passing.empty else subset
        candidate_pool = candidate_pool.sort_values(["rmse", "mae"]).reset_index(drop=True)
        champion_map[f"day{horizon}"] = str(candidate_pool.iloc[0]["model"])

    for key, value in fallback.items():
        champion_map.setdefault(key, value)
    return champion_map
