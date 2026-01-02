import * as path from "path";
import fs from "fs-extra";

import { ErrorCodes } from "./error-codes.js";

import {
  ANALYSIS_SYSTEM_PROMPT,
  SYSTEM_PROMPT,
  NAV_COMP_PROMPT,
} from "./prompt.js";
import { isValidVueComponent } from "./utils.js";

import { projectService, llmService, utilsService } from "./provider.js";
import { stateManager } from "./state-manager.js";
import { generatorAgent, reviewerAgent } from "./agents.js";

export async function replaceWorkflows(projectDir, workflows = []) {
  try {
    const workflowPath = path.join(projectDir, "data", "workflow.json");
    const workflow = await fs.readJSON(workflowPath);
    const content = JSON.parse(workflow.content);
    content.workflows = workflows;
    workflow.content = JSON.stringify(content);
    await fs.writeJSON(workflowPath, workflow, { spaces: 2 });
  } catch (error) {
    console.error(`Failed to replace pages`, error);
  }
}

export async function getWorkflow(projectId, v = "1") {
  try {
    const projectPath = await utilsService.getProjectPath(projectId);
    const version = v || (await utilsService.getLastestVersion(projectPath));
    const dir = path.join(projectPath, version);
    const workflowPath = path.join(dir, "data", "workflow.json");

    if (!(await fs.pathExists(workflowPath))) {
      return [];
    }
    let workflow = null;
    const stats = await fs.stat(workflowPath);
    if (stats.size !== 0) {
      workflow = await fs.readJSON(workflowPath);
    }
    return [workflow, workflowPath];
  } catch (error) {
    console.error(`Failed to get workflow pages`, error);
    throw error;
  }
}

export async function getWorkflowPages(projectId, v = "1") {
  try {
    const [workflow] = await getWorkflow(projectId, v);
    if (!workflow || !workflow.content) {
      return [];
    }
    if (workflow.content && typeof workflow.content === "string") {
      workflow.content = JSON.parse(workflow.content);
    }
    return workflow.content.pages;
  } catch (error) {
    console.error(`Failed to get workflow pages`, error);
    throw error;
  }
}

export async function updatePage(
  projectId,
  pageId,
  updates = { name: "", description: "" }
) {
  try {
    const projectPath = await utilsService.getProjectPath(projectId);
    const version = await utilsService.getLastestVersion(projectPath);
    const dir = path.join(projectPath, version);

    // Use StateManager to ensure consistent writes
    await stateManager.updatePage(dir, pageId, updates);

    // Return the updated page (we assume it worked for now, or fetch it again if strictness needed)
    // For now, let's just return what we expect.
    // Ideally updatePage logic should move entirely to StateManager if we want return values
    // But since StateManager is async queue, we might just return success.

    return { success: true, message: "Page update queued" };
  } catch (error) {
    console.error(`Failed to update page ${pageId}`, error);
    throw error;
  }
}

export async function processChatCompletion(
  projectId,
  messages,
  target,
  resolution
) {
  try {
    const response = await llmService.chatCompletion(
      messages,
      "deepseek-reason"
    );
    const content = response.choices[0].message.content;

    // 创建更新map
    const projectPath = await utilsService.getProjectPath(projectId);
    await projectService.updateProjectMap(projectId, {
      status: "done",
      target,
      resolution,
      projectName: "New Project",
      path: projectPath,
    });
    // 创建存储数据文件夹
    const projectPathWithVersion = await utilsService.createProject(
      projectId,
      "1"
    );
    const dataPath = path.join(projectPathWithVersion, "data");
    await fs.ensureDir(dataPath);

    try {
      const jsonContent = JSON.parse(content);
      jsonContent.pages = jsonContent.pages.map((page) => {
        return {
          ...page,
          status: "pending",
        };
      });
      // 把模型返回的思维树写入workflow.json
      await fs.writeJSON(
        path.join(dataPath, "workflow.json"),
        {
          content: JSON.stringify(jsonContent),
          createAt: new Date().toISOString(),
          target,
          resolution,
        },
        { spaces: 2 }
      );
      if (jsonContent.projectName) {
        await projectService.updateProjectMap(projectId, {
          projectName: jsonContent.projectName,
        });
      }
    } catch (e) { }
  } catch (error) {
    console.error(`Process chat completion failed`, error);
    await projectService.updateProjectMap(projectId, {
      status: "error",
      errorMessage: error.message,
    });
  }
}

export async function replacePages(projectDir, pages = []) {
  try {
    const workflowPath = path.join(projectDir, "data", "workflow.json");
    const workflow = await fs.readJSON(workflowPath);
    const content = JSON.parse(workflow.content);
    content.pages = pages;
    workflow.content = JSON.stringify(content);
    await fs.writeJSON(workflowPath, workflow, { spaces: 2 });
  } catch (error) {
    console.error(`Failed to replace pages`, error);
  }
}

