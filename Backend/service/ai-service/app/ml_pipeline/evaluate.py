from __future__ import annotations

from typing import Dict, Iterable, List

import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error


def regression_metrics(y_true: Iterable[float], y_pred: Iterable[float]) -> Dict[str, float]:
    y_true_arr = np.asarray(list(y_true), dtype=float)
    y_pred_arr = np.asarray(list(y_pred), dtype=float)
    rmse = float(np.sqrt(mean_squared_error(y_true_arr, y_pred_arr)))
    mae = float(mean_absolute_error(y_true_arr, y_pred_arr))
    return {"mae": mae, "rmse": rmse}


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

