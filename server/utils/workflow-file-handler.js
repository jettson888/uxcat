const fs = require('fs-extra');
const path = require('path');
const config = require('../config.js');

/**
 * 安全地读取workflow.json文件
 * @param {string} projectId 项目ID
 * @returns {object|null} 解析后的workflow对象或null（如果读取失败）
 */
async function readWorkflowSafely(projectId) {
  try {
    const workflowPath = path.join(config.PROJECT_DIR, projectId, '1', 'data', 'workflow.json');

    if (!await fs.pathExists(workflowPath)) {
      console.warn(`workflow.json 不存在: ${workflowPath}`);
      return null;
    }

    // 读取文件内容
    const content = await fs.readFile(workflowPath, 'utf-8');

    // 尝试解析JSON
    try {
      return JSON.parse(content);
    } catch (parseError) {
      console.error(`解析workflow.json失败:`, parseError.message);

      // 尝试修复JSON格式问题
      const fixedContent = fixJsonContent(content);
      if (fixedContent) {
        try {
          const parsed = JSON.parse(fixedContent);
          console.log('已修复workflow.json格式问题，正在保存修复后的文件...');

          // 使用安全方式写回修复后的文件
          await writeWorkflowSafely(projectId, parsed);
          return parsed;
        } catch (fixError) {
          console.error('修复workflow.json失败:', fixError);
          return null;
        }
      }
      return null;
    }
  } catch (error) {
    console.error(`读取workflow.json失败:`, error);
    return null;
  }
}

/**
 * 修复JSON内容中的常见格式问题
 * @param {string} content 原始JSON内容
 * @returns {string|null} 修复后的JSON内容或null（如果无法修复）
 */
function fixJsonContent(content) {
  try {
    // 移除文件末尾的多余内容
    // 查找最后一个有效的JSON闭合括号/方括号
    const lines = content.split('\n');
    let braceCount = 0;
    let bracketCount = 0;
    let inString = false;
    let escapeNext = false;

    // 从头开始计算括号匹配
    let validEndIndex = -1;

    for (let i = 0; i < content.length; i++) {
      const char = content[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        escapeNext = true;
        continue;
      }

      if (char === '"' && !escapeNext) {
        inString = !inString;
      }

      if (!inString) {
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
        } else if (char === '[') {
          bracketCount++;
        } else if (char === ']') {
          bracketCount--;
        }
      }

      // 当所有括号都匹配时，记录位置
      if (braceCount === 0 && bracketCount === 0 && (char === '}' || char === ']')) {
        validEndIndex = i;
      }
    }

    if (validEndIndex !== -1) {
      // 提取有效部分
      const validContent = content.substring(0, validEndIndex + 1);

      // 验证修复后的内容是否为有效JSON
      JSON.parse(validContent);
      return validContent;
    }

    return null;
  } catch (error) {
    console.error('修复JSON内容时出错:', error);
    return null;
  }
}

/**
 * 安全地写入workflow.json文件（使用临时文件和原子操作）
 * @param {string} projectId 项目ID
 * @param {object} workflow workflow对象
 * @returns {boolean} 是否写入成功
 */
async function writeWorkflowSafely(projectId, workflow) {
  try {
    const workflowPath = path.join(config.PROJECT_DIR, projectId, '1', 'data', 'workflow.json');
    const tempPath = workflowPath + '.tmp';

    // 确保目录存在
    await fs.ensureDir(path.dirname(workflowPath));

    // 写入临时文件
    await fs.writeJson(tempPath, workflow, { spaces: 2 });

    // 原子性地替换原文件
    await fs.move(tempPath, workflowPath, { overwrite: true });

    console.log(`  📝 已安全写入workflow.json: ${workflowPath}`);
    return true;
  } catch (error) {
    console.error(`安全写入workflow.json失败:`, error);

    // 尝试清理临时文件
    try {
      const workflowPath = path.join(config.PROJECT_DIR, projectId, '1', 'data', 'workflow.json');
      const tempPath = workflowPath + '.tmp';
      if (await fs.pathExists(tempPath)) {
        await fs.remove(tempPath);
      }
    } catch (cleanupError) {
      console.error('清理临时文件失败:', cleanupError);
    }

    return false;
  }
}

module.exports = {
  readWorkflowSafely,
  writeWorkflowSafely,
  fixJsonContent
};