export async function processCodeGeneration(
  pages = [],
  projectDir = "",
  target = "",
  resolution = "",
  previousPageCode = "",
  callback = () => null
) {
  const clientPath = await utilsService.getHzuxRoot("ai-ux");
  const TARGET_DIR = path.join(clientPath, "client", "src", "views", "dynamic");
  callback();
  await fs.ensureDir(TARGET_DIR);
  const globalCompPrompt = await getGlobalComp(projectDir);

  for (const page of pages) {
    const pageName = page.pageId;

    // Explicitly update status to generating via StateManager to fix sync issues
    await stateManager.updatePageStatus(projectDir, pageName, "generating");

    try {
      // 1. Generate Code using GeneratorAgent
      const generatedCode = await generatorAgent.generate(page, target, resolution, globalCompPrompt);

      // 2. Review Code using ReviewerAgent (Checkpointing)
      const reviewResult = await reviewerAgent.review(generatedCode, pageName);

      if (reviewResult.approved) {
        const componentContent = reviewResult.code;
        const fileName = `${page.pageId}.vue`;
        const filePath = path.join(projectDir, "code", fileName);

        await fs.writeFile(filePath, componentContent);

        // In test environment, target dir might not exist or matter as much, 
        // but for real app we copy. We should ensure path exists.
        await fs.ensureDir(path.dirname(path.join(TARGET_DIR, fileName)));
        try {
          await utilsService.copyFileWithReplace(
            filePath,
            path.join(TARGET_DIR, fileName)
          );
        } catch (copyError) {
          console.warn(`[Agent] Failed to copy to client dir (expected in test mode): ${copyError.message}`);
        }

        // 3. Update status to done via StateManager
        await stateManager.updatePageStatus(projectDir, pageName, "done");
      } else {
        console.warn(`Validation failed for ${pageName}: ${reviewResult.reason}`);
        await stateManager.updatePageStatus(projectDir, pageName, "error");
      }
    } catch (e) {
      console.error(`Failed to generate code for page ${page.name}`, e);
      await stateManager.updatePageStatus(projectDir, pageName, "error");
    }
  }
}

// Wrapper for backward compatibility if needed, but implementation uses StateManager
export async function updatePageStatus(
  projectDir = "",
  pageId = "",
  status = "pending" | "generating" | "done" | "error"
) {
  return stateManager.updatePageStatus(projectDir, pageId, status);
}

export async function replaceAssetsCover(projectId) {
  // 全量替换模板工程cover
  const projectPath = await utilsService.getProjectPath(projectId);
  const version = "1";
  const projectDir = path.join(projectPath, version);

  await fs.ensureDir(path.join(projectDir, "data"));
  await fs.ensureDir(path.join(projectDir, "code"));

  const latestVersion = await utilsService.getLastestVersion(projectPath);
  const srcPath = path.join(projectPath, latestVersion, "cover");
  await fs.ensureDir(srcPath);

  const clientPath = await utilsService.getHzuxRoot("ai-ux");
  const TARGET_DIR = path.join(
    clientPath,
    "client",
    "src",
    "assets",
    "images",
    "cover"
  );

  await utilsService.copyDirectory(srcPath, TARGET_DIR);
}

export async function updatePageImgUrl(projectId = "", pageId = "") {
  try {
    const [workflow, workflowPath] = await getWorkflow(projectId);
    if (!workflow) return;
    const content = JSON.parse(workflow.content);
    // 更新指定页面的imgUrl
    for (const page of content.pages) {
      if (page.pageId === pageId) {
        page.imgUrl = `/assets/${projectId}/1/${pageId}.png`;
        break; // 找到目标页面后可以提前退出循环
      }
    }

    // 直接操作content对象，而不是workflow.content
    content.imgUrl = content.pages[0].imgUrl;
    workflow.content = JSON.stringify(content);
    await fs.writeJSON(workflowPath, workflow, { spaces: 2 });
  } catch (error) {
    console.error(`Failed to update page imgUrl for ${pageId}`, error);
  }
}

/**
 * 先生成导航后生成页面代码
 */
