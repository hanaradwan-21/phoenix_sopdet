
import pandas as pd
import numpy as np

# Load NASA data
df = pd.read_csv(
    "india.csv",
    skiprows=17
)

# 1. Remove duplicates
df = df.drop_duplicates()

# 2. Create Date column
df["DATE"] = pd.to_datetime(
    df["YEAR"].astype(str) +
    df["DOY"].astype(str).str.zfill(3),
    format="%Y%j"
)

# 3. Remove YEAR and DOY
df = df.drop(columns=["YEAR", "DOY"])

# 4. Convert numerical columns
for col in df.columns:
    if col != "DATE":
        df[col] = pd.to_numeric(df[col], errors="coerce")

# 5. Convert NASA missing values
df = df.replace(-999, np.nan)

# 6. Remove completely empty weather records
weather_cols = [
    "T2M", "T2M_MAX", "T2M_MIN", "RH2M",
    "WS2M", "ALLSKY_SFC_SW_DWN",
    "GWETTOP", "GWETROOT", "PRECTOTCORR"
]

df = df.dropna(subset=weather_cols, how="all")

# 7. Add location information
df["Country"] = "India"
df["Region"] = "Ludhiana"
df["Latitude"] = 30.8954
df["Longitude"] = 76.0034

# 8. Check missing values
print(df.isnull().sum())

# 9. Save cleaned dataset
df.to_csv("india_weather_clean.csv", index=False)

print("India weather cleaned successfully!")
