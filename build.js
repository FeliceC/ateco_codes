const fs = require('fs');
const path = require('path');
const { getStatistics } = require('./api.js');

const DATASET_FILENAME = 'ateco_codes_with_profitability.json';
const SQL_FILENAME = 'ateco_codes_with_profitability.sql';

function buildForGitHubPages() {
    const distDir = path.join(__dirname, 'dist');
    const codeDir = path.join(distDir, 'api', 'code');
    fs.mkdirSync(codeDir, { recursive: true });

    fs.cpSync(path.join(__dirname, 'public'), distDir, { recursive: true });
    fs.copyFileSync(path.join(__dirname, 'api.js'), path.join(distDir, 'api.js'));
    fs.copyFileSync(path.join(__dirname, DATASET_FILENAME), path.join(distDir, DATASET_FILENAME));
    fs.copyFileSync(path.join(__dirname, SQL_FILENAME), path.join(distDir, SQL_FILENAME));

    const atecoData = require(`./${DATASET_FILENAME}`);
    fs.writeFileSync(path.join(distDir, 'api', 'stats.json'), JSON.stringify(getStatistics(atecoData)));
    for (const item of atecoData.ateco_codes) {
        fs.writeFileSync(path.join(codeDir, `${item.code}.json`), JSON.stringify(item));
    }

    console.log('✅ Build completed for GitHub Pages');
    console.log('📁 Files created in ./dist/');
}

if (require.main === module) {
    buildForGitHubPages();
}

module.exports = { buildForGitHubPages };
