from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Sequence


APP_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = APP_DIR / "data"
MODELS_DIR = APP_DIR / "models"
REPORTS_DIR = APP_DIR / "reports"
CHARTS_DIR = REPORTS_DIR / "charts"

DEFAULT_WEATHER_CSV = DATA_DIR / "weather_province_daily.csv"
DEFAULT_PREPARED_DAILY_CSV = DATA_DIR / "prepared_daily_dataset.csv"
DEFAULT_TRAIN_FEATURES_CSV = DATA_DIR / "train_feature_dataset.csv"
DEFAULT_PREDICTIONS_CSV = REPORTS_DIR / "predictions_test.csv"
DEFAULT_METRICS_CSV = REPORTS_DIR / "metrics_summary.csv"
DEFAULT_BACKTEST_METRICS_CSV = REPORTS_DIR / "backtest_metrics_summary.csv"
DEFAULT_LSTM_METRICS_CSV = REPORTS_DIR / "lstm_pilot_metrics.csv"
DEFAULT_REGRESSION_CHECK_CSV = REPORTS_DIR / "regression_check.csv"
DEFAULT_THRESHOLD_METRICS_CSV = REPORTS_DIR / "threshold_accuracy_summary.csv"
DEFAULT_ACCEPTANCE_SUMMARY_CSV = REPORTS_DIR / "acceptance_summary.csv"
DEFAULT_REPORT_PATH = REPORTS_DIR / "report_ai1.md"
DEFAULT_METADATA_PATH = MODELS_DIR / "metadata.json"

DEFAULT_DRY_MONTHS = (12, 1, 2, 3, 4)
MIN_VALID_DAYS_PER_PROVINCE = 120
FORECAST_HORIZONS: Sequence[int] = tuple(range(1, 8))
BACKTEST_MIN_TRAIN_DAYS = 180
BACKTEST_VAL_DAYS = 30
BACKTEST_TEST_DAYS = 30
BACKTEST_STEP_DAYS = 14
LSTM_SEQUENCE_LENGTH = 14
LSTM_HIDDEN_SIZES: Sequence[int] = (32, 64)
LSTM_DROPOUTS: Sequence[float] = (0.1, 0.2)
LSTM_EPOCHS = 60
LSTM_PATIENCE = 10
DEFAULT_ERROR_TOLERANCE_PPT = 0.5
DEFAULT_ACCEPTANCE_THRESHOLD_PCT = 80.0
DEFAULT_ACCEPTANCE_RULES: Dict[int, Dict[str, float]] = {
    1: {"tolerance_ppt": 0.75, "target_accuracy_pct": 75.0},
    2: {"tolerance_ppt": 0.75, "target_accuracy_pct": 75.0},
    3: {"tolerance_ppt": 1.0, "target_accuracy_pct": 65.0},
    4: {"tolerance_ppt": 1.0, "target_accuracy_pct": 65.0},
    5: {"tolerance_ppt": 1.0, "target_accuracy_pct": 65.0},
    6: {"tolerance_ppt": 1.25, "target_accuracy_pct": 55.0},
    7: {"tolerance_ppt": 1.25, "target_accuracy_pct": 55.0},
}

XGB_ANCHOR_COLUMNS: Sequence[str] = ("sal_t-1", "sal_3d_avg", "sal_7d_avg")
XGB_DELTA_SCALES: Sequence[float] = (0.2, 0.4, 0.6, 0.8, 1.0)

XGB_PARAM_GRID: Dict[str, List[float]] = {
    "max_depth": [1, 2],
    "learning_rate": [0.02, 0.03],
    "n_estimators": [200, 250],
    "subsample": [0.8, 0.85],
    "colsample_bytree": [0.8],
    "min_child_weight": [5, 6, 8],
    "reg_lambda": [4.0, 5.0],
}


@dataclass(frozen=True)
class SplitConfig:
    train_ratio: float = 0.70
    val_ratio: float = 0.15
    test_ratio: float = 0.15


def ensure_directories() -> None:
    for path in (DATA_DIR, MODELS_DIR, REPORTS_DIR, CHARTS_DIR):
        path.mkdir(parents=True, exist_ok=True)


def grid_product(param_grid: Dict[str, List[float]]) -> Iterable[Dict[str, float]]:
    import itertools

    keys = list(param_grid.keys())
    values = [param_grid[key] for key in keys]
    for combo in itertools.product(*values):
        yield {key: value for key, value in zip(keys, combo)}
