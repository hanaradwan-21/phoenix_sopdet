import pandas as pd
import numpy as np

def read_power(path, country, region):
    # 1) نلاقي سطر نهاية الـ header بدل ما نحدد الرقم بإيدينا
    with open(path, encoding="utf-8") as f:
        for i, line in enumerate(f):
            if "-END HEADER-" in line:
                skip = i + 1
                break

    df = pd.read_csv(path, skiprows=skip)

    # 2) ناسا بتحط -999 للقيم الناقصة
    df = df.replace(-999, np.nan)

    # 3) نبني عمود date
    if "DOY" in df.columns:
        df["date"] = pd.to_datetime(
            df["YEAR"].astype(str) + df["DOY"].astype(str).str.zfill(3), format="%Y%j"
        )
    else:
        df["date"] = pd.to_datetime(dict(year=df["YEAR"], month=df["MO"], day=df["DY"]))

    # 4) ترتيب + شيل التكرار
    df = df.sort_values("date").drop_duplicates("date").reset_index(drop=True)

    # 5) نضيف الدولة والمنطقة
    df["Country"] = country
    df["Region"] = region
    return df

nasa_ludhiana = read_power("POWER_Point_Daily_20210101_20261114_030d90N_076d00E_LST.csv", "India", "Ludhiana")
nasa_hamoul   = read_power("POWER_Point_Daily_20210101_20260314_031d33N_031d15E_LST.csv", "Egypt", "Hamoul")
crops = pd.read_csv("crop_profiles.csv")

# افحصي الأول
print(crops[["Country", "Region", "Season"]].drop_duplicates())
print(nasa_ludhiana.isna().sum())
print(nasa_hamoul.isna().sum())