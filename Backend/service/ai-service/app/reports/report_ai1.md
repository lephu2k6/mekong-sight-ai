# AI1 Report - 7-day Salinity Forecast

- Model version: `20260228081928`
- Provinces used: Bac Lieu, Ben Tre, Ca Mau, Kien Giang, Soc Trang

## Dataset
- Granularity: daily province-level.
- Features: lag salinity, lag weather, rolling stats, seasonality, province one-hot.
- Split: 70% train, 15% val, 15% test (time-ordered, no shuffle).

## Metrics (day1/day3/day7)
| horizon | model | mae | rmse |
| --- | --- | --- | --- |
| 1 | baseline_linear | 0.3855 | 0.4561 |
| 1 | xgboost | 0.6118 | 0.7344 |
| 3 | baseline_linear | 0.4913 | 0.571 |
| 3 | xgboost | 0.7262 | 0.8724 |
| 7 | baseline_linear | 0.7402 | 0.8392 |
| 7 | xgboost | 1.1988 | 1.4184 |

## Full Metrics (day1..day7)
| horizon | model | mae | rmse |
| --- | --- | --- | --- |
| 1 | baseline_linear | 0.3855 | 0.4561 |
| 1 | xgboost | 0.6118 | 0.7344 |
| 2 | baseline_linear | 0.4085 | 0.4797 |
| 2 | xgboost | 0.7144 | 0.8614 |
| 3 | baseline_linear | 0.4913 | 0.571 |
| 3 | xgboost | 0.7262 | 0.8724 |
| 4 | baseline_linear | 0.499 | 0.581 |
| 4 | xgboost | 0.8612 | 1.0474 |
| 5 | baseline_linear | 0.5503 | 0.6417 |
| 5 | xgboost | 0.9567 | 1.156 |
| 6 | baseline_linear | 0.6417 | 0.7386 |
| 6 | xgboost | 1.0514 | 1.2668 |
| 7 | baseline_linear | 0.7402 | 0.8392 |
| 7 | xgboost | 1.1988 | 1.4184 |

## Error by Season (dry vs rainy)
| model | horizon | season | mae | rmse | sample_size |
| --- | --- | --- | --- | --- | --- |
| baseline_linear | 1 | dry | 0.4655 | 0.529 | 115 |
| baseline_linear | 1 | rainy | 0.3221 | 0.3886 | 145 |
| baseline_linear | 3 | dry | 0.603 | 0.6627 | 115 |
| baseline_linear | 3 | rainy | 0.4027 | 0.4862 | 145 |
| baseline_linear | 7 | dry | 0.9285 | 0.9803 | 115 |
| baseline_linear | 7 | rainy | 0.5908 | 0.7077 | 145 |
| xgboost | 1 | dry | 0.9526 | 0.9979 | 115 |
| xgboost | 1 | rainy | 0.3416 | 0.4211 | 145 |
| xgboost | 3 | dry | 1.1385 | 1.1844 | 115 |
| xgboost | 3 | rainy | 0.3993 | 0.5022 | 145 |
| xgboost | 7 | dry | 1.8844 | 1.9243 | 115 |
| xgboost | 7 | rainy | 0.6551 | 0.8191 | 145 |

## Charts
- Error by season chart: `C:/Users/Administrator/Desktop/Mekong-sight-AI/Backend/service/ai-service/app/reports/charts/error_by_season.png`
- Actual vs predicted chart: `C:/Users/Administrator/Desktop/Mekong-sight-AI/Backend/service/ai-service/app/reports/charts/actual_vs_pred_bac_lieu.png`
- Actual vs predicted chart: `C:/Users/Administrator/Desktop/Mekong-sight-AI/Backend/service/ai-service/app/reports/charts/actual_vs_pred_ben_tre.png`
- Actual vs predicted chart: `C:/Users/Administrator/Desktop/Mekong-sight-AI/Backend/service/ai-service/app/reports/charts/actual_vs_pred_ca_mau.png`
- Actual vs predicted chart: `C:/Users/Administrator/Desktop/Mekong-sight-AI/Backend/service/ai-service/app/reports/charts/actual_vs_pred_kien_giang.png`
- Actual vs predicted chart: `C:/Users/Administrator/Desktop/Mekong-sight-AI/Backend/service/ai-service/app/reports/charts/actual_vs_pred_soc_trang.png`

## Limitations
- Model is province-level; not optimized for per-farm microclimate.
- Missing weather values are interpolated and can reduce reliability.
- Direct multi-step forecasts are independent between horizons.