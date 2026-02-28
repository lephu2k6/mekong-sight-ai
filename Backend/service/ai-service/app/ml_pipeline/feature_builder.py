from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Sequence, Tuple

import pandas as pd

from .config import DEFAULT_DRY_MONTHS, FORECAST_HORIZONS


@dataclass
class SplitResult:
    train: pd.DataFrame
    val: pd.DataFrame
    test: pd.DataFrame
    train_end_date: pd.Timestamp
    val_end_date: pd.Timestamp


def build_feature_frame(
    daily_df: pd.DataFrame,
    dry_months: Sequence[int] = DEFAULT_DRY_MONTHS,
    include_targets: bool = True,
) -> Tuple[pd.DataFrame, List[str], List[str]]:
    required_base = {"date", "province", "salinity_daily", "rain_mm", "temp_c"}
    missing = required_base - set(daily_df.columns)
    if missing:
        raise ValueError(f"Thiếu cột bắt buộc trong daily dataset: {sorted(missing)}")

    frames: List[pd.DataFrame] = []
    for _, group in daily_df.groupby("province"):
        g = group.sort_values("date").copy()
        for lag in range(1, 15):
            g[f"sal_t-{lag}"] = g["salinity_daily"].shift(lag)
        for lag in range(1, 8):
            g[f"rain_t-{lag}"] = g["rain_mm"].shift(lag)
            g[f"temp_t-{lag}"] = g["temp_c"].shift(lag)

        shifted_sal = g["salinity_daily"].shift(1)
        shifted_rain = g["rain_mm"].shift(1)
        shifted_temp = g["temp_c"].shift(1)
        g["sal_3d_avg"] = shifted_sal.rolling(3).mean()
        g["sal_7d_avg"] = shifted_sal.rolling(7).mean()
        g["rain_7d_sum"] = shifted_rain.rolling(7).sum()
        g["temp_7d_avg"] = shifted_temp.rolling(7).mean()
        frames.append(g)

    feature_frame = pd.concat(frames, ignore_index=True)
    feature_frame["date"] = pd.to_datetime(feature_frame["date"], errors="coerce").dt.normalize()
    feature_frame["month"] = feature_frame["date"].dt.month
    feature_frame["day_of_year"] = feature_frame["date"].dt.dayofyear
    feature_frame["is_dry_season"] = feature_frame["month"].isin(dry_months).astype(int)

    target_cols: List[str] = []
    if include_targets:
        with_targets = []
        for _, group in feature_frame.groupby("province"):
            g = group.sort_values("date").copy()
            for horizon in FORECAST_HORIZONS:
                target_col = f"y_day{horizon}"
                g[target_col] = g["salinity_daily"].shift(-horizon)
                if target_col not in target_cols:
                    target_cols.append(target_col)
            with_targets.append(g)
        feature_frame = pd.concat(with_targets, ignore_index=True)

    feature_cols: List[str] = (
        [f"sal_t-{lag}" for lag in range(1, 15)]
        + [f"rain_t-{lag}" for lag in range(1, 8)]
        + [f"temp_t-{lag}" for lag in range(1, 8)]
        + ["sal_3d_avg", "sal_7d_avg", "rain_7d_sum", "temp_7d_avg", "month", "day_of_year", "is_dry_season"]
    )

    feature_frame = feature_frame.sort_values(["date", "province"]).reset_index(drop=True)
    return feature_frame, feature_cols, target_cols


def filter_valid_provinces(
    frame: pd.DataFrame,
    feature_cols: Sequence[str],
    target_cols: Sequence[str],
    min_valid_days: int,
) -> pd.DataFrame:
    needed = list(feature_cols) + list(target_cols)
    valid_rows = frame.dropna(subset=needed).copy()
    counts = valid_rows.groupby("province").size()
    keep_provinces = counts[counts >= min_valid_days].index
    return valid_rows[valid_rows["province"].isin(keep_provinces)].copy()


def time_series_split(frame: pd.DataFrame, train_ratio: float = 0.70, val_ratio: float = 0.15) -> SplitResult:
    if frame.empty:
        raise ValueError("Feature frame rỗng, không thể split.")
    unique_dates = sorted(frame["date"].dropna().unique())
    if len(unique_dates) < 10:
        raise ValueError("Không đủ số ngày để split train/val/test.")

    train_idx = max(1, int(len(unique_dates) * train_ratio)) - 1
    val_idx = max(train_idx + 1, int(len(unique_dates) * (train_ratio + val_ratio))) - 1
    val_idx = min(val_idx, len(unique_dates) - 2)

    train_end_date = pd.Timestamp(unique_dates[train_idx])
    val_end_date = pd.Timestamp(unique_dates[val_idx])

    train = frame[frame["date"] <= train_end_date].copy()
    val = frame[(frame["date"] > train_end_date) & (frame["date"] <= val_end_date)].copy()
    test = frame[frame["date"] > val_end_date].copy()

    if train.empty or val.empty or test.empty:
        raise ValueError("Split 70/15/15 không hợp lệ, một trong các tập bị rỗng.")

    return SplitResult(train=train, val=val, test=test, train_end_date=train_end_date, val_end_date=val_end_date)


def province_dummy_columns(provinces: Sequence[str]) -> List[str]:
    return [f"province__{province.replace(' ', '_').lower()}" for province in sorted(provinces)]


def encode_features(
    frame: pd.DataFrame,
    feature_cols: Sequence[str],
    province_columns: Sequence[str],
) -> pd.DataFrame:
    x = frame.loc[:, feature_cols].copy()
    dummies = pd.get_dummies(frame["province"], prefix="province", prefix_sep="__")
    dummies.columns = [column.replace(" ", "_").lower() for column in dummies.columns]
    for column in province_columns:
        if column not in dummies.columns:
            dummies[column] = 0
    dummies = dummies.loc[:, province_columns]
    encoded = pd.concat([x.reset_index(drop=True), dummies.reset_index(drop=True)], axis=1)
    return encoded

