const api = require('../api.js');
const { profitabilityGroupFor, ProfitabilityGroup } = require('../generate-data.js');

const atecoData = require('../ateco_codes_with_profitability.json');

describe('ATECO API Tests', () => {
    
    describe('dataset', () => {
        test('should load ATECO data successfully', () => {
            expect(atecoData).toBeDefined();
            expect(atecoData.metadata).toBeDefined();
            expect(atecoData.ateco_codes).toBeDefined();
            expect(atecoData.ateco_codes.length).toBe(3257);
        });

        test('should have correct metadata', () => {
            expect(atecoData.metadata.description).toContain('ATECO 2025');
            expect(atecoData.metadata.total_codes).toBe(3257);
            expect(atecoData.metadata.codes_with_profitability).toBe(2791);
        });
    });

    describe('searchByCode', () => {
        test('should find exact code match', () => {
            const result = api.searchByCode(atecoData, '01.1');
            expect(result).toBeTruthy();
            expect(result.code).toBe('01.1');
            expect(result.title_it).toContain('Coltivazione di colture agricole non permanenti');
        });

        test('should return null for non-existent code', () => {
            const result = api.searchByCode(atecoData, '99.99.99');
            expect(result).toBeNull();
        });

        test('should find prefix match', () => {
            const result = api.searchByCode(atecoData, '01');
            expect(result).toBeTruthy();
            expect(result.code).toBe('01');
        });

        test('should handle partial code match', () => {
            const result = api.searchByCode(atecoData, '01.11');
            expect(result).toBeTruthy();
            expect(result.code).toBe('01.11');
        });
    });

    describe('searchByText', () => {
        test('should search by Italian text', () => {
            const results = api.searchByText(atecoData, 'agricoltura', 'it');
            expect(results.length).toBeGreaterThan(0);
            expect(results[0].title_it.toLowerCase()).toContain('agricoltura');
        });

        test('should search by English text', () => {
            const results = api.searchByText(atecoData, 'agriculture', 'en');
            expect(results.length).toBeGreaterThan(0);
            expect(results[0].title_en.toLowerCase()).toContain('agriculture');
        });

        test('should search by code number', () => {
            const results = api.searchByText(atecoData, '01');
            expect(results.length).toBeGreaterThan(0);
            expect(results[0].code).toContain('01');
        });

        test('should match codes by prefix only', () => {
            const codes = api.searchByText(atecoData, '62.20').map(item => item.code);
            expect(codes).toContain('62.20.10');
            expect(codes).not.toContain('47.62.20');
        });

        test('should return empty array for no matches', () => {
            const results = api.searchByText(atecoData, 'xyz123', 'it');
            expect(results).toEqual([]);
        });

        test('should be case insensitive', () => {
            const results1 = api.searchByText(atecoData, 'AGRICOLTURA', 'it');
            const results2 = api.searchByText(atecoData, 'agricoltura', 'it');
            expect(results1.length).toBe(results2.length);
        });
    });

    describe('filterByProfitability', () => {
        test('should filter by minimum profitability', () => {
            const results = api.filterByProfitability(atecoData, 0.80, 1.0);
            expect(results.length).toBeGreaterThan(0);
            results.forEach(item => {
                expect(item.profitability_coefficient).toBeGreaterThanOrEqual(0.80);
            });
        });

        test('should filter by profitability range', () => {
            const results = api.filterByProfitability(atecoData, 0.60, 0.80);
            expect(results.length).toBeGreaterThan(0);
            results.forEach(item => {
                expect(item.profitability_coefficient).toBeGreaterThanOrEqual(0.60);
                expect(item.profitability_coefficient).toBeLessThanOrEqual(0.80);
            });
        });

        test('should return empty for impossible range', () => {
            const results = api.filterByProfitability(atecoData, 1.5, 2.0);
            expect(results).toEqual([]);
        });

        test('should handle full range', () => {
            const results = api.filterByProfitability(atecoData, 0.0, 1.0);
            expect(results.length).toBe(2791); // All codes with profitability data
        });
    });

    describe('getStatistics', () => {
        test('should return correct statistics', () => {
            const stats = api.getStatistics(atecoData);
            expect(stats.total_codes).toBe(3257);
            expect(stats.codes_with_profitability).toBe(2791);
            expect(stats.coverage_percentage).toBe('85.69');
        });

        test('should have profitability ranges', () => {
            const stats = api.getStatistics(atecoData);
            expect(stats.profitability_ranges).toBeDefined();
            expect(stats.profitability_ranges.very_high).toBeGreaterThan(0);
            expect(stats.profitability_ranges.high).toBeGreaterThan(0);
            expect(stats.profitability_ranges.medium).toBeGreaterThan(0);
            expect(stats.profitability_ranges.low).toBeGreaterThanOrEqual(0);
        });

        test('should have min and max profitability', () => {
            const stats = api.getStatistics(atecoData);
            expect(stats.max_profitability).toBeDefined();
            expect(stats.min_profitability).toBeDefined();
            expect(stats.max_profitability).toBeGreaterThan(stats.min_profitability);
        });

        test('should calculate correct coverage percentage', () => {
            const stats = api.getStatistics(atecoData);
            const expectedCoverage = (2791 / 3257 * 100).toFixed(2);
            expect(stats.coverage_percentage).toBe(expectedCoverage);
        });
    });

    describe('Data Integrity', () => {
        test('all codes should have required fields', () => {
            atecoData.ateco_codes.forEach(item => {
                expect(item.code).toBeDefined();
                expect(item.title_it).toBeDefined();
                expect(item.title_en).toBeDefined();
                expect(item.hierarchy).toBeDefined();
                expect(typeof item.hierarchy).toBe('number');
            });
        });

        test('profitability coefficients should be valid decimals', () => {
            const withProfitability = atecoData.ateco_codes.filter(item => item.profitability_coefficient !== null);
            withProfitability.forEach(item => {
                expect(typeof item.profitability_coefficient).toBe('number');
                expect(item.profitability_coefficient).toBeGreaterThanOrEqual(0);
                expect(item.profitability_coefficient).toBeLessThanOrEqual(1);
            });
        });
    });

    describe('Edge Cases', () => {
        test('should handle null data gracefully', () => {
            expect(api.searchByCode(null, '01')).toBeNull();
            expect(api.searchByText(null, 'test')).toEqual([]);
            expect(api.filterByProfitability(null, 0, 1)).toEqual([]);
            expect(api.getStatistics(null)).toEqual({});
        });

        test('should handle empty data gracefully', () => {
            const emptyData = { ateco_codes: [] };
            expect(api.searchByCode(emptyData, '01')).toBeNull();
            expect(api.searchByText(emptyData, 'test')).toEqual([]);
            expect(api.filterByProfitability(emptyData, 0, 1)).toEqual([]);
            expect(api.getStatistics(emptyData)).toEqual({});
        });

        test('should handle invalid search parameters', () => {
            expect(api.searchByCode(atecoData, '')).toBeNull();
            expect(api.searchByCode(atecoData, null)).toBeNull();
            expect(api.searchByText(atecoData, '', 'it')).toEqual([]);
            expect(api.searchByText(atecoData, null, 'it')).toEqual([]);
        });
    });
});

