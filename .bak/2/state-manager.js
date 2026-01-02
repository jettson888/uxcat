
import path from "path";
import fs from "fs-extra";

export class StateManager {
    constructor() {
        this.updateQueue = Promise.resolve();
    }

    /**
     * Safely updates the status of a page in workflow.json
     * @param {string} projectDir - The root directory of the project version
     * @param {string} pageId - The ID of the page to update
     * @param {string} status - The new status
     */
    async updatePageStatus(projectDir, pageId, status) {
        this.updateQueue = this.updateQueue.then(async () => {
            try {
                const workflowPath = path.join(projectDir, "data", "workflow.json");

                // Check if file exists to prevent errors
                if (!(await fs.pathExists(workflowPath))) {
                    console.warn(`[StateManager] Workflow file not found at ${workflowPath}`);
                    return;
                }

                const workflow = await fs.readJSON(workflowPath);
                let content;
                try {
                    content = typeof workflow.content === 'string' ? JSON.parse(workflow.content) : workflow.content;
                } catch (e) {
                    console.error("Failed to parse workflow content", e);
                    return;
                }

                const page = content.pages.find((p) => p.pageId === pageId);
                if (page) {
                    page.status = status;
                    // Ensure content is stored as string if that's the convention, or object
                    workflow.content = JSON.stringify(content);
                    await fs.writeJSON(workflowPath, workflow, { spaces: 2 });
                    console.log(`[StateManager] Updated ${pageId} status to ${status}`);
                } else {
                    console.warn(`[StateManager] Page ${pageId} not found in ${workflowPath}`);
                }
            } catch (error) {
                console.error(`[StateManager] Failed to update page status for ${pageId}`, error);
            }
        });

        return this.updateQueue;
    }

    /**
     * Safely updates page details (name, description, status) in workflow.json
     * @param {string} projectDir - The root directory of the project version
     * @param {string} pageId - The ID of the page to update
     * @param {object} updates - Object containing fields to update
     */
    async updatePage(projectDir, pageId, updates) {
        this.updateQueue = this.updateQueue.then(async () => {
            try {
                const workflowPath = path.join(projectDir, "data", "workflow.json");

                if (!(await fs.pathExists(workflowPath))) {
                    return;
                }

                const workflow = await fs.readJSON(workflowPath);
                let content;
                try {
                    content = typeof workflow.content === 'string' ? JSON.parse(workflow.content) : workflow.content;
                } catch (e) {
                    return;
                }

                const page = content.pages.find((p) => p.pageId === pageId);
                if (page) {
                    if (updates.name) page.name = updates.name;
                    if (updates.description) page.description = updates.description;
                    if (updates.status) page.status = updates.status;

                    workflow.content = JSON.stringify(content);
                    await fs.writeJSON(workflowPath, workflow, { spaces: 2 });
                    console.log(`[StateManager] Updated ${pageId} details`);
                }
            } catch (error) {
                console.error(`[StateManager] Failed to update page ${pageId}`, error);
            }
        });
        return this.updateQueue;
    }
}

export const stateManager = new StateManager();
