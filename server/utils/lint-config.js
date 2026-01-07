
const fs = require('fs-extra');
const path = require('path');


async function getLintConfigs() {
    let configContent = 'Linting Rules Content:\n';
    try {
        const eslintRc = await fs.readFile('../.eslintrc.js', {
            encoding: 'utf8'
        });
        configContent += `\n--- .eslintrc.js ---\n${eslintRc}\n`;
    } catch (e) {
        console.warn('Failed to read .eslintrc.js');
    }

    try {
        const lintOverride = await fs.readFile('../lint-override.js', {
            encoding: 'utf8'
        });
        configContent += `\n--- lint-override.js ---\n${lintOverride}\n`;
    } catch (e) {
        console.warn('Failed to read lint-override.js');
    }

    return configContent;
}

// async function run() {
// const lintConfig = await getLintConfigs()
// console.log(lintConfig)
// }
run()
module.exports = {
    getLintConfigs
}