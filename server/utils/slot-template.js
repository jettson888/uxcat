/**
 * 字符串替换函数，支持{{placeholderName}}格式的占位符
 * @param {string} template - 模板字符串
 * @param {Object} replacements - 替换对象，键为占位符名称，值为替换内容
 * @returns {string} 替换后的字符串
 */
function replacePlaceholders(template, replacements) {
    if (!template || typeof template !== 'string') {
        return template;
    }

    if (!replacements || typeof replacements !== 'object') {
        return template;
    }

    return template.replace(/\{\{(\w+)\}\}/g, (match, placeholder) => {
        return replacements[placeholder] !== undefined ? replacements[placeholder] : match;
    });
}

module.exports = {
    replacePlaceholders
}