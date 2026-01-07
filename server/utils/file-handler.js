const fs = require('fs-extra');
const path = require('path');
const config = require('../config.js');

// 将副本数据copy到模板工程实时性
async function copyAndReplaceTemplate(projectId) {
  const currentDir = path.join(config.PROJECT_DIR, projectId, "1");
  const sourceCodeDir = path.join(currentDir, "code");
  const sourceComponentDir = path.join(currentDir, "components");
  const dynamicDir = path.join(config.CLIENT_DIR, "src", "views", "dynamic");
  const componentDir = path.join(config.CLIENT_DIR, "src", "components");
  await copyDirectory(sourceCodeDir, dynamicDir);
  await copyDirectory(sourceComponentDir, componentDir);
}

async function copyDirectory(src, dest) {
  await fs.mkdir(src, { recursive: true });
  await fs.mkdir(dest, { recursive: true });
  await deleteDirectory(dest)
  await fs.ensureDir(dest);
  await fs.copy(src, dest);
}

async function deleteDirectory(dest) {
  try {
    if (await fs.pathExists(dest)) {
      await fs.remove(dest);
    }
  } catch (err) {
    console.warn(`删除目录 ${dest} 失败:`, err);
  }
}

async function copyDirectoryWithDuplicate(src, dest) {
  await fs.mkdir(src, { recursive: true });
  await fs.mkdir(dest, { recursive: true });
  await fs.ensureDir(dest);
  await fs.copy(src, dest);
}


module.exports = {
  copyAndReplaceTemplate,
  copyDirectory,
  deleteDirectory,
  copyDirectoryWithDuplicate
}