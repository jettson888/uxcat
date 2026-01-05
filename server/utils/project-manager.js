const fs = require('fs-extra');
const path = require('path');
const config = require('../config');

// 映射文件路径
const PROJECT_MAP_FILE = path.join(config.PROJECT_DIR, 'project-map.json');

/**
 * 获取所有项目映射
 */
async function getProjectMap() {
    try {
        if (!await fs.pathExists(PROJECT_MAP_FILE)) {
            return {};
        }
        return await fs.readJson(PROJECT_MAP_FILE);
    } catch (error) {
        console.error('读取项目映射文件失败:', error);
        return {};
    }
}

/**
 * 保存项目映射
 */
async function saveProjectMap(map) {
    try {
        await fs.ensureDir(config.PROJECT_DIR);
        await fs.writeJson(PROJECT_MAP_FILE, map, { spaces: 2 });
    } catch (error) {
        console.error('保存项目映射文件失败:', error);
        throw error;
    }
}

/**
 * 创建或更新项目信息
 * @param {Object} projectData 项目数据
 * @param {string} projectData.projectId 项目ID (必需)
 * @param {string} [projectData.projectName] 项目名称
 * @param {string} [projectData.prompt] 提示词
 * @param {string} [projectData.status] 状态
 * @param {string} [projectData.target] 目标
 * @param {string} [projectData.imgUrl] 图片URL
 * @param {string} [projectData.resolution] 分辨率
 * @param {string} [projectData.path] 路径
 */
async function updateProject(projectData) {
    const { projectId } = projectData;
    if (!projectId) {
        throw new Error('projectId is required');
    }

    const map = await getProjectMap();
    const now = Date.now();

    // 如果项目已存在，合并数据
    if (map[projectId]) {
        map[projectId] = {
            ...map[projectId],
            ...projectData,
            updatedAt: now
        };
    } else {
        // 新建项目
        map[projectId] = {
            createAt: now,
            updatedAt: now,
            status: 'pending', // 默认状态
            ...projectData
        };
    }

    await saveProjectMap(map);
    return map[projectId];
}

/**
 * 获取指定项目信息
 */
async function getProject(projectId) {
    const map = await getProjectMap();
    return map[projectId] || null;
}

module.exports = {
    updateProject,
    getProject,
    getProjectMap
};
