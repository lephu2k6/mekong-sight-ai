# AI1 Report - 7-day Salinity Forecast

- Model version: `20260320082909`
- Provinces used: Bac Lieu, Ben Tre, Ca Mau, Kien Giang, Soc Trang

## Dataset
- Granularity: daily province-level.
- Baseline features: lag salinity, lag weather, rolling stats, seasonality, province one-hot.
- XGBoost features: baseline features plus cyclic time, salinity trend, short-rainfall context, and dry-season interactions.
- Split: 70% train, 15% val, 15% test (time-ordered, no shuffle).

## Metrics (day1/day3/day7)
| horizon | model | mae | rmse |
| --- | --- | --- | --- |
| 1 | baseline_linear | 0.4689 | 0.5509 |
| 1 | xgboost | 0.314 | 0.3822 |
| 3 | baseline_linear | 0.5987 | 0.6939 |
| 3 | xgboost | 0.4102 | 0.4856 |
| 7 | baseline_linear | 0.9059 | 1.0289 |
| 7 | xgboost | 0.5727 | 0.6629 |

## Champion by Horizon (production)
| horizon | champion_model |
| --- | --- |
| day1 | xgboost |
| day2 | xgboost |
| day3 | xgboost |
| day4 | xgboost |
| day5 | xgboost |
| day6 | xgboost |
| day7 | xgboost |

## Full Metrics (day1..day7)
| horizon | model | mae | rmse |
| --- | --- | --- | --- |
| 1 | baseline_linear | 0.4689 | 0.5509 |
| 1 | xgboost | 0.314 | 0.3822 |
| 2 | baseline_linear | 0.4797 | 0.5638 |
| 2 | xgboost | 0.3497 | 0.4203 |
| 3 | baseline_linear | 0.5987 | 0.6939 |
| 3 | xgboost | 0.4102 | 0.4856 |
| 4 | baseline_linear | 0.6192 | 0.7173 |
| 4 | xgboost | 0.428 | 0.5086 |
| 5 | baseline_linear | 0.7151 | 0.8258 |
| 5 | xgboost | 0.4481 | 0.5308 |
| 6 | baseline_linear | 0.8117 | 0.933 |
| 6 | xgboost | 0.5272 | 0.6117 |
| 7 | baseline_linear | 0.9059 | 1.0289 |
| 7 | xgboost | 0.5727 | 0.6629 |

## Rolling-origin Backtest Summary
| model | horizon | mae_mean | mae_std | rmse_mean | rmse_std | fold_count |
| --- | --- | --- | --- | --- | --- | --- |
| baseline_linear | 1 | 0.3515 | 0.1368 | 0.4109 | 0.1421 | 8 |
| xgboost | 1 | 0.2301 | 0.0537 | 0.2884 | 0.057 | 8 |
| baseline_linear | 2 | 0.3791 | 0.149 | 0.4412 | 0.1537 | 8 |
| xgboost | 2 | 0.2456 | 0.0738 | 0.3044 | 0.0778 | 8 |
| baseline_linear | 3 | 0.4512 | 0.2156 | 0.5182 | 0.2159 | 8 |
| xgboost | 3 | 0.2601 | 0.0999 | 0.3195 | 0.1032 | 8 |
| baseline_linear | 4 | 0.4934 | 0.2404 | 0.56 | 0.2402 | 8 |
| xgboost | 4 | 0.2701 | 0.1207 | 0.3301 | 0.1241 | 8 |
| baseline_linear | 5 | 0.5681 | 0.3086 | 0.6347 | 0.3054 | 8 |
| xgboost | 5 | 0.2808 | 0.1171 | 0.3417 | 0.1204 | 8 |
| baseline_linear | 6 | 0.6287 | 0.3505 | 0.6959 | 0.3451 | 8 |
| xgboost | 6 | 0.2957 | 0.1629 | 0.3533 | 0.1652 | 8 |
| baseline_linear | 7 | 0.6502 | 0.3633 | 0.717 | 0.3594 | 8 |
| xgboost | 7 | 0.3243 | 0.1823 | 0.3875 | 0.1883 | 8 |

## Error by Season (dry vs rainy)
| model | horizon | season | mae | rmse | sample_size |
| --- | --- | --- | --- | --- | --- |
| baseline_linear | 1 | dry | 0.5747 | 0.6344 | 114 |
| baseline_linear | 1 | rainy | 0.3857 | 0.4751 | 145 |
| baseline_linear | 3 | dry | 0.8322 | 0.8766 | 114 |
| baseline_linear | 3 | rainy | 0.4151 | 0.5059 | 145 |
| baseline_linear | 7 | dry | 1.2272 | 1.2672 | 114 |
| baseline_linear | 7 | rainy | 0.6532 | 0.7927 | 145 |
| xgboost | 1 | dry | 0.3668 | 0.4362 | 114 |
| xgboost | 1 | rainy | 0.2725 | 0.3337 | 145 |
| xgboost | 3 | dry | 0.4949 | 0.5594 | 114 |
| xgboost | 3 | rainy | 0.3435 | 0.4185 | 145 |
| xgboost | 7 | dry | 0.7094 | 0.7655 | 114 |
| xgboost | 7 | rainy | 0.4652 | 0.5694 | 145 |

