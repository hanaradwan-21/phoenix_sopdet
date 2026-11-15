# Data audit (what we checked before touching the app)

## NASA POWER daily files
| | Egypt (`egypt_weather_clean.csv`) | India (`india_weather_clean.csv`) |
|---|---|---|
| Point | El-Hamoul, 31.3264°N 31.1517°E, elevation 0.82 m (MERRA-2 cell avg) | Ludhiana, 30.8954°N 76.0034°E, 315.93 m |
| Dates | 2021-01-01 → 2026-03-14 | 2021-01-01 → 2026-11-11 |
| Days | 1,899 (raw 1,899) | 2,141 (raw 2,144) |
| Missing | none | `ALLSKY_SFC_SW_DWN`: 2 days (left empty). 3 trailing raw days (2026-11-12..14) are −999 and were dropped by cleaning |
| Duplicates / gaps | none | none |

* Cleaned files equal the original POWER files value-for-value (0 differences). `weather_daily_clean.csv` is exactly Egypt ∪ India.
* Logical checks pass: T2M_MIN ≤ T2M ≤ T2M_MAX, RH2M ≤ 100, GWET ∈ [0,1], precipitation ≥ 0.
* **Common period** for a fair comparison: 2021-01-01 → 2026-03-14 (1,899 days).
* "Clean" does not mean "right for a farm": each value is a coarse grid-cell average (MERRA-2 0.5°×0.625° ≈ 56×60 km; CERES SYN1deg 1°). One point cannot represent a country.
* `GWETROOT` at the Egypt point is almost constant (range 0.58–0.77, monthly means 0.58–0.64; the same 2-decimal value repeats for up to 183 days). It carries little day-to-day information.

## Variable dictionary (from the raw file headers)
T2M, T2M_MAX, T2M_MIN (°C), RH2M (%), WS2M (m/s, **2 m**), GWETTOP, GWETROOT (**MERRA-2**, dimensionless 0–1, **not SMAP**), PRECTOTCORR (mm/day), ALLSKY_SFC_SW_DWN (**CERES SYN1deg**, MJ/m²/day).

## Crop profiles
`crop_profiles.csv` ≡ `crop_profiles_clean.csv` (16 rows: 8 crops × 2 points). No source, method or unit definition for `Suitability_Index` (values such as 8200, no scale), `Base_Yield_Tons_Ha`, `Irrigation_Requirement_mm` (gross or net unknown). Treated as **unverified**: `Suitability_Index` is not used anywhere; yield is display-only; the irrigation figure is only summed in the planner and labelled unverified.

## Things in the old prototype that were not real
NDVI, SMAP soil moisture (labelled m³/m³), rainfall "IMERG", MODIS/Landsat/ECOSTRESS layers, field polygons and per-field map values, "field status" words, crop history, the 0–100 scores and priority fit, the confidence "Low" pill, and the guided farm check were all generated or hard-coded. They were removed or replaced as described in the README.
