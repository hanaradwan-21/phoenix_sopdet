# SOPDET FARMSHIELD
### From Stars to Soil
**Version 2.0 | NASA POWER Data Edition**

An interactive crop rotation exploration platform developed by **Team PHOENIX SOPDET** for the **NASA Space Apps Challenge 2026**.

> **Project Disclaimer:** SOPDET FARMSHIELD is an independent student project. It is not affiliated with, sponsored by, or endorsed by NASA. NASA POWER is used as a source of historical climate data.

---

## About the Project

SOPDET FARMSHIELD is an interactive tool designed to help farmers explore and compare crop rotation plans across four growing seasons.

The platform combines historical climate data from NASA POWER, crop reference profiles, and transparent rule-based checks to make agricultural information easier to explore and understand.

Users can examine three crop rotation scenarios, compare seasonal conditions, identify repeated botanical families, and review potential seasonal mismatches.

The project is inspired by Sopdet, the ancient Egyptian name associated with the star Sirius. It connects Egypt's agricultural heritage with modern Earth observation data.

SOPDET FARMSHIELD supports the farmer's exploration and understanding of available information. It does not replace the farmer's experience or decision-making.

## The Problem

Crop rotation planning involves several interconnected factors, including growing seasons, crop characteristics, botanical families, and climate conditions.

When these factors are considered separately, comparing alternative crop rotation plans can be challenging.

SOPDET FARMSHIELD brings these elements together in one interactive platform, helping users explore different scenarios and understand potential issues through organized data and visual comparisons.

## Key Features

- **Interactive Farm Setup:** Select between the supported agricultural locations in Egypt and India.
- **Climate Dashboard:** Explore historical climate information through interactive charts and indicators.
- **Crop Rotation Planner:** Edit and examine three scenarios across four growing seasons.
- **Scenario Comparison:** Compare current farming practice with two alternative rotation scenarios.
- **Botanical Family Checks:** Identify consecutive crops belonging to the same botanical family.
- **Seasonal Checks:** Highlight crops selected outside their listed growing seasons.
- **Irrigation Reference Summary:** Display the sum of listed irrigation inputs, clearly marked as unverified.
- **Location and Coverage:** Explore the selected location and its associated climate-data coverage.
- **Rule-Based Guide:** Explain data variables and display calculations based on the selected location without generating predictions or agricultural recommendations.
- **RTL/LTR Interface:** Support right-to-left and left-to-right layouts while maintaining the project's visual identity.

## Supported Locations and Climate Data

The current version includes two selected locations:

| Location | Coordinates | Available Daily Data |
|---|---|---|
| El-Hamoul, Egypt | 31.3264° N, 31.1517° E | Jan 1, 2021 – Mar 14, 2026 |
| Ludhiana, India | 30.8954° N, 76.0034° E | Jan 1, 2021 – Nov 11, 2026 |

For a fair comparison between the two locations, the application uses their shared data period:

**January 1, 2021 – March 14, 2026 (1,899 days).**

The application uses nine climate variables, with their names, units, and source products read from the original NASA POWER file headers.

The dataset includes variables from:
- **MERRA-2**, including GWETTOP and GWETROOT.
- **CERES SYN1deg**, including ALLSKY_SFC_SW_DWN.
- **WS2M**, representing wind speed at 2 meters.

These are gridded data values associated with specific coordinates. They are not direct measurements from individual weather stations or agricultural fields.

## Data Sources and Transparency

The application distinguishes between different types of information to avoid presenting estimates or unverified values as verified scientific measurements.

| Data Label | Meaning |
|---|---|
| **NASA POWER Data** | Historical daily climate values obtained from NASA POWER files. |
| **Illustrative Calculation** | Calculations, counts, comparisons, and rule checks based on available data or user inputs. These are not predictions. |
| **Unverified Input** | Crop profile values whose sources, definitions, or measurement units have not yet been independently verified. |
| **Prediction** | Not implemented. The project does not currently include a predictive model. |

