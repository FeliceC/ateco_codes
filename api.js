const fs = require('fs');
const path = require('path');

// Load ATECO data from JSON file
function loadAtecoData() {
    try {
        const filePath = path.join(__dirname, 'ateco_codes_with_profitability.json');
        const rawData = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(rawData);
        return data;
    } catch (error) {
        console.error('Error loading ATECO data:', error);
        return null;
    }
}

// Search function for ATECO code
function searchByCode(atecoData, code) {
    if (!atecoData || !atecoData.ateco_codes || !code || code === '') return null;
    
    // Exact match
    const exactMatch = atecoData.ateco_codes.find(item => item.code === code);
    if (exactMatch) return exactMatch;
    
    // Prefix match - only match if the code is a valid prefix at a hierarchy boundary
    const prefixMatch = atecoData.ateco_codes.find(item =>
        item.code.startsWith(code + '.') || item.code.startsWith(code + ' ')
    );
    return prefixMatch || null;
}

// Text search function
function searchByText(atecoData, query, language = 'it') {
    if (!atecoData || !atecoData.ateco_codes || !query || query === '') return [];
    
    const searchTerm = query.toLowerCase();
    const titleField = language === 'en' ? 'title_en' : 'title_it';
    
    return atecoData.ateco_codes.filter(item =>
        item.code.toLowerCase().includes(searchTerm) ||
        item[titleField].toLowerCase().includes(searchTerm)
    );
}

// Filter by profitability range
function filterByProfitability(atecoData, minProfitability, maxProfitability) {
    if (!atecoData || !atecoData.ateco_codes) return [];

    return atecoData.ateco_codes.filter(item => {
        if (!item.profitability_coefficient) return false;
        const profit = parseFloat(item.profitability_coefficient);
        return profit >= minProfitability && profit <= maxProfitability;
    });
}

// Get statistics function
function getStatistics(atecoData) {
    if (!atecoData || !atecoData.ateco_codes || atecoData.ateco_codes.length === 0) {
        return {};
    }
    
    const codes = atecoData.ateco_codes;
    const ranges = { very_high: 0, high: 0, medium: 0, low: 0 };
    let withProfitabilityCount = 0;
    let maxProfit = -Infinity;
    let minProfit = Infinity;

    for (const item of codes) {
        const p = item.profitability_coefficient;
        if (p === null || p === undefined) continue;
        withProfitabilityCount++;
        if (p > maxProfit) maxProfit = p;
        if (p < minProfit) minProfit = p;
        if (p >= 0.80) ranges.very_high++;
        else if (p >= 0.60) ranges.high++;
        else if (p >= 0.40) ranges.medium++;
        else ranges.low++;
    }

    return {
        total_codes: codes.length,
        codes_with_profitability: withProfitabilityCount,
        coverage_percentage: withProfitabilityCount > 0 ? ((withProfitabilityCount / codes.length) * 100).toFixed(2) : '0.00',
        profitability_ranges: ranges,
        max_profitability: withProfitabilityCount > 0 ? maxProfit : 0,
        min_profitability: withProfitabilityCount > 0 ? minProfit : 0
    };
}

// Export functions for testing
const apiFunctions = {
    loadAtecoData,
    searchByCode,
    searchByText,
    filterByProfitability,
    getStatistics
};

// Add handler to the exported object
apiFunctions.handler = async function(event, context) {
    const atecoData = loadAtecoData();
    
    if (!atecoData) {
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Failed to load ATECO data' })
        };
    }
    
    const { httpMethod, path, queryStringParameters } = event;
    
    // Handle different path formats
    let pathParts = [];
    if (path) {
        // Remove common prefixes and split
        const cleanPath = path.replace('/.netlify/functions/api', '').replace('/api', '');
        pathParts = cleanPath.split('/').filter(Boolean);
    }
    
    try {
        // CORS preflight
        if (httpMethod === 'OPTIONS') {
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                },
                body: ''
            };
        }
        
        // API endpoints
        if (httpMethod === 'GET') {
            // GET /stats or /api/stats - Statistics
            if (pathParts[0] === 'stats') {
                const stats = getStatistics(atecoData);
                return {
                    statusCode: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify(stats)
                };
            }
            
            // GET /search or /api/search - Search
            if (pathParts[0] === 'search') {
                const { q, lang = 'it', profitability_min, profitability_max } = queryStringParameters || {};
                
                let results = [];
                
                if (q) {
                    results = searchByText(atecoData, q, lang);
                } else {
                    results = atecoData.ateco_codes;
                }
                
                // Filter by profitability if specified
                if (profitability_min !== undefined || profitability_max !== undefined) {
                    const min = parseFloat(profitability_min) || 0;
                    const max = parseFloat(profitability_max) || 1;
                    results = results.filter(item => {
                        if (!item.profitability_coefficient) return false;
                        const profit = parseFloat(item.profitability_coefficient);
                        return profit >= min && profit <= max;
                    });
                }
                
                // Limit results
                const limit = parseInt(queryStringParameters?.limit) || 50;
                const offset = parseInt(queryStringParameters?.offset) || 0;
                
                return {
                    statusCode: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({
                        data: results.slice(offset, offset + limit),
                        total: results.length,
                        limit,
                        offset
                    })
                };
            }
            
            // GET /code/{code} or /api/code/{code} - Search by code
            if (pathParts[0] === 'code' && pathParts[1]) {
                const code = pathParts[1];
                const result = searchByCode(atecoData, code);
                
                if (result) {
                    return {
                        statusCode: 200,
                        headers: {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        body: JSON.stringify(result)
                    };
                } else {
                    return {
                        statusCode: 404,
                        headers: {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        body: JSON.stringify({ error: 'ATECO code not found' })
                    };
                }
            }
            
            // GET / or /api - Complete list (with pagination)
            const limit = parseInt(queryStringParameters?.limit) || 50;
            const offset = parseInt(queryStringParameters?.offset) || 0;
            
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    data: atecoData.ateco_codes.slice(offset, offset + limit),
                    total: atecoData.ateco_codes.length,
                    limit,
                    offset
                })
            };
        }
        
        // Method not allowed
        return {
            statusCode: 405,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Method not allowed' })
        };
        
    } catch (error) {
        console.error('API Error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

module.exports = apiFunctions;

// For local testing
if (require.main === module) {
    const atecoData = loadAtecoData();
    console.log('ATECO API Test');
    console.log('Total codes:', atecoData?.ateco_codes?.length);
    console.log('Stats:', getStatistics(atecoData));
}
