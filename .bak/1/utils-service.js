import * as fs from 'fs-extra';
import ifs from "fs";
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { ErrorCodes } from "./error-codes.js";

export class UtilsService {

    async getMaxAvailableDisk() {
        return new Promise((resolve, reject) => {
            exec('df -hT', (error, stdout, stderr) => {
                if (error) return reject(error);
                const lines = stdout.trim().split('\n').slice(1);

                function toMB(sizeStr) {
                    const match = sizeStr.match(/^([\d.]+)\s*([GMkKm]?B?)$/i);
                    if (!match) return 0;
                    const [_, value, unit] = match;
                    const num = parseFloat(value);
                    switch (unit.toUpperCase()) {
                        case 'G': return num * 1024;
                        case 'M': return num;
                        case 'K': return num / 1024;
                        default: return 0;
                    }
                }

                const disks = lines.map(line => {
                    const parts = line.split(/\s+/);
                    // df -hT output: Filesystem Type Size Used Avail Use% Mounted on
                    // We need to be careful about split, sometimes mount point has spaces? 
                    // Assuming standard output for now as per requirement code.
                    const [fs, type, size, used, avail, usePct, ...mountParts] = parts;
                    const mount = mountParts.join(' ');
                    return {
                        filesystem: fs,
                        type,
                        size,
                        used,
                        avail: toMB(avail),
                        mountPoint: mount
                    };
                });

                const filteredDisks = disks.filter(disk => !disk.mountPoint.startsWith('/boot') && disk.mountPoint !== '/');

                if (filteredDisks.length === 0) {
                    // Fallback if no other disks
                    return resolve(os.homedir());
                }

                filteredDisks.sort((a, b) => {
                    const priority = { 'ext4': 1, 'devtmpfs': 2, 'tmpfs': 3 };
                    const aPriority = priority[a.type] || 3;
                    const bPriority = priority[b.type] || 3;
                    if (aPriority !== bPriority) return aPriority - bPriority;
                    return b.avail - a.avail;
                });

                resolve(filteredDisks[0].mountPoint);
            });
        });
    }

    async getHzuxRoot(dirname = 'hzux') {
        let projectPath = "";
        if (process.platform === "win32") {
            projectPath = path.join("D://", "frontend-code", dirname);
        } else {
            try {
                const rootHomeDir = await this.getMaxAvailableDisk();
                if (rootHomeDir) {
                    projectPath = path.join(rootHomeDir, "frontend-code", dirname);
                } else {
                    projectPath = path.join(os.homedir(), "frontend-code", dirname);
                }
            } catch (e) {
                console.error('Failed to get max available disk, falling back to homedir', e);
                projectPath = path.join(os.homedir(), "frontend-code", dirname);
            }
        }
        await fs.ensureDir(projectPath);
        return projectPath;
    }

    async getProjectPath(projectName) {
        const root = await this.getHzuxRoot();
        return path.join(root, projectName);
    }

    async createVersion(projectPath) {
        try {
            await fs.ensureDir(projectPath);
            const files = await fs.promises.readdir(projectPath);
            const versions = files.map((f) => parseInt(f)).filter((n) => !isNaN(n));
            return versions.length ? Math.max(...versions) + 1 : 1;
        } catch (error) {
            console.error("Error getting version", error);
            return 1;
        }
    }

    async getLastestVersion(root) {
        try {
            if (!await fs.pathExists(root)) {
                throw new Error("文件夹不存在");
            }
            const items = await ifs.readdir(root);

            const numericFolders = [];
            for (const item of items) {
                const fullPath = path.join(root, item);
                const stat = await fs.stat(fullPath);
                if (stat.isDirectory() && /^\d+$/.test(item)) {
                    numericFolders.push(item);
                }
            }

            if (numericFolders.length === 0) {
                // If no version exists, maybe return "0" or throw? 
                // Requirement says "未找到数字命名的子文件夹" throws error.
                // But for robustness, if we are asking for latest version to read, it should exist.
                // If we are asking to create, we use getVersion.
                throw new Error("未找到数字命名的子文件夹");
            }

            const latestFolder = numericFolders
                .reduce((max, current) => {
                    return Math.max(max, parseInt(current, 10));
                }, 0)
                .toString();

            return latestFolder;
        } catch (error) {
            throw error;
        }
    }

    async deleteDirectory(dest) {
        try {
            if (await fs.pathExists(dest)) {
                await fs.remove(dest);
            }
        } catch (err) {
            console.warn(`删除目录 ${dest} 失败:`, err);
        }
    }

    async copyDirectoryWithDuplicate(src, dest) {
        await ifs.promises.mkdir(src, { recursive: true });
        await ifs.promises.mkdir(dest, { recursive: true });
        await fs.ensureDir(dest);
        await fs.copy(src, dest);
    }


    async copyDirectory(src, dest) {
        await ifs.promises.mkdir(src, { recursive: true });
        await ifs.promises.mkdir(dest, { recursive: true });
        await this.deleteDirectory(dest)
        await fs.ensureDir(dest);
        await fs.copy(src, dest);
    }

    async copyFileWithReplace(srcPath, destPath) {
        try {
            if (await fs.pathExists(destPath)) {
                await fs.remove(destPath);
                console.log(`已删除旧文件: ${destPath}`);
            }
            await fs.copy(srcPath, destPath);
            console.log(`文件复制成功: ${srcPath} -> ${destPath}`);
            return true;
        } catch (err) {
            console.error("文件操作失败:", err);
            return false;
        }
    }

    async createProject(projectName, v = '1') {
        try {
            const projectPath = await this.getProjectPath(projectName);
            await fs.ensureDir(projectPath);
            const version = v ?? await this.createVersion(projectPath);
            const versionPath = path.join(projectPath, version.toString());
            await fs.ensureDir(versionPath);
            return versionPath;
        } catch (error) {
            console.error('Create project failed', error);
            throw error;
        }
    }

    async getProjectDir(projectName, version = '1') {
        const projectPath = await this.getProjectPath(projectName);
        const v = version || await this.getLastestVersion(projectPath);
        return path.join(projectPath, v);
    }

    async extractVueTemplates(content) {
        const vueTemplateRegex = /```vue([\s\S]*?)```/g;
        const matches = [];
        let match;

        while ((match = vueTemplateRegex.exec(content)) !== null) {
            matches.push(match[1].trim());
        }

        if (matches.length === 0) {
            return content;
        } else if (matches.length === 1) {
            return matches[0];
        } else {
            return matches.map(m => `\`\`\`${m}\`\`\``);
        }
    }

    returnData(data = {}, parmas = {}) {
        const errorCode = parmas.errorCode || ErrorCodes.SUCCESS;
        const errorMessage = parmas.errorMessage || '';
        const error = parmas.error || null
        return {
            header: {
                errorCode,
                errorMessage,
                error,
            },
            body: {
                data: data || {},
            },
        };
    }
}