Numeric crop profile fields such as `suitabilityIndex`, `baseYieldTHa`, and `irrigationMm` are treated as unverified inputs. They are not presented as validated scientific measurements.

## Data Validation and Integrity

Data integrity is an important part of this version.

The build process uses `scripts/build-data.mjs` to:

- Compare cleaned climate files against their original source files value by value.
- Verify that the combined daily weather dataset matches the union of the Egypt and India datasets.
- Check date continuity and identify duplicate dates.
- Verify consistency between the crop profile files.
- Generate the application data files in `src/data/`.

The build process stops when a data integrity check fails.

For more details, see **[Data Audit](docs/DATA-AUDIT.md)**.

## Technology Stack

| Technology | Purpose |
|---|---|
| React.js | Interactive user interface and application components |
| JavaScript | Application logic and data processing |
| HTML5 | Application structure |
| CSS3 | Visual design and responsive layouts |
| JSON | Structured application and crop profile data |
| CSV | Historical climate datasets |
| esbuild | Build and data-generation tooling |
| NASA POWER | Historical climate data source |

## Getting Started

### Requirements

- Node.js 18 or later
- npm

### Installation

Clone the repository and navigate to the project directory:

```bash
npm install
```

### Build the Application

```bash
npm run build
```

This validates the data files and generates the production build in `dist/`.

### Preview the Production Build

```bash
npm run preview
```

Open:

```text
http://localhost:4173
```

### Start the Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

Refresh the browser after making changes.

### Run Tests

Run the data and path checks:

```bash
npm test
```

For browser testing, install Playwright and Chromium:

```bash
npm i -D playwright
npx playwright install chromium
npm run test:browser
```

### Offline Access

The generated `dist/index.html` can also be opened directly from the local file system. The application does not require a backend server for this mode. Google Fonts may require an internet connection; local font fallbacks are provided.

## Project Structure

```text
SOPDET-FARMSHIELD/
├── data/
│   └── nasa/
├── docs/
│   └── DATA-AUDIT.md
├── public/
│   └── media/
├── scripts/
│   └── build-data.mjs
├── src/
│   ├── components/
│   ├── pages/
│   ├── data/
│   ├── nasa.js
│   └── data.js
├── tests/
├── dist/
└── README.md
```

## Current Scope and Limitations

SOPDET FARMSHIELD is an exploratory crop rotation tool with a defined data scope.

- Only two selected locations are currently supported.
- The Egyptian climate dataset ends on March 14, 2026, and the application indicates this data coverage limit.
- Satellite data layers such as NDVI, SMAP, Landsat, IMERG, ECOSTRESS, and GRACE are not currently integrated.
- The map provides a schematic representation of the MERRA-2 grid cell associated with the selected coordinates, not satellite imagery or detailed field boundaries.
- Some crop profile values remain unverified and should not be interpreted as validated agricultural measurements.
- The application does not include machine learning, yield prediction, live weather data, or a predictive model.
- There is no backend or remote API. Farm settings and language preferences are stored locally in the browser using `localStorage`.

## Future Development

Planned improvements include:

- Expanding climate data coverage to additional agricultural locations.
- Integrating satellite and Earth observation datasets with appropriate geographic and temporal coverage.
- Improving crop profile documentation and verifying missing sources, definitions, and units.
- Enhancing crop rotation checks with additional documented agricultural factors.
- Adding field boundaries and more detailed geographic information.
- Improving data updates, testing, and user experience.

Any future predictive functionality would require appropriate verified datasets, documented methodology, and independent evaluation before being introduced.

## My Contribution

I was responsible for the coding and technical implementation of SOPDET FARMSHIELD.

My contribution focused on developing the application structure and user interface, implementing interactive features, organizing application logic, and integrating the climate and crop data into the platform.

I also worked on presenting complex information through clear dashboards, visualizations, comparisons, and user-facing explanations.

## Team

**PHOENIX SOPDET**

NASA Space Apps Challenge 2026

**From Stars to Soil.**
