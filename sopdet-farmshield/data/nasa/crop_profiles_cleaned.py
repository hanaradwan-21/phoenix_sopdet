
import pandas as pd
import numpy as np

# Load the dataset
df = pd.read_csv("crop_profiles.csv")

# 1. Remove duplicate rows
df = df.drop_duplicates()

# 2. Clean text columns
text_cols = ["Country", "Region", "Crop_Name", "Season"]

for col in text_cols:
    df[col] = df[col].astype("string").str.strip()

# 3. Standardize categorical text
df["Country"] = df["Country"].str.title()
df["Region"] = df["Region"].str.title()
df["Crop_Name"] = df["Crop_Name"].str.title()
df["Season"] = df["Season"].str.title()

# 4. Convert numerical columns
num_cols = [
    "Suitability_Index",
    "Base_Yield_Tons_Ha",
    "Irrigation_Requirement_mm"
]

for col in num_cols:
    df[col] = pd.to_numeric(df[col], errors="coerce")

# 5. Check missing values
print("Missing values:")
print(df.isnull().sum())

# 6. Check invalid numerical values
print(df.describe())

# 7. Save cleaned dataset
df.to_csv("crop_profiles_clean.csv", index=False)

print("Crop dataset cleaned successfully!")