## Threshold Accuracy Summary
| model | horizon | tolerance_ppt | hit_count | total_count | accuracy_pct | target_accuracy_pct | accuracy_status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| baseline_linear | 1 | 0.75 | 212 | 259 | 81.85 | 75.0 | pass |
| xgboost | 1 | 0.75 | 246 | 259 | 94.98 | 75.0 | pass |
| baseline_linear | 2 | 0.75 | 206 | 259 | 79.54 | 75.0 | pass |
| xgboost | 2 | 0.75 | 243 | 259 | 93.82 | 75.0 | pass |
| baseline_linear | 3 | 1.0 | 224 | 259 | 86.49 | 65.0 | pass |
| xgboost | 3 | 1.0 | 252 | 259 | 97.3 | 65.0 | pass |
| baseline_linear | 4 | 1.0 | 220 | 259 | 84.94 | 65.0 | pass |
| xgboost | 4 | 1.0 | 252 | 259 | 97.3 | 65.0 | pass |
| baseline_linear | 5 | 1.0 | 189 | 259 | 72.97 | 65.0 | pass |
| xgboost | 5 | 1.0 | 248 | 259 | 95.75 | 65.0 | pass |
| baseline_linear | 6 | 1.25 | 212 | 259 | 81.85 | 55.0 | pass |
| xgboost | 6 | 1.25 | 256 | 259 | 98.84 | 55.0 | pass |
| baseline_linear | 7 | 1.25 | 191 | 259 | 73.75 | 55.0 | pass |
| xgboost | 7 | 1.25 | 253 | 259 | 97.68 | 55.0 | pass |

## Acceptance Summary (80% Gate)
| horizon | selected_model | evaluation_model | selected_rmse | evaluation_rmse | baseline_rmse | vs_baseline_status | within_tolerance_accuracy_pct | tolerance_ppt | target_accuracy_pct | accuracy_status | selection_status | regression_status | overall_status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | xgboost | xgboost | 0.38 | 0.38 | 0.55 | pass | 94.98 | 0.75 | 75.0 | pass | pass | pass | pass |
| 2 | xgboost | xgboost | 0.42 | 0.42 | 0.56 | pass | 93.82 | 0.75 | 75.0 | pass | pass | not_checked | pass |
| 3 | xgboost | xgboost | 0.49 | 0.49 | 0.69 | pass | 97.3 | 1.0 | 65.0 | pass | pass | pass | pass |
| 4 | xgboost | xgboost | 0.51 | 0.51 | 0.72 | pass | 97.3 | 1.0 | 65.0 | pass | pass | not_checked | pass |
| 5 | xgboost | xgboost | 0.53 | 0.53 | 0.83 | pass | 95.75 | 1.0 | 65.0 | pass | pass | not_checked | pass |
| 6 | xgboost | xgboost | 0.61 | 0.61 | 0.93 | pass | 98.84 | 1.25 | 55.0 | pass | pass | not_checked | pass |
| 7 | xgboost | xgboost | 0.66 | 0.66 | 1.03 | pass | 97.68 | 1.25 | 55.0 | pass | pass | pass | pass |

## LSTM Pilot
| horizon | model | mae | rmse | status | note | best_hidden_size | best_dropout | best_val_rmse |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | lstm_pilot | nan | nan | skipped | LSTM pilot disabled by flag. | None | None | None |
| 2 | lstm_pilot | nan | nan | skipped | LSTM pilot disabled by flag. | None | None | None |
| 3 | lstm_pilot | nan | nan | skipped | LSTM pilot disabled by flag. | None | None | None |
| 4 | lstm_pilot | nan | nan | skipped | LSTM pilot disabled by flag. | None | None | None |
| 5 | lstm_pilot | nan | nan | skipped | LSTM pilot disabled by flag. | None | None | None |
| 6 | lstm_pilot | nan | nan | skipped | LSTM pilot disabled by flag. | None | None | None |
| 7 | lstm_pilot | nan | nan | skipped | LSTM pilot disabled by flag. | None | None | None |

## Regression Check vs Previous Version
| horizon | previous_rmse | current_rmse | pct_change | status |
| --- | --- | --- | --- | --- |
| 1 | 0.3822192904453062 | 0.3822192904453062 | 0.0% | pass |
| 3 | 0.4663779853841315 | 0.48557809264009366 | 4.12% | pass |
| 7 | 0.6454041005345024 | 0.6628882985055694 | 2.71% | pass |

Regression gate note:
- PASS: No horizon exceeded 10% RMSE degradation threshold.

## Charts
- Error by season chart: `/Users/macbook2024/Desktop/mekong-sight-ai/Backend/service/ai-service/app/reports/charts/error_by_season.png`

## Limitations
- Model is province-level; not optimized for per-farm microclimate.
- Missing weather values are interpolated and can reduce reliability.
- Direct multi-step forecasts are independent between horizons.