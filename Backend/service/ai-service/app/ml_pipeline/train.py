from __future__ import annotations

import argparse
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional

import joblib
import pandas as pd
from sklearn.linear_model import LinearRegression

from .config import (
    CHARTS_DIR,
    DEFAULT_METADATA_PATH,
    DEFAULT_METRICS_CSV,
    DEFAULT_PREDICTIONS_CSV,
    DEFAULT_PREPARED_DAILY_CSV,
    DEFAULT_REPORT_PATH,
    DEFAULT_TRAIN_FEATURES_CSV,
    DEFAULT_WEATHER_CSV,
    FORECAST_HORIZONS,
    MIN_VALID_DAYS_PER_PROVINCE,
    MODELS_DIR,
    XGB_PARAM_GRID,
    ensure_directories,
    grid_product,
)
from .data_loader import build_daily_dataset
from .evaluate import evaluate_horizon_predictions, season_error_table
from .feature_builder import (
    build_feature_frame,
    encode_features,
    filter_valid_provinces,
    province_dummy_columns,
    time_series_split,
)
from .report import (
    build_report_markdown,
    generate_actual_vs_pred_charts,
    generate_error_by_season_chart,
    write_report,
)

try:
    from xgboost import XGBRegressor
except ImportError as exc:  # pragma: no cover - runtime dependency check
    raise ImportError("Thiếu xgboost. Hãy cài xgboost trong requirements.txt") from exc


def _quick_grid() -> Dict[str, list]:
    return {
        "max_depth": [4],
        "learning_rate": [0.05],
        "n_estimators": [120],
        "subsample": [0.8],
        "colsample_bytree": [0.8],
    }


