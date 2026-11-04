const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');

// Allegato 4, L. 190/2014 (as replaced by L. 145/2018): coefficients are defined on ATECO 2007/2022 codes
const ProfitabilityGroup = Object.freeze({
    FOOD_INDUSTRY: { category: 'industrie_alimentari', description: 'Industrie alimentari e delle bevande', coefficient: 0.40 },
    WHOLESALE_RETAIL: { category: 'commercio_ingrosso_dettaglio', description: "Commercio all'ingrosso e al dettaglio", coefficient: 0.40 },
    STREET_TRADE_FOOD: { category: 'commercio_ambulante_alimentari', description: 'Commercio ambulante di prodotti alimentari e bevande', coefficient: 0.40 },
    STREET_TRADE_OTHER: { category: 'commercio_ambulante_altri', description: 'Commercio ambulante di altri prodotti', coefficient: 0.54 },
    CONSTRUCTION_REAL_ESTATE: { category: 'costruzioni_immobiliari', description: 'Costruzioni e attività immobiliari', coefficient: 0.86 },
    TRADE_INTERMEDIARIES: { category: 'intermediari_commercio', description: 'Intermediari del commercio', coefficient: 0.62 },
    ACCOMMODATION_FOOD_SERVICE: { category: 'alloggio_ristorazione', description: 'Attività dei servizi di alloggio e di ristorazione', coefficient: 0.40 },
    PROFESSIONAL_SERVICES: { category: 'servizi_professionali', description: 'Attività professionali, scientifiche, tecniche, sanitarie, di istruzione, servizi finanziari ed assicurativi', coefficient: 0.78 },
    OTHER_ACTIVITIES: { category: 'altre_attivita', description: 'Altre attività economiche', coefficient: 0.67 }
});

const FOOD_INDUSTRY_DIVISIONS = [10, 11];
const WHOLESALE_RETAIL_DIVISIONS = [45, 46, 47];
const CONSTRUCTION_REAL_ESTATE_DIVISIONS = [41, 42, 43, 68];
const ACCOMMODATION_FOOD_SERVICE_DIVISIONS = [55, 56];
const PROFESSIONAL_SERVICES_DIVISIONS = [64, 65, 66, 69, 70, 71, 72, 73, 74, 75, 85, 86, 87, 88];

/** Maps a 6-level ATECO 2007/2022 code to its Allegato 4 group. */
function profitabilityGroupFor(code2022) {
    const division = Number(code2022.slice(0, 2));
    if (code2022.startsWith('46.1')) return ProfitabilityGroup.TRADE_INTERMEDIARIES;
    if (code2022.startsWith('47.81')) return ProfitabilityGroup.STREET_TRADE_FOOD;
    if (/^47\.8[2-9]/.test(code2022)) return ProfitabilityGroup.STREET_TRADE_OTHER;
    if (FOOD_INDUSTRY_DIVISIONS.includes(division)) return ProfitabilityGroup.FOOD_INDUSTRY;
    if (WHOLESALE_RETAIL_DIVISIONS.includes(division)) return ProfitabilityGroup.WHOLESALE_RETAIL;
    if (CONSTRUCTION_REAL_ESTATE_DIVISIONS.includes(division)) return ProfitabilityGroup.CONSTRUCTION_REAL_ESTATE;
    if (ACCOMMODATION_FOOD_SERVICE_DIVISIONS.includes(division)) return ProfitabilityGroup.ACCOMMODATION_FOOD_SERVICE;
    if (PROFESSIONAL_SERVICES_DIVISIONS.includes(division)) return ProfitabilityGroup.PROFESSIONAL_SERVICES;
    return ProfitabilityGroup.OTHER_ACTIVITIES;
}

function readTsv(filename) {
    const [header, ...lines] = fs.readFileSync(path.join(dataDir, filename), 'utf8').trim().split('\n');
    const columns = header.split('\t');
    return lines.map(line => {
        const values = line.split('\t');
        return Object.fromEntries(columns.map((column, index) => [column, values[index] ?? '']));
    });
}