export async function firstGenerateCode(
  pages = [],
  checkedNodes = [],
  projectDir = "",
  target = "",
  resolution = ""
) {
  let previousPageCode = null;
  await processGlobalCompGeneration(pages, projectDir);
  processCodeGeneration(
    checkedNodes,
    projectDir,
    target,
    resolution,
    previousPageCode,
    async () => {
      const clientPath = await utilsService.getHzuxRoot("ai-ux");
      const TARGET_DIR_ROOT = path.join(clientPath, "client");
      const TARGET_DIR = path.join(TARGET_DIR_ROOT, "src", "views", "dynamic");
      // await utilsService.deleteDirectory(TARGET_DIR);
      const sourceDir = path.join(projectDir, "code");
      // await utilsService.copyDirectory(sourceDir, TARGET_DIR);

      const coverDir = path.join(projectDir, "cover");
      const targetCoverDir = path.join(
        TARGET_DIR_ROOT,
        "src",
        "assets",
        "images",
        "cover"
      );
      await utilsService.copyDirectory(coverDir, targetCoverDir);
    }
  ).catch((err) => {
    console.error("Code generation failed", err);
  });
}

/**
 * 处理公共组件生成
 */
export async function processGlobalCompGeneration(pages = [], projectDir = "") {
  const componentPath = path.join(projectDir, "components");
  await fs.ensureDir(componentPath);
  //导航组件
  await processGlobalNavCompGeneration(pages, componentPath);
  //其他组件...
}

export async function processGlobalNavCompGeneration(
  pages = [],
  componentPath = ""
) {
  const globalNavigationCompPath = path.join(
    componentPath,
    "GlobalNavigation.vue"
  );
  if (fs.existsSync(globalNavigationCompPath)) {
    return;
  }
  //开始生成导航组件
  let prompt = NAV_COMP_PROMPT;
  const homePage = pages.find((page) => page.pageId === "homePage");
  if (!homePage) {
    //未找到首页，不生成导航
    return;
  }
  prompt = prompt.replace("{homePage}", JSON.stringify(homePage));
  const messages = [{ role: "user", content: prompt }];
  const response = await llmService.chatCompletion(messages, "qwen-coder");
  let componentCode = JSON.parse(response.choices[0].message.content).content;
  // if(isValidVueComponent(componentCode)){
  //     //生成的导航组件代码异常
  //     return;
  // }
  await fs.writeFileSync(globalNavigationCompPath, componentCode);
  const clientPathRoot = await utilsService.getHzuxRoot("ai-ux");
  const clientPath = path.join(clientPathRoot, "client");
  const TARGET_COMPS_DIR = path.join(clientPath, "src", "components");
  await fs.ensureDir(TARGET_COMPS_DIR);
  const TARGET_DIR = path.join(TARGET_COMPS_DIR, "GlobalNavigation.vue");
  const COMPONNETS_DIR = path.join(clientPath, "src", "components");
  await utilsService.deleteDirectory(COMPONNETS_DIR);
  await fs.ensureDir(COMPONNETS_DIR);
  await utilsService.copyFileWithReplace(
    globalNavigationCompPath,
    path.join(TARGET_DIR)
  );
}

export async function getGlobalComp(projectDir = "") {
  let compArrayStr = "";
  //导航组件
  let globalNav = await getGlobalNavigationComp(projectDir);
  compArrayStr += globalNav;
  //其他组件...
  console.log("公共组件:" + compArrayStr);
  return compArrayStr;
}

export async function getGlobalNavigationComp(projectDir = "") {
  try {
    const globalNavigationCompPath = path.join(
      projectDir,
      "components",
      "GlobalNavigation.vue"
    );
    if (await fs.pathExists(globalNavigationCompPath)) {
      const globalNavigationCompCode = await fs.readFile(
        globalNavigationCompPath,
        "utf-8"
      );
      return `
            ## 导航组件
            ### 组件源码
            ${globalNavigationCompCode}
            `;
    }
  } catch (error) {
    console.warn("Global navigation component not found or readable", error);
  }
  return "";
}

export async function replacePagesAndWorkflow(body) {
  const {
    pages,
    checkedNodes,
    projectId,
    target = "web",
    resolution = "1920 * 1080",
    workflows,
  } = body;
  const projectPath = await utilsService.getProjectPath(projectId);
  const version = "1";
  const projectDir = path.join(projectPath, version);

  await fs.ensureDir(path.join(projectDir, "data"));
  await fs.ensureDir(path.join(projectDir, "code"));

  // 直接替换workflow.json下面的pages
  await replacePages(projectDir, pages);
  await replaceWorkflows(projectDir, workflows);
}

export async function updateWorkflowProjectName(
  projectId = "",
  projectName = ""
) {
  const projectPath = await utilsService.getProjectPath(projectId);
  const version = "1";
  const projectDir = path.join(projectPath, version);
  await fs.ensureDir(path.join(projectDir, "data"));
  const workflowPath = path.join(projectDir, "data", "workflow.json");
  const workflow = await fs.readJSON(workflowPath);
  const content = JSON.parse(workflow.content);
  content.projectName = projectName;
  workflow.content = JSON.stringify(content);
  await fs.writeJSON(workflowPath, workflow, { spaces: 2 });
}
