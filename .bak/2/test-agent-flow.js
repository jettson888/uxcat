
import path from "path";
import fs from "fs-extra";
import { processCodeGeneration, updatePageStatus } from "./fs-core.js";
import { llmService, utilsService } from "./provider.js";
import { stateManager } from "./state-manager.js";

async function runTest() {
    const projectId = "test-project-" + Date.now();
    const projectPath = await utilsService.getProjectPath(projectId);
    const version = "1";
    const projectDir = path.join(projectPath, version);

    console.log("Setting up test project at:", projectDir);

    // 1. Setup Mock Data
    await fs.ensureDir(path.join(projectDir, "data"));
    await fs.ensureDir(path.join(projectDir, "code"));

    const testPageId = "testPage";
    const mockWorkflow = {
        content: JSON.stringify({
            pages: [
                {
                    pageId: testPageId,
                    name: "Test Page",
                    description: "A test page",
                    status: "pending",
                    navigationList: []
                }
            ]
        })
    };

    await fs.writeJSON(path.join(projectDir, "data", "workflow.json"), mockWorkflow);

    // 2. Mock LLM Service
    llmService.chatCompletion = async (messages, model) => {
        console.log("[MockLLM] Received request");
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate delay
        return {
            choices: [
                {
                    message: {
                        content: `
              <template>
                <div class="test-page">Test Content</div>
              </template>
              <script>
              export default {
                name: 'TestPage'
              }
              </script>
              <style>
              .test-page { color: red; }
              </style>
            `
                    }
                }
            ]
        };
    };

    // 3. Monitor State Changes
    const stateCheckInterval = setInterval(async () => {
        try {
            const workflow = await fs.readJSON(path.join(projectDir, "data", "workflow.json"));
            const content = JSON.parse(workflow.content);
            const page = content.pages.find(p => p.pageId === testPageId);
            console.log(`[Monitor] Page status: ${page.status}`);
        } catch (e) {
            // ignore read errors during write
        }
    }, 50);

    // 4. Run Generation
    console.log("Starting code generation...");
    const pages = JSON.parse(mockWorkflow.content).pages;

    try {
        await processCodeGeneration(
            pages,
            projectDir,
            "web",
            "1920*1080",
            ""
        );
        console.log("Code generation finished.");
    } catch (e) {
        console.error("Test failed with error:", e);
    } finally {
        clearInterval(stateCheckInterval);

        // 5. Verify Final State
        const workflow = await fs.readJSON(path.join(projectDir, "data", "workflow.json"));
        const content = JSON.parse(workflow.content);
        const finalPage = content.pages.find(p => p.pageId === testPageId);

        if (finalPage.status === "done") {
            console.log("✅ Test Passed: Final status is 'done'");
        } else {
            console.error(`❌ Test Failed: Final status is '${finalPage.status}'`);
        }

        // 6. Verify File Exists
        const codeExists = await fs.pathExists(path.join(projectDir, "code", `${testPageId}.vue`));
        if (codeExists) {
            console.log("✅ Test Passed: Code file exists");
        } else {
            console.error("❌ Test Failed: Code file missing");
        }

        // Cleanup
        // await fs.remove(projectPath);
    }
}

runTest();
