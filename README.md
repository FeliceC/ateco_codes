# ATECO 2025 Codes API with Profitability Coefficients

This project contains ATECO 2025 codes combined with profitability coefficients, available as a REST API deployed on GitHub Pages.

## 🚀 Live API

**API URL:** `https://FeliceC.github.io/ateco-codes`

**Interactive Demo:** Visit the URL above to use the web interface for searching and filtering ATECO codes.

## 📁 Files

### 1. `ateco_codes_with_profitability.json`
JSON file containing 2723 ATECO codes with profitability coefficients.

**Statistics:**
- **Total ATECO codes:** 2723
- **Codes with direct coefficient:** 2597 (95.4%)
- **Format:** UTF-8 encoded JSON

### 2. `ateco_codes_with_profitability.sql`
SQL file with INSERT statements including profitability coefficients.

**Features:**
- Direct integration of profitability column
- Complete coverage of all codes
- Ready for PostgreSQL execution

### 3. `api.js`
Serverless API handler with search and filtering capabilities.

### 4. `build.js`
Build script for GitHub Pages deployment.

### 5. `.github/workflows/api.yml`
GitHub Actions workflow for automatic deployment.

## 🛠 API Endpoints

### Base URL: `https://FeliceC.github.io/ateco-codes`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api` | Get all ATECO codes (paginated) |
| GET | `/api/search?q=keyword&lang=it` | Search by code or description |
| GET | `/api/code/{code}` | Get specific ATECO code |
| GET | `/api/stats` | Get database statistics |

### Query Parameters

- `q` - Search term (code or description)
- `lang` - Language: `it` (default) or `en`
- `profitability_min` - Minimum profitability (0.0-1.0)
- `profitability_max` - Maximum profitability (0.0-1.0)
- `limit` - Results per page (default: 50)
- `offset` - Pagination offset (default: 0)

## 📊 Examples

### Search for agricultural codes
```bash
curl "https://FeliceC.github.io/ateco-codes/api/search?q=agricoltura&lang=it"
```

### Get specific code
```bash
curl "https://FeliceC.github.io/ateco-codes/api/code/01.1"
```

### Filter by high profitability
```bash
curl "https://FeliceC.github.io/ateco-codes/api?profitability_min=0.70"
```

### Get statistics
```bash
curl "https://FeliceC.github.io/ateco-codes/api/stats"
```

## 🎯 Profitability Categories

- **Construction & Real Estate (41-42-43, 68):** 86%
- **Professional/Financial Services (64-65-66, 69-70-71-72-73-74-75, 85, 86-87-88):** 78%
- **Trade Intermediaries (46.1):** 62%
- **Street Trade - Other Products (47.82-47.89):** 54%
- **Other Economic Activities:** 67%
- **Food & Beverage Industry (10-11):** 40%
- **Wholesale/Retail Trade:** 40%
- **Street Trade - Food (47.81):** 40%
- **Accommodation & Food Services (55-56):** 40%

## 🚀 Deployment

### Automatic Deployment
1. Push to `main` branch
2. GitHub Actions automatically builds and deploys to GitHub Pages
3. API becomes available at the GitHub Pages URL

### Manual Build
```bash
# Install dependencies
npm install

# Build for GitHub Pages
npm run build

# Test locally
npm run dev
```

## 📱 Web Interface

The deployed API includes an interactive web interface with:

- 🔍 **Search**: Find codes by text or code number
- 🌐 **Language**: Search in Italian or English
- 📊 **Profitability Filter**: Filter by profitability range
- 📈 **Statistics**: View database statistics
- 📱 **Responsive Design**: Works on mobile and desktop

## 🛠 Local Development

```bash
# Clone the repository
git clone https://github.com/yourusername/ateco-codes.git
cd ateco-codes

# Install dependencies
npm install

# Run locally
npm run dev

# Build for production
npm run build
```

## 📈 Response Format

### Single Code Response
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

### Search Response
```json
{
  "data": [...],
  "total": 2597,
  "limit": 50,
  "offset": 0
}
```

### Statistics Response
```json
{
  "total_codes": 2723,
  "codes_with_profitability": 2597,
  "coverage_percentage": "95.40",
  "profitability_ranges": {
    "very_high": 123,
    "high": 456,
    "medium": 789,
    "low": 1229
  },
  "max_profitability": 0.86,
  "min_profitability": 0.40
}
```

## 📚 Data Sources

- **ATECO Codes:** ISTAT (Italian National Institute of Statistics) - ATECO 2025 classification
- **Profitability Coefficients:** Custom sector analysis
- **Generation Date:** 2025-02-16
- **API Version:** 1.0.0

## ⚠️ Notes

- Profitability coefficients are indicative values based on sector analysis
- All coefficients are expressed as decimal values (e.g., 0.86 = 86%)
- API is CORS-enabled for cross-origin requests
- Rate limiting may be implemented based on GitHub Pages usage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Push to your fork
5. Open a Pull Request

## 📄 License

ATECO codes are public data from ISTAT. API code and documentation are licensed under MIT License.

---

**Made with ❤️ for Italian business analysis**
