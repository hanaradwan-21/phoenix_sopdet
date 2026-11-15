
import pandas as pd

# Load cleaned weather datasets
egypt = pd.read_csv("egypt_weather_clean.csv")
india = pd.read_csv("india_weather_clean.csv")

# Combine rows vertically
weather_combined = pd.concat(
    [egypt, india],
    ignore_index=True
)

# Sort by country, region and date
weather_combined = weather_combined.sort_values(
    by=["Country", "Region", "DATE"]
)

# Check duplicates
weather_combined = weather_combined.drop_duplicates(
    subset=["Country", "Region", "DATE"]
)

# Save final weather dataset
weather_combined.to_csv(
    "weather_daily_clean.csv",
    index=False
)

print("Final weather dataset:")
print(weather_combined.shape)
print(weather_combined.head())

print("Missing values:")
print(weather_combined.isnull().sum())
