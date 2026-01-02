import { UtilsService } from './utils-service.js';
import * as path from 'path';
import fs from 'fs-extra';

export class ProjectService {

    constructor() {
        this.utilsService = new UtilsService()
    }

    async getProjectMap() {
        const root = await this.utilsService.getHzuxRoot();
        const projectMapPath = path.join(root, 'project-map.json');
        if (!await fs.pathExists(projectMapPath)) {
            return {};
        }
        return fs.readJSON(projectMapPath);
    }

    async updateProjectMap(projectId, data) {
        const root = await this.utilsService.getHzuxRoot();
        const projectMapPath = path.join(root, 'project-map.json');
        let map = await this.getProjectMap();
        map[projectId] = { ...map[projectId], ...data };
        await fs.writeJSON(projectMapPath, map, { spaces: 2 });
    }

    async createProjectMap(projectId) {
        await this.updateProjectMap(projectId, {
            createAt: new Date().toISOString(),
            status: 'pending',
            projectName: 'New Project',
            target: '',
            imgUrl: '',
            resolution: '',
            path: "",
        });
    }

    async getLatestProjectWorkflow(projectPath) {
        const version = await this.utilsService.getLastestVersion(projectPath);
        const workflowPath = path.join(projectPath, version, 'data', 'workflow.json');
        if (await fs.pathExists(workflowPath)) {
            return fs.readJSON(workflowPath);
        }
        return null;
    }
}
