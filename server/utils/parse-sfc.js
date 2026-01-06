const cheerio = require('cheerio');

function parseVueSFC(content) {
    const templateMatch = content.match(/<template>([\s\S]*)<\/template>/);
    const scriptMatch = content.match(/<script([\s\S]*)<\/script>/);
    const styleMatch = content.match(/<style([\s\S]*)<\/style>/);
    return {
        template: templateMatch ? templateMatch[1] : '',
        script: scriptMatch ? scriptMatch[1] : '',
        style: styleMatch ? styleMatch[1] : '',
    }
}


function getSegment(content, row, col, element) {
    // Try without xmlMode to see if location info appears
    const $ = cheerio.load(content, {
        sourceCodeLocationInfo: true
    });

    let result = null;

    $('*').each((i, el) => {
        if (result) return false;

        if (el.type === 'tag') {
            const location = el.sourceCodeLocation;
            // console.log(`[DEBUG] Found <${el.name}> at ${location?.startLine}:${location?.startCol} (Expected ${element} at ${row}:${col})`);

            if (el.name === element && location) {
                // Cheerio might be strict about exact startCol
                // We'll check if it matches row and col
                if (location.startLine === row && location.startCol === col) {
                    result = {
                        lineStart: location.startLine,
                        lineEnd: location.endLine,
                        segment: $.html(el)
                    };
                }
            }
        }
    });

    return result;
}
module.exports = {
    parseVueSFC,
    getSegment
}