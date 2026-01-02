// tools/fileTools.js
const fs = require('fs-extra');
const path = require('path');
const config = require('../config.js');

const tools = [
  {
    name: "read_file",
    description: "读取项目中已有文件内容",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string" },
        scope: { type: "string" }
      },
      required: ["path"]
    },
    async execute({ path: filePath }) {
      try {
        return await fs.readFile(path.join(process.cwd(), filePath), 'utf-8');
      } catch (e) {
        return `文件读取失败: ${e.message}`;
      }
    }
  },
  {
    name: "write_file",
    description: "将内容写入指定路径（会自动创建目录）",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string" },
        content: { type: "string" }, // or buffer
        scope: { type: "string" }
      },
      required: ["path", "content"]
    },
    async execute({ path: filePath, content }) {
      let finalPath;
      if (path.isAbsolute(filePath)) {
        finalPath = filePath;
      } else {
        finalPath = path.join(config.PROJECT_DIR, filePath);
      }
      await fs.outputFile(finalPath, content);
      return `文件已写入: ${finalPath}`;
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
        scope: { type: "string" }
      },
      required: ["dir"]
    },
    async execute({ dir, scope, recursive = false }) {
      let rootDir = ''
      if (scope === 'client_dir') {
        rootDir = path.join(config.CLIENT_DIR, dir);
      }
      if (scope === 'project_dir') {
        rootDir = path.join(config.PROJECT_DIR, dir);
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