describe('Profitability mapping (Allegato 4, L. 190/2014)', () => {
    test('maps ATECO 2022 codes to their legal group', () => {
        expect(profitabilityGroupFor('10.11.00')).toBe(ProfitabilityGroup.FOOD_INDUSTRY);
        expect(profitabilityGroupFor('46.11.01')).toBe(ProfitabilityGroup.TRADE_INTERMEDIARIES);
        expect(profitabilityGroupFor('46.21.10')).toBe(ProfitabilityGroup.WHOLESALE_RETAIL);
        expect(profitabilityGroupFor('47.81.01')).toBe(ProfitabilityGroup.STREET_TRADE_FOOD);
        expect(profitabilityGroupFor('47.89.09')).toBe(ProfitabilityGroup.STREET_TRADE_OTHER);
        expect(profitabilityGroupFor('68.20.01')).toBe(ProfitabilityGroup.CONSTRUCTION_REAL_ESTATE);
        expect(profitabilityGroupFor('62.01.00')).toBe(ProfitabilityGroup.OTHER_ACTIVITIES);
        expect(profitabilityGroupFor('69.10.10')).toBe(ProfitabilityGroup.PROFESSIONAL_SERVICES);
    });

    test('ambiguous ATECO 2025 codes expose candidates instead of a coefficient', () => {
        const item = api.searchByCode(atecoData, '46.11.01');
        expect(item.profitability_coefficient).toBeNull();
        expect(item.profitability_candidates).toEqual([0.62, 0.67]);
    });

    test('codes with apostrophes in titles are present', () => {
        expect(api.searchByCode(atecoData, '01.5').title_it).toContain("all'allevamento");
    });
});
