
import pandas as pd
import numpy as np

# Load NASA data
df = pd.read_csv(
    "egypt.csv",
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

# 5. Handle NASA missing values
df = df.replace(-999, np.nan)

# 6. Add location information
df["Country"] = "Egypt"
df["Region"] = "El-Hamoul"
df["Latitude"] = 31.3264
df["Longitude"] = 31.1517

# 7. Check missing values
print(df.isnull().sum())

# 8. Save cleaned dataset
df.to_csv("egypt_weather_clean.csv", index=False)

print("Egypt weather cleaned successfully!")
