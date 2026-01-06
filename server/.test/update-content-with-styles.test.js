const cheerio = require('cheerio'); // 确保已安装并引入
const fs = require('fs-extra')
const path = require('path');
const { parseVueSFC, updateContentWithStylesByTagName } = require('../utils/parse-sfc.js');

/**
 * 按行号给指定行的标签插入style（宽松匹配，仅按行号定位）
 * @param {string} template 原始模板字符串（<template>内部内容）
 * @param {object} styleMap 样式配置 { 文件标识: [{row, col, element, styles}]}
 * @returns {string} 修改后的模板
 */
async function updateContentWithStyles(template, styleMap) {
  // 1. 拆分模板为行数组（保留原始换行符，适配Windows/Linux）
  const lineBreakChar = /\r\n|\n|\r/.exec(template)?.[0] || '\n';
  const templateLines = template.split(lineBreakChar);
  let modifiedLines = [...templateLines];

  for (const [fileKey, styleEntries] of Object.entries(styleMap)) {
    console.log(`\n=== 开始处理 ${fileKey} ===`);

    for (const entry of styleEntries) {
      const { row, element, styles } = entry;
      const targetLineIndex = row - 1; // 行号从1→数组索引0
      console.log(`定位行号：${row}（数组索引：${targetLineIndex}），目标标签类型：${element}`);

      // 校验行号有效性
      if (targetLineIndex < 0 || targetLineIndex >= modifiedLines.length) {
        console.warn(`❌ 行号${row}超出模板范围（模板共${modifiedLines.length}行）`);
        continue;
      }

      let targetLine = modifiedLines[targetLineIndex];
      if (!targetLine.trim()) { // 空行/仅空格行跳过
        console.warn(`❌ 行号${row}内容为空（仅空格）`);
        continue;
      }

      try {
        // 2. 宽松匹配：匹配该行所有HTML标签（兼容有/无连字符、自闭合/非自闭合）
        // 正则规则：< + 标签名 + 任意属性 + > 或 />（如<h2>、<el-form ...>、<el-input/>）
        const tagRegex = /<([a-zA-Z0-9-]+)\s*([^>]*?)\/?>/;
        const match = targetLine.match(tagRegex);

        if (!match) {
          console.warn(`❌ 行号${row}未找到任何HTML标签，跳过`);
          continue;
        }

        const [fullTag, tagName, tagAttrs] = match;
        console.log(`✅ 找到行${row}的标签：${fullTag}（实际标签名：${tagName}）`);

        // 3. 解析并合并style属性
        const styleAttrRegex = /style="([^"]*)"/i;
        const existingStyleMatch = tagAttrs.match(styleAttrRegex);
        const existingStyleStr = existingStyleMatch?.[1] || '';

        // 合并新旧样式（新样式覆盖旧的）
        const styleObj = {};
        if (existingStyleStr) {
          existingStyleStr.split(';').filter(Boolean).forEach(part => {
            const [prop, val] = part.split(':').map(s => s.trim());
            if (prop) styleObj[prop] = val;
          });
        }
        styles.forEach(s => {
          if (s.prop !== "inner-text") {
            styleObj[s.prop] = s.value;
          }
        });
        const newStyleStr = Object.entries(styleObj)
          .map(([p, v]) => `${p}:${v}`)
          .join(';');

        // 4. 重构标签：插入/替换style属性
        let newTagAttrs = tagAttrs.trim();
        let newFullTag = '';

        if (existingStyleMatch) {
          // 替换现有style
          newTagAttrs = newTagAttrs.replace(styleAttrRegex, `style="${newStyleStr}"`);
        } else {
          // 新增style（标签属性末尾添加）
          newTagAttrs = newTagAttrs ? `${newTagAttrs} style="${newStyleStr}"` : `style="${newStyleStr}"`;
        }

        // 兼容自闭合/非自闭合标签
        if (fullTag.endsWith('/>')) {
          newFullTag = `<${tagName} ${newTagAttrs}/>`;
        } else {
          newFullTag = `<${tagName} ${newTagAttrs}>`;
        }

        // 5. 替换该行的标签内容（保留原有缩进）
        const indent = targetLine.substring(0, targetLine.indexOf(fullTag)); // 提取缩进空格
        const newTargetLine = targetLine.replace(fullTag, newFullTag);
        modifiedLines[targetLineIndex] = newTargetLine;

        console.log(`✅ 行${row}的${tagName}标签已插入style：${newStyleStr}`);

      } catch (err) {
        console.error(`❌ 处理行${row}失败：`, err.message);
        continue;
      }
    }
  }

  // 合并行数组为最终模板（保留原始格式）
  const updatedTemplate = modifiedLines.join(lineBreakChar);
  return updatedTemplate;
}

async function run() {
  const filePath = path.join(__dirname, 'visitRegistration.vue');

  const spa = fs.readFileSync(filePath, {
    encoding: 'utf-8'
  })
  const { template } = parseVueSFC(spa)

  // 调用示例（解开xxxx2的注释）
  const updatedTemp = await updateContentWithStyles(template, {
    'xxxx1': [
      { row: 4, col: 7, element: 'h2', styles: [{ prop: 'background', value: '#fff' }] }
    ],
    'xxxx2': [
      { row: 7, col: 5, element: 'form', styles: [{ prop: 'color', value: '#fff' }, { prop: 'font-weight', value: 'bold' }] }
    ],
    'xxxx3': [
      { row: 25, col: 7, element: 'el-form-item', styles: [{ prop: 'color', value: '#fff' }, { prop: 'font-weight', value: 'bold' }] }
    ],
  });
  console.log('最终修改后的模板：', updatedTemp);
}

run()
