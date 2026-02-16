const fs = require('fs');
const path = require('path');

// Create structure for GitHub Pages
function buildForGitHubPages() {
    const distDir = path.join(__dirname, 'dist');
    
    // Create dist folder
    if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
    }
    
    // Copy JSON data file
    const jsonSource = path.join(__dirname, 'ateco_codes_with_profitability.json');
    const jsonDest = path.join(distDir, 'ateco_codes_with_profitability.json');
    if (fs.existsSync(jsonSource)) {
        fs.copyFileSync(jsonSource, jsonDest);
    }
    
    // Create client-side API HTML
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ATECO 2025 API</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            text-align: center;
        }
        .endpoint {
            background: #f8f9fa;
            padding: 15px;
            margin: 10px 0;
            border-radius: 5px;
            border-left: 4px solid #007bff;
        }
        .method {
            background: #007bff;
            color: white;
            padding: 2px 8px;
            border-radius: 3px;
            font-size: 12px;
            font-weight: bold;
        }
        .search-box {
            margin: 20px 0;
        }
        input, select, button {
            padding: 10px;
            margin: 5px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        button {
            background: #007bff;
            color: white;
            cursor: pointer;
        }
        button:hover {
            background: #0056b3;
        }
        .results {
            margin-top: 20px;
            max-height: 400px;
            overflow-y: auto;
        }
        .result-item {
            background: #f8f9fa;
            padding: 10px;
            margin: 5px 0;
            border-radius: 5px;
        }
        .code {
            font-weight: bold;
            color: #007bff;
        }
        .profitability {
            color: #28a745;
            font-weight: bold;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .stat-card {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            text-align: center;
        }
        .stat-number {
            font-size: 24px;
            font-weight: bold;
            color: #007bff;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏢 ATECO 2025 API</h1>
        <p>Italian business classification codes with profitability coefficients</p>
        
        <div class="stats" id="stats">
            <div class="stat-card">
                <div class="stat-number" id="totalCodes">-</div>
                <div>Total Codes</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="withProfitability">-</div>
                <div>With Profitability</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="coverage">-</div>
                <div>Coverage %</div>
            </div>
        </div>

        <div class="search-box">
            <h3>🔍 Search ATECO Codes</h3>
            <input type="text" id="searchInput" placeholder="Enter code or description...">
            <select id="language">
                <option value="it">Italian</option>
                <option value="en">English</option>
            </select>
            <button onclick="search()">Search</button>
        </div>

        <div class="search-box">
            <h3>📊 Filter by Profitability</h3>
            <input type="number" id="minProfit" placeholder="Min (0.0-1.0)" step="0.01" min="0" max="1">
            <input type="number" id="maxProfit" placeholder="Max (0.0-1.0)" step="0.01" min="0" max="1">
            <button onclick="filterByProfitability()">Filter</button>
        </div>

        <div class="results" id="results"></div>

        <h3>🚀 API Endpoints</h3>
        
        <div class="endpoint">
            <span class="method">GET</span> <code>/api</code>
            <p>Get all ATECO codes (paginated)</p>
        </div>

        <div class="endpoint">
            <span class="method">GET</span> <code>/api/search?q=keyword&lang=it</code>
            <p>Search by code or description</p>
        </div>

        <div class="endpoint">
            <span class="method">GET</span> <code>/api/code/01.1</code>
            <p>Get specific ATECO code</p>
        </div>

        <div class="endpoint">
            <span class="method">GET</span> <code>/api/stats</code>
            <p>Get database statistics</p>
        </div>

        <div class="endpoint">
            <span class="method">GET</span> <code>/api?profitability_min=0.6&profitability_max=0.8</code>
            <p>Filter by profitability range</p>
        </div>
    </div>

    <script>
        let atecoData = null;

        // Load ATECO data
        async function loadAtecoData() {
            try {
                const response = await fetch('./ateco_codes_with_profitability.json');
                atecoData = await response.json();
                updateStats();
            } catch (error) {
                console.error('Error loading ATECO data:', error);
            }
        }

        // Update statistics
        function updateStats() {
            if (!atecoData) return;
            
            const withProfitability = atecoData.ateco_codes.filter(item => item.profitability_coefficient !== null);
            const coverage = ((withProfitability.length / atecoData.ateco_codes.length) * 100).toFixed(1);
            
            document.getElementById('totalCodes').textContent = atecoData.ateco_codes.length;
            document.getElementById('withProfitability').textContent = withProfitability.length;
            document.getElementById('coverage').textContent = coverage + '%';
        }

        // Search function
        function search() {
            if (!atecoData) return;
            
            const query = document.getElementById('searchInput').value.toLowerCase();
            const lang = document.getElementById('language').value;
            const results = document.getElementById('results');
            
            if (!query) {
                results.innerHTML = '<p>Please enter a search term</p>';
                return;
            }
            
            const titleField = lang === 'en' ? 'title_en' : 'title_it';
            const matches = atecoData.ateco_codes.filter(item => 
                item.code.toLowerCase().includes(query) ||
                item[titleField].toLowerCase().includes(query)
            );
            
            displayResults(matches.slice(0, 20));
        }

        // Filter by profitability
        function filterByProfitability() {
            if (!atecoData) return;
            
            const minProfit = parseFloat(document.getElementById('minProfit').value) || 0;
            const maxProfit = parseFloat(document.getElementById('maxProfit').value) || 1;
            const results = document.getElementById('results');
            
            const matches = atecoData.ateco_codes.filter(item => {
                if (!item.profitability_coefficient) return false;
                const profit = parseFloat(item.profitability_coefficient);
                return profit >= minProfit && profit <= maxProfit;
            });
            
            displayResults(matches.slice(0, 20));
        }

        // Display results
        function displayResults(matches) {
            const results = document.getElementById('results');
            
            if (matches.length === 0) {
                results.innerHTML = '<p>No results found</p>';
                return;
            }
            
            results.innerHTML = matches.map(item => \`
                <div class="result-item">
                    <span class="code">\${item.code}</span>
                    <div>\${item.title_it}</div>
                    \${item.title_en ? \`<div><em>\${item.title_en}</em></div>\` : ''}
                    \${item.profitability_coefficient ? 
                        \`<div class="profitability">Profitability: \${(item.profitability_coefficient * 100).toFixed(1)}%</div>\` : 
                        ''
                    }
                </div>
            \`).join('');
        }

        // Load data on startup
        loadAtecoData();

        // Enter key for search
        document.getElementById('searchInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                search();
            }
        });
    </script>
</body>
</html>`;
    
    fs.writeFileSync(path.join(distDir, 'index.html'), htmlContent);
    
    // Create 404.html for GitHub Pages
    const notFoundContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Page Not Found</title>
</head>
<body>
    <h1>404 - Page Not Found</h1>
    <p><a href="/">Return to ATECO API</a></p>
</body>
</html>`;
    
    fs.writeFileSync(path.join(distDir, '404.html'), notFoundContent);
    
    console.log('✅ Build completed for GitHub Pages');
    console.log('📁 Files created in ./dist/');
}

if (require.main === module) {
    buildForGitHubPages();
}

module.exports = { buildForGitHubPages };
