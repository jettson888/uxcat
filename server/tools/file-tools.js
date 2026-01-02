// tools/fileTools.js
const fs = require('fs-extra');
const path = require('path');
const config = require('../config.js');
const { description } = require('./knowledge-tool.js');

const tools = [
  {
    name: "read_file",
    description: "读取项目中已有文件内容（JSON 文件自动解析为对象）",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string" },
        scope: { type: "string", description: '指定文件路径的作用域，可选值有 clientDir 和 projectDir' }
      },
      required: ["path"]
    },
    async execute({ path: filePath, scope }) {
      try {
        let finalPath;
        if (path.isAbsolute(filePath)) {
          finalPath = filePath;
        } else {
          let rootDir = ''
          if (scope === 'clientDir') {
            rootDir = config.CLIENT_DIR;
          }
          if (scope === 'projectDir') {
            rootDir = config.PROJECT_DIR;
          }
          finalPath = path.join(rootDir, filePath);
        }

        const content = await fs.readFile(finalPath, 'utf-8');

        // 检查是否是 JSON 文件且需要解析
        const ext = finalPath.toLowerCase().split('.').pop();
        if (ext === 'json') {
          try {
            const parsed = JSON.parse(content);
            console.log(`[JSON读取] ${finalPath}`);
            return parsed; // 返回解析后的对象
          } catch (parseError) {
            console.warn(`[JSON解析失败] ${finalPath}，返回原始字符串`);
            return content; // 解析失败返回原始内容
          }
        }

        console.log(`[文件读取] ${finalPath}`);
        return content; // 返回原始字符串
      } catch (e) {
        console.error(`文件读取失败: ${filePath}`, e);
        return `文件读取失败: ${e.message}`;
      }
    }
  },
  {
    name: "write_file",
    description: "将内容写入指定路径（会自动创建目录，支持 JSON 格式化写入）",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string" },
        content: { type: ["string", "object"] }, // 支持字符串或对象
        scope: { type: "string", description: '指定文件路径的作用域，可选值有 clientDir 和 projectDir' }
      },
      required: ["path", "content"]
    },
    async execute({ path: filePath, content, scope }) {

      let finalPath;
      if (path.isAbsolute(filePath)) {
        finalPath = filePath;
      } else {
        let rootDir = ''
        if (scope === 'clientDir') {
          rootDir = config.CLIENT_DIR;
        }
        if (scope === 'projectDir') {
          rootDir = config.PROJECT_DIR;
        }
        finalPath = path.join(rootDir, filePath);
      }

      try {
        // 根据标志选择写入方式
        if (typeof content === 'object') {
          // 使用 writeJson 进行格式化写入
          await fs.writeJson(finalPath, content, { spaces: 2 });
          console.log(`[JSON写入] ${finalPath}`);
        } else {
          // 使用 outputFile 写入字符串内容
          await fs.outputFile(finalPath, content);
          console.log(`[文件写入] ${finalPath}`);
        }
        return {
          success: true,
          status: 'success',
          message: `文件已写入: ${finalPath}`
        };
      } catch (error) {
        console.error(`文件写入失败: ${finalPath}`, error);
        throw new Error(`文件写入失败: ${error.message}`);
      }
    }
  },
  {
    name: "list_files",
    description: "列出指定目录下的文件（递归可选）",
    input_schema: {
      type: "object",
      properties: {
        dir: { type: "string" },
        recursive: { type: "boolean" },
        scope: { type: "string", description: '指定文件路径的作用域，可选值有 clientDir 和 projectDir' }
      },
      required: ["dir"]
    },
    async execute({ dir, scope, recursive = false }) {
      let rootDir = ''
      if (scope === 'clientDir') {
        rootDir = config.CLIENT_DIR;
      }
      if (scope === 'projectDir') {
        rootDir = config.PROJECT_DIR;
      }

      async function getFiles(currentDir) {
        let entries;
        try {
          entries = await fs.readdir(currentDir, { withFileTypes: true });
        } catch (e) {
          return [];
        }

        const fileList = [];

        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);

          if (entry.isDirectory()) {
            if (entry.name === 'node_modules' || entry.name === '.git') continue;
            if (recursive) {
              fileList.push(...await getFiles(fullPath));
            }
          } else if (entry.isFile()) {
            fileList.push(path.relative(process.cwd(), fullPath));
          }
        }
        return fileList;
      }

      const files = await getFiles(rootDir);
      return files.join("\n");
    }
  }
];

module.exports = tools;