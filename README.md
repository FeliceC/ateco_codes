# ATECO 2025 Codes API with Profitability Coefficients

Italian ATECO 2025 business classification codes with profitability coefficients, deployed as a static site on GitHub Pages.

## Live Demo

**URL:** `https://FeliceC.github.io/ateco_codes`

The web interface allows searching and filtering ATECO codes directly in the browser.

## Data

### `ateco_codes_with_profitability.json`
JSON file containing 2723 ATECO codes with profitability coefficients.

- **Total ATECO codes:** 2723
- **Codes with profitability data:** 2597 (95.37%)
- **Format:** UTF-8 encoded JSON

### `ateco_codes_with_profitability.sql`
SQL INSERT statements ready for PostgreSQL.

## Web Interface Features

- **Search** by code or description (Italian/English)
- **Filter** by profitability range (0.0 - 1.0)
- **Statistics** overview (totals, coverage, distribution)

## Data Format

### Single Code
```json
{
  "code": "01.1",
  "title_it": "Coltivazione di colture agricole non permanenti",
  "title_en": "Growing of non-perennial crops",
  "hierarchy": 3,
  "parent_code": "01",
  "profitability_coefficient": 0.67,
  "profitability_description": "Altre attività economiche",
  "profitability_category": "altre_attivita",
  "has_profitability_data": true
}
```

## Profitability Categories

| Category | Coefficient |
|----------|-------------|
| Construction & Real Estate (41-43, 68) | 86% |
| Professional/Financial Services (64-75, 85-88) | 78% |
| Other Economic Activities | 67% |
| Trade Intermediaries (46.1) | 62% |
| Street Trade - Other Products (47.82-47.89) | 54% |
| Food & Beverage Industry (10-11) | 40% |
| Wholesale/Retail Trade | 40% |
| Accommodation & Food Services (55-56) | 40% |

## Local Development

```bash
git clone https://github.com/FeliceC/ateco_codes.git
cd ateco_codes
npm install

# Run tests
npm test

# Build static site into ./dist
npm run build

# Serve locally
npx serve dist
```

## Deployment

Push to `main` triggers GitHub Actions which:
1. Installs dependencies
2. Runs tests
3. Builds the static site
4. Deploys to GitHub Pages

## Data Sources

- **ATECO Codes:** ISTAT - ATECO 2025 classification
- **Profitability Coefficients:** Sector analysis estimates (indicative values, expressed as decimals 0.0-1.0)

## License

ATECO codes are public data from ISTAT. Code is licensed under MIT.