def run_training(
    weather_csv: Path,
    local_dataset: Optional[Path] = None,
    use_supabase_fallback: bool = True,
    quick_mode: bool = False,
) -> Dict[str, object]:
    ensure_directories()
    mode_label = "quick" if quick_mode else "full"
    print(f"[AI1] Training mode: {mode_label}")

    daily_df = build_daily_dataset(
        weather_csv_path=weather_csv,
        local_dataset_path=local_dataset,
        use_supabase_fallback=use_supabase_fallback,
    )
    daily_df.to_csv(DEFAULT_PREPARED_DAILY_CSV, index=False)
    print(f"[AI1] Saved prepared daily dataset: {DEFAULT_PREPARED_DAILY_CSV}")

    feature_frame, feature_cols, target_cols = build_feature_frame(daily_df, include_targets=True)
    train_frame = filter_valid_provinces(
        feature_frame,
        feature_cols=feature_cols,
        target_cols=target_cols,
        min_valid_days=MIN_VALID_DAYS_PER_PROVINCE,
    )
    if train_frame.empty:
        raise ValueError("Không có dữ liệu hợp lệ sau feature engineering và filter tỉnh.")

    split = time_series_split(train_frame)
    provinces = sorted(train_frame["province"].unique())
    province_cols = province_dummy_columns(provinces)

    x_train = encode_features(split.train, feature_cols, province_cols)
    x_val = encode_features(split.val, feature_cols, province_cols)
    x_test = encode_features(split.test, feature_cols, province_cols)
    encoded_feature_cols = list(x_train.columns)

    train_frame.to_csv(DEFAULT_TRAIN_FEATURES_CSV, index=False)
    print(f"[AI1] Saved training feature dataset: {DEFAULT_TRAIN_FEATURES_CSV}")

    param_grid = _quick_grid() if quick_mode else XGB_PARAM_GRID
    metrics_rows = []
    prediction_frames = []
    best_params_map: Dict[str, Dict[str, float]] = {}

    for horizon in FORECAST_HORIZONS:
        target_col = f"y_day{horizon}"
        y_train = split.train[target_col]
        y_val = split.val[target_col]
        y_test = split.test[target_col]

        baseline = LinearRegression()
        baseline.fit(x_train, y_train)
        baseline_test_pred = baseline.predict(x_test)

        best_model = None
        best_params = None
        best_rmse = float("inf")

        for params in grid_product(param_grid):
            candidate = XGBRegressor(
                objective="reg:squarederror",
                random_state=42,
                n_jobs=4,
                **params,
            )
            candidate.fit(x_train, y_train, eval_set=[(x_val, y_val)], verbose=False)
            val_pred = candidate.predict(x_val)
            val_rmse = float(((y_val - val_pred) ** 2).mean() ** 0.5)
            if val_rmse < best_rmse:
                best_rmse = val_rmse
                best_model = candidate
                best_params = params

        if best_model is None or best_params is None:
            raise RuntimeError(f"Không chọn được model cho horizon day{horizon}.")

        main_test_pred = best_model.predict(x_test)

        metrics_rows.extend(
            evaluate_horizon_predictions(
                y_true=y_test,
                baseline_pred=baseline_test_pred,
                main_pred=main_test_pred,
                horizon=horizon,
            )
        )

        test_meta = split.test.loc[:, ["date", "province", "is_dry_season", target_col]].copy()
        test_meta = test_meta.rename(columns={target_col: "actual"})
        for model_name, preds in (
            ("baseline_linear", baseline_test_pred),
            ("xgboost", main_test_pred),
        ):
            temp = test_meta.copy()
            temp["horizon"] = horizon
            temp["model"] = model_name
            temp["predicted"] = preds
            prediction_frames.append(temp)

        baseline_path = MODELS_DIR / f"baseline_day{horizon}.pkl"
        model_path = MODELS_DIR / f"salinity_day{horizon}.pkl"
        joblib.dump(baseline, baseline_path)
        joblib.dump(best_model, model_path)
        best_params_map[f"day{horizon}"] = best_params
        print(f"[AI1] Saved models for day{horizon}: {model_path.name}, {baseline_path.name}")

    metrics_df = pd.DataFrame(metrics_rows).sort_values(["horizon", "model"]).reset_index(drop=True)
    predictions_df = pd.concat(prediction_frames, ignore_index=True)
    season_df = season_error_table(predictions_df)

    metrics_df.to_csv(DEFAULT_METRICS_CSV, index=False)
    predictions_df.to_csv(DEFAULT_PREDICTIONS_CSV, index=False)
    print(f"[AI1] Metrics saved: {DEFAULT_METRICS_CSV}")
    print(f"[AI1] Predictions saved: {DEFAULT_PREDICTIONS_CSV}")

    chart_paths = generate_actual_vs_pred_charts(predictions_df, CHARTS_DIR)
    season_chart = generate_error_by_season_chart(season_df, CHARTS_DIR)
    model_version = datetime.utcnow().strftime("%Y%m%d%H%M%S")

    metadata = {
        "model_version": model_version,
        "created_at_utc": datetime.utcnow().isoformat(),
        "horizons": list(FORECAST_HORIZONS),
        "feature_columns": encoded_feature_cols,
        "numeric_feature_columns": feature_cols,
        "province_dummy_columns": province_cols,
        "provinces": provinces,
        "split": {
            "train_end_date": split.train_end_date.strftime("%Y-%m-%d"),
            "val_end_date": split.val_end_date.strftime("%Y-%m-%d"),
            "train_ratio": 0.70,
            "val_ratio": 0.15,
            "test_ratio": 0.15,
        },
        "best_params": best_params_map,
        "artifacts": {
            "prepared_daily_csv": str(DEFAULT_PREPARED_DAILY_CSV),
            "train_feature_csv": str(DEFAULT_TRAIN_FEATURES_CSV),
            "metrics_csv": str(DEFAULT_METRICS_CSV),
            "predictions_csv": str(DEFAULT_PREDICTIONS_CSV),
            "report_path": str(DEFAULT_REPORT_PATH),
        },
        "data_sources": {
            "weather_csv": str(weather_csv),
            "local_dataset": str(local_dataset) if local_dataset else None,
            "supabase_fallback": use_supabase_fallback,
        },
    }
    DEFAULT_METADATA_PATH.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[AI1] Metadata saved: {DEFAULT_METADATA_PATH}")

    markdown = build_report_markdown(
        metrics_df=metrics_df,
        season_df=season_df,
        provinces=provinces,
        model_version=model_version,
        chart_paths=chart_paths,
        season_chart_path=season_chart,
    )
    write_report(markdown, DEFAULT_REPORT_PATH)
    print(f"[AI1] Report generated: {DEFAULT_REPORT_PATH}")

    return metadata


def main() -> None:
    parser = argparse.ArgumentParser(description="Train AI1 salinity 7-day forecast models.")
    parser.add_argument(
        "--weather-csv",
        type=Path,
        default=DEFAULT_WEATHER_CSV,
        help="Path to weather CSV (date, province, rain_mm, temp_c).",
    )
    parser.add_argument(
        "--local-dataset",
        type=Path,
        default=None,
        help="Optional combined local dataset containing salinity/weather columns.",
    )
    parser.add_argument(
        "--no-supabase-fallback",
        action="store_true",
        help="Disable Supabase fallback when local dataset has no salinity column.",
    )
    parser.add_argument(
        "--quick",
        action="store_true",
        help="Run quick training with compact XGBoost grid.",
    )
    args = parser.parse_args()

    local_dataset = args.local_dataset if args.local_dataset else args.weather_csv
    run_training(
        weather_csv=args.weather_csv,
        local_dataset=local_dataset,
        use_supabase_fallback=not args.no_supabase_fallback,
        quick_mode=args.quick,
    )


if __name__ == "__main__":
    main()

