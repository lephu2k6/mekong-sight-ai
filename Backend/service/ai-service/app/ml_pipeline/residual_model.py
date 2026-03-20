from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd


@dataclass
class ResidualXGBRegressor:
    baseline_model: object
    residual_model: object
    clip_min: float = 0.0

    def predict(self, features: pd.DataFrame) -> np.ndarray:
        baseline_pred = np.asarray(self.baseline_model.predict(features), dtype=float)
        residual_pred = np.asarray(self.residual_model.predict(features), dtype=float)
        combined = baseline_pred + residual_pred
        if self.clip_min is not None:
            combined = np.maximum(combined, float(self.clip_min))
        return combined


@dataclass
class AnchoredXGBRegressor:
    anchor_column: str
    delta_model: object
    delta_scale: float = 1.0
    clip_min: float = 0.0

    def predict(self, features: pd.DataFrame) -> np.ndarray:
        anchor = np.asarray(features[self.anchor_column], dtype=float)
        delta = np.asarray(self.delta_model.predict(features), dtype=float)
        combined = anchor + float(self.delta_scale) * delta
        if self.clip_min is not None:
            combined = np.maximum(combined, float(self.clip_min))
        return combined
