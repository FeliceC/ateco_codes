const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Import the API functions
const api = require('../api.js');

// Test data setup
let atecoData = null;

beforeAll(() => {
    // Load test data
    atecoData = api.loadAtecoData();
    if (!atecoData) {
        throw new Error('Failed to load ATECO data');
    }
});

describe('ATECO API Tests', () => {
    
    describe('loadAtecoData', () => {
        test('should load ATECO data successfully', () => {
            expect(atecoData).toBeDefined();
            expect(atecoData.metadata).toBeDefined();
            expect(atecoData.ateco_codes).toBeDefined();
            expect(atecoData.ateco_codes.length).toBe(2723);
        });

        test('should have correct metadata', () => {
            expect(atecoData.metadata.description).toContain('ATECO 2025');
            expect(atecoData.metadata.total_codes).toBe(2723);
            expect(atecoData.metadata.codes_with_profitability).toBe(2597);
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
            expect(results.length).toBe(2597); // All codes with profitability data
        });
    });

    describe('getStatistics', () => {
        test('should return correct statistics', () => {
            const stats = api.getStatistics(atecoData);
            expect(stats.total_codes).toBe(2723);
            expect(stats.codes_with_profitability).toBe(2597);
            expect(stats.coverage_percentage).toBe('95.37'); // Valore corretto calcolato
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
            const expectedCoverage = (2597 / 2723 * 100).toFixed(2);
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

describe('API Handler Tests', () => {
    test('should handle OPTIONS request for CORS', async () => {
        const mockEvent = {
            httpMethod: 'OPTIONS',
            path: '/api',
            queryStringParameters: null
        };
        
        const result = await api.handler(mockEvent);
        expect(result.statusCode).toBe(200);
        expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
        expect(result.headers['Access-Control-Allow-Methods']).toContain('GET');
    });

    test('should handle GET /api/stats', async () => {
        const mockEvent = {
            httpMethod: 'GET',
            path: '/api/stats',
            queryStringParameters: null
        };
        
        const result = await api.handler(mockEvent);
        expect(result.statusCode).toBe(200);
        expect(result.headers['Content-Type']).toBe('application/json');
        
        const body = JSON.parse(result.body);
        expect(body.total_codes).toBe(2723);
        expect(body.codes_with_profitability).toBe(2597);
    });

    test('should handle GET /api/code/{code}', async () => {
        const mockEvent = {
            httpMethod: 'GET',
            path: '/api/code/01.1',
            queryStringParameters: null
        };
        
        const result = await api.handler(mockEvent);
        expect(result.statusCode).toBe(200);
        
        const body = JSON.parse(result.body);
        expect(body.code).toBe('01.1');
        expect(body.title_it).toContain('Coltivazione di colture agricole non permanenti');
    });

    test('should return 404 for non-existent code', async () => {
        const mockEvent = {
            httpMethod: 'GET',
            path: '/api/code/99.99.99',
            queryStringParameters: null
        };
        
        const result = await api.handler(mockEvent);
        expect(result.statusCode).toBe(404);
        
        const body = JSON.parse(result.body);
        expect(body.error).toBe('ATECO code not found');
    });

    test('should handle GET /api/search', async () => {
        const mockEvent = {
            httpMethod: 'GET',
            path: '/api/search',
            queryStringParameters: { q: 'agricoltura', lang: 'it' }
        };
        
        const result = await api.handler(mockEvent);
        expect(result.statusCode).toBe(200);
        
        const body = JSON.parse(result.body);
        expect(body.data).toBeDefined();
        expect(body.total).toBeGreaterThan(0);
        expect(body.data.length).toBeGreaterThan(0);
        expect(body.data[0].title_it.toLowerCase()).toContain('agricoltura');
    });

    test('should handle profitability filtering', async () => {
        const mockEvent = {
            httpMethod: 'GET',
            path: '/api',
            queryStringParameters: { profitability_min: '0.60' }
        };
        
        const result = await api.handler(mockEvent);
        expect(result.statusCode).toBe(200);
        
        const body = JSON.parse(result.body);
        expect(body.data).toBeDefined();
        body.data.forEach(item => {
            expect(item.profitability_coefficient).toBeGreaterThanOrEqual(0.60);
        });
    });

    test('should handle pagination', async () => {
        const mockEvent = {
            httpMethod: 'GET',
            path: '/api',
            queryStringParameters: { limit: '10', offset: '0' }
        };
        
        const result = await api.handler(mockEvent);
        expect(result.statusCode).toBe(200);
        
        const body = JSON.parse(result.body);
        expect(body.data.length).toBeLessThanOrEqual(10);
        expect(body.limit).toBe(10);
        expect(body.offset).toBe(0);
    });

    test('should reject unsupported methods', async () => {
        const mockEvent = {
            httpMethod: 'POST',
            path: '/api',
            queryStringParameters: null
        };
        
        const result = await api.handler(mockEvent);
        expect(result.statusCode).toBe(405);
        
        const body = JSON.parse(result.body);
        expect(body.error).toBe('Method not allowed');
    });
});
