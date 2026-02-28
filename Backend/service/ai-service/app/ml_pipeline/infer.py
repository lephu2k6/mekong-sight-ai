from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional

import joblib
import pandas as pd

from .config import DEFAULT_METADATA_PATH
from .data_loader import build_daily_dataset, normalize_province_name
from .feature_builder import build_feature_frame, encode_features


@dataclass
class ForecastPoint:
    day_ahead: int
    date: str
    salinity_pred: float


@dataclass
class ForecastResult:
    province: str
    as_of: str
    model_version: str
    forecast: List[ForecastPoint]


class ForecastError(Exception):
    def __init__(self, status_code: int, message: str):
        super().__init__(message)
        self.status_code = status_code
        self.message = message


class ForecastService:
    def __init__(self, metadata_path: Path = DEFAULT_METADATA_PATH):
        if not metadata_path.exists():
            raise ForecastError(404, "Model metadata chưa tồn tại. Hãy train AI1 trước.")
        self.metadata_path = metadata_path
        self.metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
        self.models: Dict[int, object] = {}
        self._load_models()

    def _load_models(self) -> None:
        for horizon in self.metadata.get("horizons", []):
            model_path = self.metadata_path.parent / f"salinity_day{horizon}.pkl"
            if not model_path.exists():
                raise ForecastError(404, f"Thiếu model file: {model_path.name}")
            self.models[int(horizon)] = joblib.load(model_path)

    def _load_daily_dataset(self) -> pd.DataFrame:
        artifacts = self.metadata.get("artifacts", {})
        prepared_path = Path(artifacts.get("prepared_daily_csv", ""))
        if prepared_path.exists():
            frame = pd.read_csv(prepared_path)
            frame["date"] = pd.to_datetime(frame["date"], errors="coerce").dt.normalize()
            return frame

        data_sources = self.metadata.get("data_sources", {})
        weather_csv = Path(data_sources.get("weather_csv", ""))
        local_dataset_raw = data_sources.get("local_dataset")
        local_dataset = Path(local_dataset_raw) if local_dataset_raw else None
        use_supabase_fallback = bool(data_sources.get("supabase_fallback", False))
        if not weather_csv.exists():
            raise ForecastError(500, "Không tìm thấy weather CSV để rebuild dữ liệu infer.")
        return build_daily_dataset(
            weather_csv_path=weather_csv,
            local_dataset_path=local_dataset if local_dataset and local_dataset.exists() else None,
            use_supabase_fallback=use_supabase_fallback,
        )

    def forecast(self, province: str, as_of: Optional[str] = None) -> ForecastResult:
        normalized_province = normalize_province_name(province or "")
        if not normalized_province:
            raise ForecastError(400, "Thiếu province hợp lệ.")
        if normalized_province not in self.metadata.get("provinces", []):
            raise ForecastError(404, f"Không có dữ liệu/model cho tỉnh: {province}")

        base_daily = self._load_daily_dataset()
        feature_frame, feature_cols, _ = build_feature_frame(base_daily, include_targets=False)
        province_frame = feature_frame[feature_frame["province"] == normalized_province].copy()
        province_frame = province_frame.dropna(subset=feature_cols)
        if province_frame.empty:
            raise ForecastError(422, "Không đủ lịch sử dữ liệu để tạo feature dự báo.")

        if as_of:
            try:
                as_of_dt = pd.to_datetime(as_of).normalize()
            except Exception as exc:
                raise ForecastError(400, "as_of phải đúng định dạng YYYY-MM-DD.") from exc
            province_frame = province_frame[province_frame["date"] <= as_of_dt]
        if province_frame.empty:
            raise ForecastError(422, "Không tìm thấy dữ liệu hợp lệ trước mốc as_of.")

        latest_row = province_frame.sort_values("date").iloc[[-1]].copy()
        as_of_date = pd.Timestamp(latest_row["date"].iloc[0]).date()
        province_cols = self.metadata.get("province_dummy_columns", [])
        x_latest = encode_features(latest_row, feature_cols, province_cols)
        expected_cols = self.metadata.get("feature_columns", [])
        for column in expected_cols:
            if column not in x_latest.columns:
                x_latest[column] = 0
        x_latest = x_latest[expected_cols]

        points: List[ForecastPoint] = []
        for horizon, model in sorted(self.models.items()):
            pred = float(model.predict(x_latest)[0])
            points.append(
                ForecastPoint(
                    day_ahead=int(horizon),
                    date=(as_of_date + timedelta(days=int(horizon))).strftime("%Y-%m-%d"),
                    salinity_pred=round(pred, 4),
                )
            )

        return ForecastResult(
            province=normalized_province,
            as_of=as_of_date.strftime("%Y-%m-%d"),
            model_version=self.metadata.get("model_version", "unknown"),
            forecast=points,
        )

