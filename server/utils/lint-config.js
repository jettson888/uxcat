
const fs = require('fs-extra');
const path = require('path');
const eslintrc = require('../.eslintrc.js');
const lintOverride = require('../lint-override.js');


async function getLintConfigs() {
    let configContent = 'Linting Rules Content:\n';
    try {
        configContent += `\n--- .eslintrc.js ---\n${JSON.stringify(eslintrc)}\n`;
    } catch (e) {
        console.warn('Failed to read .eslintrc.js');
    }

    try {
        configContent += `\n--- lint-override.js ---\n${JSON.stringify(lintOverride)}\n`;
    } catch (e) {
        console.warn('Failed to read lint-override.js');
    }

    return configContent;
}

// async function run() {
//     const lintConfig = await getLintConfigs()
//     console.log(lintConfig)
// }
// run()
module.exports = {
    getLintConfigs
}