function searchByCode(atecoData, code) {
    if (!atecoData || !atecoData.ateco_codes || !code) return null;

    const exactMatch = atecoData.ateco_codes.find(item => item.code === code);
    if (exactMatch) return exactMatch;

    return atecoData.ateco_codes.find(item => item.code.startsWith(code + '.')) || null;
}

function searchByText(atecoData, query, language = 'it') {
    if (!atecoData || !atecoData.ateco_codes || !query) return [];

    const searchTerm = query.toLowerCase();
    const titleField = language === 'en' ? 'title_en' : 'title_it';

    return atecoData.ateco_codes.filter(item =>
        item.code.toLowerCase().startsWith(searchTerm) ||
        item[titleField].toLowerCase().includes(searchTerm)
    );
}

function filterByProfitability(atecoData, minProfitability, maxProfitability) {
    if (!atecoData || !atecoData.ateco_codes) return [];

    return atecoData.ateco_codes.filter(item =>
        item.profitability_coefficient != null &&
        item.profitability_coefficient >= minProfitability &&
        item.profitability_coefficient <= maxProfitability
    );
}

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
        if (p == null) continue;
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

// Loaded as a plain <script> in the browser, where module is undefined
if (typeof module !== 'undefined') module.exports = {
    searchByCode,
    searchByText,
    filterByProfitability,
    getStatistics
};