function buildAtecoCodes() {
    const structure = readTsv('istat-structure-2025.tsv');
    const groupsByCode = new Map(structure.map(row => [row.code, new Set()]));

    for (const { code_2025, code_2022 } of readTsv('istat-correspondence-2025-2022.tsv')) {
        if (code_2022) groupsByCode.get(code_2025).add(profitabilityGroupFor(code_2022));
    }

    const deepestFirst = [...structure].sort((first, second) => second.hierarchy - first.hierarchy);
    for (const row of deepestFirst) {
        const groups = groupsByCode.get(row.code);
        // new ATECO 2025 leaves without a 2022 correspondence (e.g. 46.89.00) keep their own code's group
        if (groups.size === 0) groups.add(profitabilityGroupFor(row.code));
        if (row.parent_code) groups.forEach(group => groupsByCode.get(row.parent_code).add(group));
    }

    return structure.map(row => {
        const groups = [...groupsByCode.get(row.code)];
        const candidates = [...new Set(groups.map(group => group.coefficient))].sort((first, second) => first - second);
        const coefficient = candidates.length === 1 ? candidates[0] : null;
        const singleGroup = groups.length === 1 ? groups[0] : null;
        return {
            code: row.code,
            title_it: row.title_it,
            title_en: row.title_en,
            hierarchy: Number(row.hierarchy),
            parent_code: row.parent_code || null,
            profitability_coefficient: coefficient,
            profitability_candidates: candidates,
            profitability_description: singleGroup?.description ?? null,
            profitability_category: singleGroup?.category ?? null,
            has_profitability_data: coefficient !== null
        };
    });
}

function toSqlValue(value) {
    if (value === null) return 'NULL';
    if (typeof value === 'number') return String(value);
    return `'${value.replace(/'/g, "''")}'`;
}

function toSql(atecoCodes) {
    const rows = atecoCodes.map(item => `  (${[
        toSqlValue(item.code),
        toSqlValue(item.title_it),
        toSqlValue(item.title_en),
        item.hierarchy,
        toSqlValue(item.parent_code),
        toSqlValue(item.profitability_coefficient),
        `ARRAY[${item.profitability_candidates.join(', ')}]::numeric[]`,
        toSqlValue(item.profitability_category)
    ].join(', ')})`);

    return `-- ATECO 2025 codes with profitability coefficients. Generated by generate-data.js, do not edit.

CREATE TABLE IF NOT EXISTS public.ateco_codes (
  code text PRIMARY KEY,
  title_it text NOT NULL,
  title_en text NOT NULL,
  hierarchy smallint NOT NULL,
  parent_code text,
  profitability numeric(3, 2),
  profitability_candidates numeric(3, 2)[] NOT NULL,
  profitability_category text
);

INSERT INTO public.ateco_codes (code, title_it, title_en, hierarchy, parent_code, profitability, profitability_candidates, profitability_category) VALUES
${rows.join(',\n')};
`;
}

function generateData() {
    const atecoCodes = buildAtecoCodes();
    const output = {
        metadata: {
            description: 'ATECO 2025 codes with profitability coefficients (regime forfettario, Allegato 4 L. 190/2014)',
            total_codes: atecoCodes.length,
            codes_with_profitability: atecoCodes.filter(item => item.has_profitability_data).length,
            source: 'ISTAT Struttura ATECO 2025 + Tavola di raccordo ATECO 2025-2022 (aggiornamento 2026)'
        },
        ateco_codes: atecoCodes
    };
    fs.writeFileSync(path.join(__dirname, 'ateco_codes_with_profitability.json'), JSON.stringify(output, null, 2) + '\n');
    fs.writeFileSync(path.join(__dirname, 'ateco_codes_with_profitability.sql'), toSql(atecoCodes));
    console.log(`Generated ${atecoCodes.length} codes (${output.metadata.codes_with_profitability} with profitability)`);
}

if (require.main === module) {
    generateData();
}

module.exports = { profitabilityGroupFor, ProfitabilityGroup };
