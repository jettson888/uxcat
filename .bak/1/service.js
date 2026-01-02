import http from "http";
import url from "url";
import path from "path";
import fs from "fs";
import * as fsExtra from "fs-extra";
import { exec, execSync } from "child_process";
import archiver from "archiver";
import { updateRoutes, resetRoutes } from "./updateRoutes.js"
import { UtilsService } from "./utils-service.js";
import { LlmService } from "./llm-service.js";
import { SSEManager } from "./sse-manager.js";
import { ErrorCodes } from "./error-codes.js";
import {
    ANALYSIS_SYSTEM_PROMPT as ANALYSIS_SYSTEM_PROMPT_INNER,
    SYSTEM_PROMPT as SYSTEM_PROMPT_INNER,
    NAV_COMP_PROMPT as NAV_COMP_PROMPT_INNER,
    VERIFY_META_PROMPT as VERIFY_META_PROMPT_INNER,
} from "./prompt.js";

const utilsService = new UtilsService();
const llmService = new LlmService();
const sseManager = new SSEManager();

// 全局路径常量
let homeDir, clientDir, clientRoutePath, componentDir, dynamicDir, projectDir, assetsDir, activeProjectId, ANALYSIS_SYSTEM_PROMPT, SYSTEM_PROMPT, NAV_COMP_PROMPT, VERIFY_META_PROMPT;
const PROMPT_FILES = {
    ANALYSIS_SYSTEM_PROMPT: 'analysis_system_prompt.txt',
    SYSTEM_PROMPT: 'system_prompt.txt',
    NAV_COMP_PROMPT: 'nav_comp_prompt.txt',
    // VERIFY_META_PROMPT: 'verify_meta_prompt.txt'
};
async function readPromptFile(promptName) {
    try {
        const filePath = path.join(homeDir, PROMPT_FILES[promptName]);
        const content = await fs.promises.readFile(filePath, 'utf-8');
        return content.trim();
    } catch (error) {
        // console.error(`Error reading ${promptName} file:`, error);
        return null;
    }
}
async function initGlobalPrompts() {
    if (!homeDir) {
        ANALYSIS_SYSTEM_PROMPT = ANALYSIS_SYSTEM_PROMPT_INNER;
        SYSTEM_PROMPT = SYSTEM_PROMPT_INNER;
        NAV_COMP_PROMPT = NAV_COMP_PROMPT_INNER;
        // VERIFY_META_PROMPT = VERIFY_META_PROMPT_INNER;
    } else {
        // 读取所有提示文件
        ANALYSIS_SYSTEM_PROMPT = (await readPromptFile('ANALYSIS_SYSTEM_PROMPT')) || ANALYSIS_SYSTEM_PROMPT_INNER;
        SYSTEM_PROMPT = (await readPromptFile('SYSTEM_PROMPT')) || SYSTEM_PROMPT_INNER;
        NAV_COMP_PROMPT = (await readPromptFile('NAV_COMP_PROMPT')) || NAV_COMP_PROMPT_INNER;
        // VERIFY_META_PROMPT = (await readPromptFile('VERIFY_META_PROMPT')) || VERIFY_META_PROMPT_INNER;
    }
}

// 初始化全局路径
async function initGlobalPaths() {
    homeDir = await utilsService.getHzuxRoot("ai-ux");
    clientDir = path.join(homeDir, "client");
    clientRoutePath = path.join(clientDir, "src", "router", "index.js");
    componentDir = path.join(clientDir, "src", "components");
    dynamicDir = path.join(clientDir, "src", "views", "dynamic");
    assetsDir = path.join(homeDir, "assets");
    projectDir = await utilsService.getHzuxRoot();

    // 确保目录存在
    // await fs.promises.mkdir(clientDir, { recursive: true });
    await fs.promises.mkdir(componentDir, { recursive: true });
    await fs.promises.mkdir(dynamicDir, { recursive: true });
    await fs.promises.mkdir(assetsDir, { recursive: true });
}

// 初始化项目目录结构
async function initProjectStructure(projectId, version) {
    const projectPath = path.join(projectDir, projectId);
    const versionPath = path.join(projectPath, version);
    const projectAssetsDir = path.join(homeDir, "assets", projectId, version);
    const dirs = [
        path.join(versionPath, "code"),
        path.join(versionPath, "data"),
        path.join(versionPath, "cover"),
        path.join(versionPath, "components"),
    ];

    for (const dir of dirs) {
        await fs.promises.mkdir(dir, { recursive: true });
    }

    await fs.promises.mkdir(projectAssetsDir, { recursive: true });

    return versionPath;
}

// 创建或更新 project-map.json
async function updateProjectMap(projectId, projectInfo) {
    const projectMapPath = path.join(projectDir, "project-map.json");
    let projectMap = {};

    try {
        if (
            await fs.promises
                .access(projectMapPath)
                .then(() => true)
                .catch(() => false)
        ) {
            const content = await fs.promises.readFile(projectMapPath, "utf8");
            projectMap = JSON.parse(content);
        }
    } catch (error) {
        projectMap = {};
    }

    projectMap[projectId] = {
        ...projectMap[projectId],
        ...projectInfo,
        projectId,
        path: path.join(projectDir, projectId),
    };

    await fs.promises.writeFile(
        projectMapPath,
        JSON.stringify(projectMap, null, 2)
    );
}

// 读取 workflow.json
async function readWorkflow(projectId, version) {
    const workflowPath = path.join(
        projectDir,
        projectId,
        version,
        "data",
        "workflow.json"
    );
    try {
        if (
            await fs.promises
                .access(workflowPath)
                .then(() => true)
                .catch(() => false)
        ) {
            const fileContent = await fs.promises.readFile(workflowPath, "utf8");
            const content = JSON.parse(fileContent);
            if (content && typeof content.content === "string") {
                content.content = JSON.parse(content.content);
            }
            return content;
        }
    } catch (error) {
        console.error("读取workflow失败:", error);
    }
    return null;
}

// 写入 workflow.json
async function writeWorkflow(projectId, version, workflowData) {
    const workflowPath = path.join(
        projectDir,
        projectId,
        version,
        "data",
        "workflow.json"
    );
    const workflowDir = path.dirname(workflowPath);

    try {
        // 确保目录存在
        await fs.promises.mkdir(workflowDir, { recursive: true });

        // 确保content是object
        if (typeof workflowData.content === "string") {
            workflowData.content = JSON.parse(workflowData.content);
        }

        // 写入临时文件
        const tempPath = `${workflowPath}.tmp`;
        await fs.promises.writeFile(
            tempPath,
            JSON.stringify(
                {
                    ...workflowData,
                    content: workflowData.content || {},
                },
                null,
                2
            )
        );

        // 原子性重命名
        await fs.promises.rename(tempPath, workflowPath);

        console.log(`Workflow写入成功: ${workflowPath}`);
    } catch (error) {
        console.error("写入workflow失败:", {
            error: error.message,
            path: workflowPath,
        });
        throw error;
    }
}

// 获取项目最新版本
async function getProjectVersion(projectId) {
    const projectPath = path.join(projectDir, projectId);
    try {
        return await utilsService.getLastestVersion(projectPath);
    } catch (error) {
        return "1";
    }
}

function optimizeFlowData(flowData) {
    const PAGES = new Map();

    const project = JSON.parse(flowData);
    const pages = project.pages;
    const workflows = project.workflows;

    // 将 pages 存入 PAGES Map
    for (let i = 0; i < pages.length; i++) {
        const pageObject = pages[i];
        const pageId = pageObject.pageId;
        PAGES.set(pageId, pageObject);
    }

    // 处理 workflows
    for (let i = 0; i < workflows.length; i++) {
        const workflow = workflows[i];
        const workflowTree = workflow.workflowTree;
        let trees = [workflowTree];

        while (trees.length > 0) {
            const subTrees = [];
            for (let j = 0; j < trees.length; j++) {
                const tree = trees[j];
                const parentPageId = tree.pageId;

                const parentPage = PAGES.get(parentPageId);
                const navigationList = parentPage?.navigationList || [];
                const pageNav = new Map();

                if (navigationList.length > 0) {
                    for (let v = 0; v < navigationList.length; v++) {
                        const navInfo = navigationList[v];
                        const targetPageId = navInfo.targetPageId;
                        const navigationId = navInfo.navigationId;
                        pageNav.set(targetPageId, navigationId);
                    }
                }

                const children = tree.children || [];
                if (children.length === 0) {
                    continue;
                }

                for (let k = 0; k < children.length; k++) {
                    const jsonObject = children[k];
                    const pageId = jsonObject.pageId;
                    const navigationId = pageNav.get(pageId);
                    if (navigationId) {
                        jsonObject.navigationId = navigationId;
                    }
                }

                subTrees.push(...children);
            }
            trees = subTrees;
        }
    }
    return project;
}

async function verifyWorkflow(data, content) {
    const { projectId, model } = data

    const messages2 = [
        { role: "system", content: VERIFY_META_PROMPT },
        { role: "user", content: content },
    ];

    try {
        const modelResponse2 = await llmService.chatCompletion(messages2, model);
        const verifyModelDataContent = modelResponse2.choices[0].message.content
        return verifyModelDataContent
    } catch (error) {
        return null
    }
}

async function insertClientAllRoutes(pages) {
    for (const page of pages) {
        const dynamicPath = path.join(dynamicDir, `${page.pageId}.vue`);

        try {
            // 先检查文件是否已存在
            await fs.promises.access(dynamicPath, fs.constants.F_OK);
            await updateRoutes(page, clientRoutePath);
            console.log(`文件 ${page.pageId}.vue 已存在，跳过创建`);
        } catch (err) {
            // 文件不存在时创建
            if (err.code === 'ENOENT') {
                try {
                    await fs.promises.writeFile(
                        dynamicPath,
                        `<script>export default { name: "${page.pageId}" }</script>\n<template></template>`
                    );
                    console.log(`已创建新组件: ${page.pageId}.vue`);
                    await updateRoutes(page, clientRoutePath);
                } catch (writeErr) {
                    console.error(`创建文件 ${page.pageId}.vue 失败:`, writeErr);
                }
            } else {
                console.error(`检查文件 ${page.pageId}.vue 时发生错误:`, err);
            }
        }
    }
}

// 处理 /v1/chat/completions 路由
async function handleChatCompletions(req, res, data) {
    const {
        prompt,
        projectId: reqProjectId,
        target = "web",
        resolution = "1920 * 1080",
        model = "qwen-coder",
        isRerender = false,
    } = data;

    const projectId = reqProjectId || Date.now().toString();
    const version = !isRerender ? (
        await utilsService.createVersion(path.join(projectDir, projectId))
    ).toString() : await getProjectVersion(projectId);

    sseManager.broadcast("workflow:initial", {
        message: "正在初始化思维导图",
        projectId,
    })
    // 初始化项目结构
    await initProjectStructure(projectId, version);

    // 创建初始 workflow.json
    const initialWorkflow = {
        content: {
            projectName: "",
            description: "",
            pages: [],
            workflows: [],
            status: "generating",
            error: null,
            errorMessage: "",
        },
        prompt,
        createAt: new Date().toISOString(),
        target,
        resolution,
    };
    let updatedWorkflow = JSON.parse(JSON.stringify(initialWorkflow))
    if (isRerender) {
        // 删除文件
        const workflowPath = path.join(projectDir, projectId, '1', "data", "workflow.json")
        await fs.unlinkSync(workflowPath)
        // 在重新生成操作时应显式更新状态
        updatedWorkflow = {
            ...initialWorkflow, // 原有数据
            content: {
                ...initialWorkflow.content,
                status: "generating", // 重置状态
                error: null,          // 清除错误
                errorMessage: ""
            }
        };
    }
    await writeWorkflow(projectId, version, updatedWorkflow);
    sseManager.broadcast("workflow:initaled", {
        message: "思维导图初始化完成",
        projectId,
    })
    // 立即返回响应
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
        JSON.stringify(
            utilsService.returnData({
                status: "success",
                message: "接口调用成功",
            })
        )
    );

    // 异步处理
    try {
        // 更新 project-map.json
        sseManager.broadcast("project:initial", {
            message: "正在初始化项目的全局配置",
            projectId,
        })
        await updateProjectMap(projectId, {
            createAt: new Date().toISOString(),
            status: "generating",
            projectName: "",
            prompt,
            target,
            imgUrl: "",
            resolution,
        });
        sseManager.broadcast("project:initaled", {
            message: "项目的全局配置初始化完成",
            projectId,
        })

        sseManager.broadcast("workflow:planning", {
            message: "开始规划思维导图...",
            projectId,
        })
        // 调用模型生成工作流
        const messages = [
            { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
            { role: "user", content: `设备类型: ${target}, 任务描述: ${prompt}` },
        ];

        const modelResponse = await llmService.chatCompletion(messages, model);
        let workflowContent = initialWorkflow.content;

        if (
            modelResponse &&
            modelResponse.choices &&
            modelResponse.choices.length > 0
        ) {
            try {
                let modelDataContent = modelResponse.choices[0].message.content;
                sseManager.broadcast("workflow:genarated", {
                    message: "思维导图以生成",
                    projectId,
                })
                sseManager.broadcast("workflow:verify", {
                    message: "正在校验思维导图",
                    projectId,
                })
                // const result = await verifyWorkflow(data, modelDataContent)
                // if (result && result.result === '不符合') {
                //   modelDataContent = result.data
                // } 
                //else {
                // modelDataContent = JSON.parse(modelResponse.choices[0].message.content);
                //}
                console.log('modelDataContent---', modelDataContent)
                const modelData = optimizeFlowData(modelDataContent)
                await insertClientAllRoutes(modelData.pages);
                workflowContent = {
                    ...workflowContent,
                    ...modelData,
                    prompt,
                    status: "done",
                    error: null,
                    errorMessage: "",
                };
                sseManager.broadcast("workflow:complete", {
                    message: "思维导图规划完成",
                    projectId,
                    workflow: modelData
                })
            } catch (parseError) {
                console.error("解析模型响应失败:", parseError);
                workflowContent = {
                    ...workflowContent,
                    prompt,
                    status: "error",
                    error: parseError,
                    errorMessage: "模型响应解析失败",
                };
                sseManager.broadcast("workflow:parseError", {
                    message: "思维导图解析失败",
                    projectId,
                    workflow: null,
                    error: parseError.message
                })
            }
        } else {
            workflowContent = {
                ...workflowContent,
                prompt,
                status: "error",
                error: new Error("模型无响应"),
                errorMessage: "模型调用失败，请重试",
            };
            sseManager.broadcast("workflow:parseError", {
                message: "模型无响应结果，解析失败",
                projectId,
                workflow: null,
            })
        }

        // 更新 workflow.json
        const updatedWorkflow = {
            ...initialWorkflow,
            prompt,
            content: workflowContent,
            createAt: new Date().toISOString(),
        };
        await writeWorkflow(projectId, version, updatedWorkflow);
        // 更新 project-map.json
        await updateProjectMap(projectId, {
            createAt: new Date().toISOString(),
            status:
                workflowContent.status === "done" ? "success" : workflowContent.status,
            projectName: workflowContent.projectName,
            target,
            prompt,
            resolution,
        });
        await syncProjectMapToWorkflow(projectId);
    } catch (error) {
        console.error("处理聊天完成请求失败:", error);
        sseManager.broadcast("workflow:error", {
            message: "思维导图规划失败，模型响应失败",
            projectId,
            workflow: null,
            prompt,
            error: error.message
        })

        // 创建错误的 workflow.json
        try {
            const projectId = reqProjectId || Date.now().toString();
            const version = "1";
            await initProjectStructure(projectId, version);

            const errorWorkflow = {
                content: {
                    projectName: "",
                    description: "",
                    pages: [],
                    workflows: [],
                    status: "error",
                    error: error,
                    errorMessage: "模型调用失败，请重试",
                },
                prompt,
                createAt: new Date().toISOString(),
                target,
                resolution,
            };
            await writeWorkflow(projectId, version, errorWorkflow);
        } catch (writeError) {
            console.error("写入错误workflow失败:", writeError);
        }
    }
}

// 处理 /v1/generate-code 路由
async function handleGenerateCode(req, res, data) {
    const {
        pages,
        checkedNodes,
        projectId,
        target = "web",
        resolution = "1920 * 1080",
        workflows,
        model = "qwen-coder",
    } = data;

    activeProjectId = projectId;

    // 立即返回响应
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
        JSON.stringify(
            utilsService.returnData({
                status: "success",
                message: "接口调用成功",
            })
        )
    );

    // 异步处理
    try {
        const version = await getProjectVersion(projectId);
        const versionPath = path.join(projectDir, projectId, version);

        // 更新 workflow.json
        let workflow = await readWorkflow(projectId, version);
        if (workflow) {
            workflow.content.pages = pages;
            workflow.content.workflows = workflows;
            await writeWorkflow(projectId, version, workflow);
        }

        await processGlobalCompGeneration(checkedNodes, projectId, model);

        // 生成页面代码的错误队列
        const errorQueue = [];

        // 并行生成页面代码
        const generatePromises = checkedNodes.map(async (page) => {
            try {
                // 构建提示词
                const basePrompt = `
                    页面名称：${page.name}
                    页面描述：${page.description}
                    页面导航：${JSON.stringify(page.navigationList)}
                    任务描述：基于我输入的页面描述、页面导航、设备类型等信息帮我进行页面设计和开发工作
                `;
                const globalCompPrompt = await getGlobalComp(projectId);

                let systemPrompt = SYSTEM_PROMPT;
                systemPrompt = systemPrompt.replace(
                    "{globalComponents}",
                    globalCompPrompt
                );
                systemPrompt = systemPrompt.replace("{stype}", "");

                const messages = [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: basePrompt },
                ];

                // 调用模型生成代码
                const modelResponse = await llmService.chatCompletion(messages, model);

                if (
                    modelResponse &&
                    modelResponse.choices &&
                    modelResponse.choices.length > 0
                ) {
                    const vueCode = await utilsService.extractVueTemplates(
                        modelResponse.choices[0].message.content
                    );

                    // 保存生成的代码
                    const codePath = path.join(versionPath, "code", `${page.pageId}.vue`);
                    await fs.promises.writeFile(codePath, vueCode);
                    // 复制到 dynamic 目录
                    const dynamicPath = path.join(dynamicDir, `${page.pageId}.vue`);
                    await fs.promises.writeFile(dynamicPath, vueCode);

                    // 更新页面状态
                    if (workflow) {
                        const pageToUpdate = workflow.content.pages.find(
                            (p) => p.pageId === page.pageId
                        );
                        if (pageToUpdate) {
                            pageToUpdate.status = "done";
                            await writeWorkflow(projectId, version, workflow);
                        }
                    }
                }
            } catch (error) {
                console.error(`生成页面 ${page.pageId} 失败:`, error);
                errorQueue.push({ page, error });

                // 更新页面状态为错误
                if (workflow) {
                    const pageToUpdate = workflow.content.pages.find(
                        (p) => p.pageId === page.pageId
                    );
                    if (pageToUpdate) {
                        pageToUpdate.status = "error";
                        await writeWorkflow(projectId, version, workflow);
                    }
                }
            }
        });

        // 等待所有页面生成完成
        await Promise.allSettled(generatePromises);

        // 处理错误队列
        if (errorQueue.length > 0) {
            console.log(`开始重新处理 ${errorQueue.length} 个失败的页面`);
            for (const { page, error } of errorQueue) {
                try {
                    // 重新生成页面代码的逻辑可以在这里实现
                    console.log(`重新处理页面 ${page.pageId}`);
                    // 这里可以添加重试逻辑
                } catch (retryError) {
                    console.error(`重试生成页面 ${page.pageId} 失败:`, retryError);
                }
            }
        }
    } catch (error) {
        console.error("生成代码失败:", error);
    }
}

// 处理 /v1/regenerate-code 路由
async function handleRegenerateCode(req, res, data) {
    const { pages, projectId, model = "qwen-coder" } = data;
    activeProjectId = projectId;
    const version = await getProjectVersion(projectId);
    const versionPath = path.join(projectDir, projectId, version);

    // 读取当前 workflow
    let workflow = await readWorkflow(projectId, version);

    // 更新 workflow.json
    if (workflow) {
        pages.forEach(async (page) => {
            const pageToUpdate = workflow.content.pages.find(
                (p) => p.pageId === page.pageId
            );
            if (pageToUpdate) {
                pageToUpdate.status = "generating";
                await writeWorkflow(projectId, version, workflow);
            }
        });
    }

    // 立即返回响应
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
        JSON.stringify(
            utilsService.returnData({
                status: "success",
                message: "接口调用成功",
            })
        )
    );

    // 异步处理
    try {
        const globalCompPrompt = await getGlobalComp(projectId);

        // 生成页面代码的错误队列
        const errorQueue = [];

        // 并行重新生成页面代码
        const regeneratePromises = pages.map(async (page) => {
            try {
                // 构建提示词
                const basePrompt = `
                    页面名称：${page.name}
                    页面描述：${page.description}
                    页面导航：${JSON.stringify(page.navigationList)}
                    任务描述：基于我输入的页面描述、页面导航、设备类型等信息帮我进行页面设计和开发工作
                `;

                let systemPrompt = SYSTEM_PROMPT;
                systemPrompt = systemPrompt.replace(
                    "{globalComponents}",
                    globalCompPrompt
                );
                systemPrompt = systemPrompt.replace("{stype}", "");

                const messages = [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: basePrompt },
                ];

                // 调用模型重新生成代码
                const modelResponse = await llmService.chatCompletion(messages, model);

                if (
                    modelResponse &&
                    modelResponse.choices &&
                    modelResponse.choices.length > 0
                ) {
                    const vueCode = await utilsService.extractVueTemplates(
                        modelResponse.choices[0].message.content
                    );

                    // 保存重新生成的代码
                    const codePath = path.join(versionPath, "code", `${page.pageId}.vue`);
                    await fs.promises.writeFile(codePath, vueCode);

                    // 复制到 dynamic 目录
                    const dynamicPath = path.join(dynamicDir, `${page.pageId}.vue`);
                    await fs.promises.writeFile(dynamicPath, vueCode);

                    // 更新页面状态
                    if (workflow) {
                        const pageToUpdate = workflow.content.pages.find(
                            (p) => p.pageId === page.pageId
                        );
                        if (pageToUpdate) {
                            pageToUpdate.status = "done";
                            await writeWorkflow(projectId, version, workflow);
                        }
                    }
                }
            } catch (error) {
                console.error(`重新生成页面 ${page.pageId} 失败:`, error);
                errorQueue.push({ page, error });

                // 更新页面状态为错误
                if (workflow) {
                    const pageToUpdate = workflow.content.pages.find(
                        (p) => p.pageId === page.pageId
                    );
                    if (pageToUpdate) {
                        pageToUpdate.status = "error";
                        await writeWorkflow(projectId, version, workflow);
                    }
                }
            }
        });

        // 等待所有页面重新生成完成
        await Promise.allSettled(regeneratePromises);

        // 处理错误队列
        if (errorQueue.length > 0) {
            console.log(`开始重新处理 ${errorQueue.length} 个失败的页面`);
            for (const { page, error } of errorQueue) {
                try {
                    console.log(`重新处理页面 ${page.pageId}`);
                    // 这里可以添加重试逻辑
                } catch (retryError) {
                    console.error(`重试重新生成页面 ${page.pageId} 失败:`, retryError);
                }
            }
        }
    } catch (error) {
        console.error("重新生成代码失败:", error);
    }
}

// 处理 /v1/generate-recode 路由
async function handleGenerateRecode(req, res, data) {
    const {
        projectId,
        pageId,
        name,
        description,
        status = "generating",
        navigationList,
        target = "web",
        resolution = "1920 * 1080",
        model = "qwen-coder",
    } = data;

    activeProjectId = projectId;

    // 立即返回响应
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
        JSON.stringify(
            utilsService.returnData({
                status: "success",
                message: "接口调用成功",
            })
        )
    );

    // 异步处理
    try {
        const version = await getProjectVersion(projectId);
        const versionPath = path.join(projectDir, projectId, version);

        // 更新 workflow 中的页面状态
        let workflow = await readWorkflow(projectId, version);
        if (workflow) {
            const pageToUpdate = workflow.content.pages.find(
                (p) => p.pageId === pageId
            );
            if (pageToUpdate) {
                pageToUpdate.status = status;
                await writeWorkflow(projectId, version, workflow);
            }
        }

        const globalCompPrompt = await getGlobalComp(projectId);

        // 构建页面对象
        const page = {
            pageId,
            name,
            description,
            status,
            navigationList,
        };

        // 构建提示词
        const basePrompt = `
            页面名称：${page.name}
            页面描述：${page.description}
            页面导航：${JSON.stringify(page.navigationList)}
            任务描述：基于我输入的页面描述、页面导航、设备类型等信息帮我进行页面设计和开发工作
        `;

        let systemPrompt = SYSTEM_PROMPT;
        systemPrompt = systemPrompt.replace("{globalComponents}", globalCompPrompt);
        systemPrompt = systemPrompt.replace("{stype}", "");

        const messages = [
            { role: "system", content: systemPrompt },
            { role: "user", content: basePrompt },
        ];

        // 调用模型生成代码
        const modelResponse = await llmService.chatCompletion(messages, model);

        if (
            modelResponse &&
            modelResponse.choices &&
            modelResponse.choices.length > 0
        ) {
            const vueCode = await utilsService.extractVueTemplates(
                modelResponse.choices[0].message.content
            );

            // 保存生成的代码
            const codePath = path.join(versionPath, "code", `${page.pageId}.vue`);
            await fs.promises.writeFile(codePath, vueCode);

            // 复制到 dynamic 目录
            const dynamicPath = path.join(dynamicDir, `${page.pageId}.vue`);
            await fs.promises.writeFile(dynamicPath, vueCode);

            // 更新 workflow 中的页面状态
            let workflow = await readWorkflow(projectId, version);
            if (workflow) {
                const pageToUpdate = workflow.content.pages.find(
                    (p) => p.pageId === page.pageId
                );
                if (pageToUpdate) {
                    pageToUpdate.status = "done";
                    await writeWorkflow(projectId, version, workflow);
                }
            }
        }
    } catch (error) {
        console.error(`重新生成页面 ${pageId} 失败:`, error);

        // 更新页面状态为错误
        try {
            const version = await getProjectVersion(projectId);
            let workflow = await readWorkflow(projectId, version);
            if (workflow) {
                const pageToUpdate = workflow.content.pages.find(
                    (p) => p.pageId === pageId
                );
                if (pageToUpdate) {
                    pageToUpdate.status = "error";
                    await writeWorkflow(projectId, version, workflow);
                }
            }
        } catch (updateError) {
            console.error("更新页面状态失败:", updateError);
        }
    }
}

// 处理 /v1/update-workflow 路由
async function handleUpdateWorkflow(req, res, data) {
    const { pages, projectId, workflows } = data;
    res.writeHead(200, { "Content-Type": "application/json" });

    // 异步处理
    try {
        const version = await getProjectVersion(projectId);

        const projectMapPath = path.join(projectDir, "project-map.json");
        let projectMap = {};

        if (
            await fs.promises
                .access(projectMapPath)
                .then(() => true)
                .catch(() => false)
        ) {
            const content = await fs.promises.readFile(projectMapPath, "utf8");
            projectMap = JSON.parse(content);
        }

        // 读取并更新 workflow
        let workflow = await readWorkflow(projectId, version);
        if (workflow) {
            workflow.content.pages = pages;
            workflow.content.workflows = workflows;
            await writeWorkflow(projectId, version, workflow);
            await syncProjectMapToWorkflow(projectId);

            res.end(
                JSON.stringify(
                    utilsService.returnData({
                        status: "success",
                        message: "接口调用成功",
                    })
                )
            );
        }
    } catch (error) {
        console.error("更新工作流失败:", error);
        res.end(
            JSON.stringify(
                utilsService.returnData({}, {
                    message: error.message || "文件写入失败，请重新写入",
                    errorCode: 5000,
                    error,
                })
            )
        );
    }
}

// 处理 /platform/project/design/workflow/detail 路由
async function handleWorkflowDetail(req, res, data) {
    const { projectId } = data;

    try {
        const version = await getProjectVersion(projectId);
        const workflow = await readWorkflow(projectId, version);
        console.log("wofk", workflow);
        if (workflow) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(
                JSON.stringify(
                    utilsService.returnData({
                        status: "success",
                        content: workflow.content,
                        ...workflow,
                        message: "接口调用成功",
                    })
                )
            );
        } else {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(
                JSON.stringify(
                    utilsService.returnData({
                        status: "success",
                        content: {
                            projectName: "",
                            description: "",
                            pages: [],
                            workflows: [],
                            status: "generating",
                            error: null,
                            errorMessage: "",
                        },
                        message: "接口调用成功",
                    })
                )
            );
        }
    } catch (error) {
        console.error("获取工作流详情失败:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
            JSON.stringify(
                utilsService.returnData({
                    errorCode: ErrorCodes.INTERNAL_SERVER_ERROR,
                    errorMessage: "获取工作流详情失败",
                })
            )
        );
    }
}

async function uploadLocalImg(data) {
    const { projectId, pageId: pageName, imgUrl: base64Data } = data;

    // 获取操作系统特定存储路径
    let assetsDir = path.join(homeDir, "assets", projectId, "1");
    const filePath = path.join(assetsDir, pageName + ".png");
    await writeFileImg(filePath, base64Data);
}

async function writeFileImg(dir, data) {
    if (!data.includes(";base64,")) {
        throw new Error("Invalid base64 image format");
    }
    const base64String = data.split(";base64,").pop();
    const buffer = Buffer.from(base64String, "base64");
    const filePath = path.join(dir);
    await fs.promises.writeFile(filePath, buffer);
}

// 处理 /platform/project/upload/pages/img 路由
async function handleUploadPagesImg(req, res, data) {
    const { projectId, pageId: pageName, imgUrl: base64Data } = data;

    try {
        const version = await getProjectVersion(projectId);
        const versionPath = path.join(projectDir, projectId, version);
        const coverDir = path.join(versionPath, "cover");

        const projectAssetsDir = path.join(assetsDir, projectId, version);
        await fs.promises.mkdir(projectAssetsDir, { recursive: true });

        await uploadLocalImg(data);

        // 确保目录存在
        await fs.promises.mkdir(coverDir, { recursive: true });

        // 解码并保存图片
        const imagePath = path.join(coverDir, `${pageName}.png`);
        await writeFileImg(imagePath, base64Data);

        await uploadLocalImg(data);

        // 更新 workflow 中的图片URL
        let workflow = await readWorkflow(projectId, version);
        let projectImgUrl = "";
        if (workflow) {
            // 更新指定页面的imgUrl
            for (const page of workflow.content.pages) {
                if (page.pageId === pageName) {
                    page.imgUrl = `/assets/${projectId}/${version}/${pageName}.png`;
                    projectImgUrl = page.imgUrl;
                    break;
                }
            }

            // 更新第一个页面的imgUrl
            if (
                workflow.content.pages &&
                workflow.content.pages.length > 0 &&
                workflow.content.pages[0].imgUrl
            ) {
                workflow.content.imgUrl = workflow.content.pages[0].imgUrl;
            }

            await writeWorkflow(projectId, version, workflow);
        }

        const projectMapPath = path.join(projectDir, "project-map.json");
        let projectMap = {};

        if (
            await fs.promises
                .access(projectMapPath)
                .then(() => true)
                .catch(() => false)
        ) {
            const content = await fs.promises.readFile(projectMapPath, "utf8");
            projectMap = JSON.parse(content);
        }

        const currentProjectInfo = projectMap[projectId];
        if (!currentProjectInfo.imgUrl) {
            await updateProjectMap(projectId, {
                imgUrl: projectImgUrl,
            });
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
            JSON.stringify(
                utilsService.returnData({
                    status: "success",
                    message: "接口调用成功",
                })
            )
        );
    } catch (error) {
        console.error("上传图片失败:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
            JSON.stringify(
                utilsService.returnData({
                    errorCode: ErrorCodes.FILE_IO_ERROR,
                    errorMessage: "上传图片失败",
                })
            )
        );
    }
}

function generateCategoryList(workflows) {
    const globalVisited = new Set(); // 全局记录已出现的 pageId
    const result = workflows
        .map((workflow) => {
            const currentFlowPages = [];
            const localVisited = new Set(); // 当前流程内的去重

            // 递归遍历 workflowTree
            function traverse(node) {
                const isNewGlobally = !globalVisited.has(node.pageId);
                const isNewLocally = !localVisited.has(node.pageId);

                if (isNewGlobally && isNewLocally) {
                    currentFlowPages.push({
                        pageId: node.pageId,
                        navigationId: node.navigationId || "",
                        position: node.position || {},
                    });
                    globalVisited.add(node.pageId);
                    localVisited.add(node.pageId);
                }

                if (node.children) {
                    node.children.forEach((child) => traverse(child));
                }
            }

            traverse(workflow.workflowTree);
            return { title: workflow.name, list: currentFlowPages };
        })
        .filter((flow) => flow.list.length > 0); // 只保留有页面的流程

    return result;
}

function enhanceCategoryListWithPageData(categoryList, contentData) {
    return categoryList.map((flow) => {
        const enhancedList = flow.list.map((page) => {
            // 在 pages 数组中查找匹配的页面数据
            const fullPageData = contentData.pages.find(
                (p) => p.pageId === page.pageId
            );

            // 合并 page 的基础数据 (pageId, navigationId, position) 和 pages 里的完整数据
            return {
                ...page, // 原始数据 (pageId, navigationId, position)
                ...fullPageData, // 覆盖/扩展所有 pages 中的属性
            };
        });

        return {
            title: flow.title,
            list: enhancedList,
        };
    });
}

// 处理 /platform/project/design/pages 路由
async function handleDesignPages(req, res, data) {
    const { projectId } = data;
    activeProjectId = projectId;
    try {
        const version = await getProjectVersion(projectId);
        const workflow = await readWorkflow(projectId, version);
        if (workflow && workflow.content && workflow.content.pages) {
            res.writeHead(200, { "Content-Type": "application/json" });

            // 前置判断，去到本地副本里projectId,

            const categoryList = await generateCategoryList(
                workflow.content.workflows
            );
            const finalCateList = await enhanceCategoryListWithPageData(
                categoryList,
                workflow.content
            );

            const projectMapPath = path.join(projectDir, "project-map.json");
            let projectMap = {};

            if (await fs.existsSync(projectMapPath)) {
                const content = await fs.promises.readFile(projectMapPath, "utf8");
                projectMap = JSON.parse(content);
            }


            res.end(
                JSON.stringify(
                    utilsService.returnData({
                        status: "success",
                        list: workflow.content.pages,
                        workflows: workflow.content.workflows,
                        categoryList: finalCateList,
                        ...projectMap,
                        message: "接口调用成功",
                    })
                )
            );
        } else {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(
                JSON.stringify(
                    utilsService.returnData({
                        ...projectMap,
                        categoryList: [],
                        list: [],
                        workflows: [],
                        status: 'error'
                    }, {
                        errorCode: ErrorCodes.NOT_FOUND,
                        errorMessage: "页面未找到",
                    })
                )
            );
        }
    } catch (error) {
        console.error("获取页面列表失败:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
            JSON.stringify(
                utilsService.returnData({
                    ...projectMap,
                    categoryList: [],
                    list: [],
                    workflows: [],
                    status: 'error'
                }, {
                    errorCode: ErrorCodes.INTERNAL_SERVER_ERROR,
                    errorMessage: "获取页面列表失败",
                })
            )
        );
    }
}

// 处理 /platform/project 路由
async function handlePlatformProject(req, res, data) {
    const { keyword, page = 1, sort, pageSize = 10 } = data;
    console.log("-------------", data);
    await initGlobalPaths();
    await initGlobalPrompts();
    try {
        const projectMapPath = path.join(projectDir, "project-map.json");
        let projectMap = {};

        if (
            await fs.promises
                .access(projectMapPath)
                .then(() => true)
                .catch(() => false)
        ) {
            const content = await fs.promises.readFile(projectMapPath, "utf8");
            projectMap = JSON.parse(content);
        }

        // 为每个项目获取第一个页面的imgUrl
        let projects = await Promise.all(
            Object.entries(projectMap).map(async ([id, info]) => {
                try {
                    const version = await getProjectVersion(id);
                    const workflow = await readWorkflow(id, version);
                    let imgUrl = null;
                    // 如果有pages且第一个page有imgUrl,则使用它
                    if (
                        workflow &&
                        workflow.content &&
                        workflow.content.pages &&
                        workflow.content.pages.length > 0 &&
                        workflow.content.pages[0].imgUrl
                    ) {
                        imgUrl = workflow.content.pages[0].imgUrl;
                    }
                    return {
                        projectId: id,
                        ...info,
                        // imgUrl,
                    };
                } catch (error) {
                    console.error(`获取项目 ${id} 信息失败:`, error);
                    return {
                        projectId: id,
                        ...info,
                        // imgUrl: null,
                    };
                }
            })
        );

        if (keyword) {
            projects = projects.filter((p) => p.projectName?.includes(keyword));
        }

        if (sort === 'createTime') {
            // 按时间降序排序
            projects.sort((a, b) => {
                const timeA = a.createAt || a.projectId;
                const timeB = b.createAt || b.projectId;
                return new Date(timeB) - new Date(timeA);
            });
        }
        if (sort === 'projectName') {
            projects.sort((a, b) => {
                return a.projectName?.localeCompare(b.projectName);
            })
        }


        const start = (page - 1) * pageSize;
        const respData = projects.slice(start, start + pageSize);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
            JSON.stringify(
                utilsService.returnData({
                    list: respData,
                    total: projects.length,
                    message: "Platform project processed",
                })
            )
        );
    } catch (error) {
        console.error("处理项目列表失败:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
            JSON.stringify(
                utilsService.returnData({
                    errorCode: ErrorCodes.INTERNAL_SERVER_ERROR,
                    errorMessage: "处理项目列表失败",
                })
            )
        );
    }
}

// 将副本数据copy到模板工程实时性
async function copyAndReplaceTemplate(projectId) {
    const version = await getProjectVersion(projectId);
    const currentDir = path.join(projectDir, projectId, version);
    const sourceCodeDir = path.join(currentDir, "code");
    const sourceComponentDir = path.join(currentDir, "components");

    await utilsService.copyDirectory(sourceCodeDir, dynamicDir);
    await utilsService.copyDirectory(sourceComponentDir, componentDir);
}

async function getFileNamesWithoutExtension(codeDir) {
    try {
        // 读取目录下的所有文件和子目录
        const files = fs.readdirSync(codeDir);

        // 过滤出文件（排除目录），并移除文件后缀
        const fileNames = files
            .filter(file => {
                const filePath = path.join(codeDir, file);
                return fs.statSync(filePath).isFile();
            })
            .map(file => path.parse(file).name);

        return fileNames;
    } catch (err) {
        console.error('读取文件列表时出错:', err);
        return [];  // 或者返回空数组 return []; 根据业务需求决定
    }
}


/**
 * 同步页面状态与文件列表
 * @param {Object} content - 项目内容对象
 * @param {Array<string>} fileNames - 代码目录中的文件名列表（不带扩展名）
 * @returns {Object} 更新后的内容对象
 */
function syncPageStatusWithFiles(content, fileNames) {
    // 遍历所有页面
    const updatedPages = content.pages.map(page => {
        // 检查当前页面ID是否存在于文件列表中
        const pageFileExists = fileNames.includes(page.pageId);

        // 如果文件不存在，且当前状态不是pending，则更新为pending
        if (!pageFileExists && page.status !== 'pending') {
            return {
                ...page,
                status: 'pending'
            };
        }

        // 其他情况保持不变
        return page;
    });

    // 返回更新后的内容对象
    return {
        ...content,
        pages: updatedPages
    };
}

async function verifyWorkflowPagesStatus(projectId) {
    const version = await getProjectVersion(projectId);
    const currentDir = path.join(projectDir, projectId, version);
    const codeDir = path.join(currentDir, "code");
    const fileNames = await getFileNamesWithoutExtension(codeDir);

    // 更新 workflow.json
    let workflow = await readWorkflow(projectId, version);
    if (workflow) {
        workflow.content = syncPageStatusWithFiles(workflow.content, fileNames)
        await writeWorkflow(projectId, version, workflow);
    }
}


// 处理 /platform/initial 路由
async function handleInitial(req, res, data) {
    // 初始化操作
    res.writeHead(200, { "Content-Type": "application/json" });
    const { projectId } = data;
    activeProjectId = projectId;
    res.end(
        JSON.stringify(
            utilsService.returnData({
                status: "success",
                message: "初始化完成",
            })
        )
    );
    await resetRoutes(clientRoutePath);
    const version = await getProjectVersion(projectId);
    let workflow = await readWorkflow(projectId, version);
    await copyAndReplaceTemplate(projectId);
    if (workflow && workflow.content.pages) {
        await insertClientAllRoutes(workflow.content.pages)
    }
}

// 处理 /platform/project/page/error 路由
async function handlePageError(req, res, data) {
    console.log("Page error report:", data);
    const { projectId, pageId, type, message, model = "qwen-coder" } = data;

    const version = await getProjectVersion(projectId);
    let workflow = await readWorkflow(projectId, version);
    if (workflow) {
        const pageToUpdate = workflow.content.pages.find(
            (p) => p.pageId === pageId
        );
        if (pageToUpdate) {
            pageToUpdate.status = "error";
            await writeWorkflow(projectId, version, workflow);
        }
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
        JSON.stringify(
            utilsService.returnData({
                status: "success",
                message: `接口调用成功`,
                backupPath,
            })
        )
    );

    try {
        // 1. 获取项目目录和最新版本
        const codeDir = path.join(projectDir, "1", "code");

        // 2. 读取页面文件内容
        const fileName = `${pageId}.vue`;
        const filePath = path.join(codeDir, fileName);
        if (!(await fs.pathExists(filePath))) {
            throw new Error(`Page file ${fileName} not found`);
        }
        const fileContent = await fs.readFile(filePath, "utf-8");

        // 3. 准备LLM提示信息
        const messages = [
            {
                role: "system",
                content: `修复Vue组件中的${type}错误: ${message}\n请返回完整的修复后Vue组件代码，使用vue代码块格式`,
            },
            {
                role: "user",
                content: `这是当前有问题的Vue组件代码:\n${fileContent}`,
            },
        ];

        // 4. 调用LLM生成修复代码
        const response = await llmService.chatCompletion(messages, model);
        let componentContent = response.choices[0].message.content;
        const vueCode = await utilsService.extractVueTemplates(componentContent);

        // 5. 备份原文件
        const backupPath = path.join(codeDir, `${pageId}_backup_${Date.now()}.vue`);
        await fs.copyFile(filePath, backupPath);

        // 6. 写入修复后的代码
        await fs.writeFile(filePath, vueCode);

        // 7. 替换到client目录
        await utilsService.copyFileWithReplace(
            filePath,
            path.join(dynamicDir, fileName)
        );
    } catch (error) {
        console.error(`Failed to fix ${type} for page ${pageId}`, error);
        // res.writeHead(500, { "Content-Type": "application/json" });
        // res.end(
        //     JSON.stringify(
        //         utilsService.returnData(
        //             {
        //                 error,
        //             },
        //             {
        //                 errorCode: 500,
        //                 errorMessage: error.message || `Failed to fix ${type}`
        //             }
        //         )
        //     )
        // );
    }
}

// 处理 /platform/project/delete 路由
async function handleDeleteProject(req, res, data) {
    const { projectId } = data;

    try {
        const projectPath = path.join(projectDir, projectId);
        if (
            await fs.promises
                .access(projectPath)
                .then(() => true)
                .catch(() => false)
        ) {
            await fs.promises.rm(projectPath, { recursive: true, force: true });
        }

        // 更新 project-map.json
        const projectMapPath = path.join(projectDir, "project-map.json");
        if (
            await fs.promises
                .access(projectMapPath)
                .then(() => true)
                .catch(() => false)
        ) {
            const content = await fs.promises.readFile(projectMapPath, "utf8");
            const projectMap = JSON.parse(content);
            delete projectMap[projectId];
            await fs.promises.writeFile(
                projectMapPath,
                JSON.stringify(projectMap, null, 2)
            );
        }

        // 删掉assetsDir 对应的 projectId 文件夹
        const assetsProjectPath = path.join(assetsDir, projectId);
        if (
            await fs.promises
                .access(assetsProjectPath)
                .then(() => true)
                .catch(() => false)
        ) {
            await fs.promises.rm(assetsProjectPath, { recursive: true, force: true });
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
            JSON.stringify(
                utilsService.returnData({
                    status: "success",
                    message: "项目删除成功",
                })
            )
        );
    } catch (error) {
        console.error("删除项目失败:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
            JSON.stringify(
                utilsService.returnData({
                    errorCode: ErrorCodes.INTERNAL_SERVER_ERROR,
                    errorMessage: "删除项目失败",
                })
            )
        );
    }
}

// 处理 /platform/project/rename 路由
async function handleRenameProject(req, res, data) {
    const { projectId, projectName } = data;

    try {
        // 更新 project-map.json

        const projectMapPath = path.join(projectDir, "project-map.json");
        let projectMap = {};

        if (await fs.existsSync(projectMapPath)) {
            const content = await fs.promises.readFile(projectMapPath, "utf8");
            projectMap = JSON.parse(content);
        }

        if (projectId) {
            projectMap[projectId] = projectMap[projectId] || {};
            projectMap[projectId].projectName = projectName;
            await fs.promises.writeFile(
                projectMapPath,
                JSON.stringify(projectMap, null, 2)
            );
        }

        // 给workflow projectName
        let workflow = await readWorkflow(projectId, "1");
        workflow.content.projectName = projectName;
        workflow.projectName = projectName;
        await writeWorkflow(projectId, "1", workflow);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
            JSON.stringify(
                utilsService.returnData({
                    status: "success",
                    message: "项目重命名完成",
                })
            )
        );
    } catch (error) {
        console.error("重命名项目失败:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
            JSON.stringify(
                utilsService.returnData({
                    errorCode: ErrorCodes.INTERNAL_SERVER_ERROR,
                    errorMessage: "重命名项目失败",
                })
            )
        );
    }
}

// 处理 /platform/project/duplicate 路由
async function handleDuplicateProject(req, res, data) {
    const { projectId } = data;

    try {
        const projectMapPath = path.join(projectDir, "project-map.json");
        let projectMap = {};
        if (
            await fs.promises
                .access(projectMapPath)
                .then(() => true)
                .catch(() => false)
        ) {
            const content = await fs.promises.readFile(projectMapPath, "utf8");
            projectMap = JSON.parse(content);
        }
        const copyProjectId = `${projectId}_copy_${Date.now()}`; // 确保唯一ID
        const dupProjectInfo = projectMap[projectId];

        // 更新项目信息
        const newProjectInfo = {
            ...dupProjectInfo,
            createAt: new Date().toISOString(),
            projectName: `${dupProjectInfo.projectName}_副本`,
            copy: true,
            projectId: copyProjectId,
            path: path.join(projectDir, copyProjectId),
        };
        console.log("newProjectInfo---", newProjectInfo);
        if (newProjectInfo.imgUrl) {
            const parts = newProjectInfo.imgUrl.split("/");
            parts[2] = copyProjectId; // 替换URL中的项目ID
            newProjectInfo.imgUrl = parts.join("/");
        }

        await updateProjectMap(copyProjectId, newProjectInfo);
        // 源目录和目录目录使用完整路径
        const srcDir = path.join(projectDir, projectId);
        const targetDir = path.join(projectDir, copyProjectId);

        const srcAssetsDir = path.join(assetsDir, projectId);
        const targetAssetsDir = path.join(assetsDir, copyProjectId);

        // 确保源目录存在
        if (
            !(await fs.promises
                .access(srcDir)
                .then(() => true)
                .catch(() => false))
        ) {
            throw new Error(`源目录 ${srcDir} 不存在`);
        }

        console.log(`开始复制项目 ${projectId} 到 ${copyProjectId}`);
        try {
            await utilsService.copyDirectoryWithDuplicate(srcDir, targetDir);
            await utilsService.copyDirectoryWithDuplicate(
                srcAssetsDir,
                targetAssetsDir
            );
            console.log(`项目复制完成: ${srcDir} -> ${targetDir}`);

            // 验证复制结果
            const copiedFiles = await fs.promises.readdir(targetDir);
            if (copiedFiles.length === 0) {
                throw new Error("复制失败，目标目录为空");
            }
            await syncProjectMapToWorkflow(copyProjectId);
        } catch (err) {
            console.error("复制项目失败:", err);
            // 清理可能部分复制的目录
            await fs.promises
                .rm(targetDir, { recursive: true, force: true })
                .catch((e) => console.error("清理目标目录失败:", e));
            throw err;
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
            JSON.stringify(
                utilsService.returnData({
                    success: true,
                    message: "Project duplicated successfully",
                })
            )
        );
    } catch (error) {
        console.error(`Failed to duplicate project ${projectId}`, error);
        throw new Error(error.message + ":" + 500);
    }
}

function zipDirectory(sourceDir, outputPath, options = {}) {
    return new Promise((resolve, reject) => {
        try {
            const output = fs.createWriteStream(outputPath);
            const archive = archiver("zip", { zlib: { level: 9 } });

            output.on("close", () => {
                console.log(`ZIP created: ${outputPath}, ${archive.pointer()} bytes`);
                resolve(outputPath);
            });
            archive.on("error", (err) => reject(err));

            archive.pipe(output);

            // 处理排除/包含规则
            const globOptions = {
                cwd: sourceDir,
                dot: true,
                nodir: true,
                ignore: options.ignore || [],
                onlyFiles: true,
            };

            if (options.include) {
                archive.glob(options.include, globOptions);
            } else {
                // 默认包含所有文件，除了ignore指定的
                archive.glob("**/*", {
                    ...globOptions,
                    ignore: [
                        ...(options.ignore || []),
                        "**/node_modules/**",
                        "**/.git/**",
                        "**/.vscode/**",
                        "**/dist/**",
                    ],
                });
            }

            archive.finalize();
        } catch (err) {
            reject(err);
        }
    });
}

// 处理 /platform/project/export 路由
async function handleExportProject(req, res, data) {
    const { projectId, type = "html" } = data;

    try {
        // 创建临时目录存储zip文件
        const tempDir = path.join(clientDir, "temp");
        await fsExtra.ensureDir(tempDir);
        const zipPath = path.join(tempDir, `export_${projectId}_${Date.now()}.zip`);

        if (type === "html") {
            // 导出HTML包：构建后压缩dist目录
            await new Promise((resolve, reject) => {
                exec("npm run build", { cwd: clientDir }, (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            });
            await zipDirectory(path.join(clientDir, "dist"), zipPath);
        } else if (type === "web") {
            // 导出Web工程：排除node_modules后压缩整个client目录
            await zipDirectory(clientDir, zipPath, {
                ignore: [
                    "**/node_modules/**",
                    "**/.git/**",
                    "**/dist/**",
                    "**/.vscode/**",
                    "**/*.log",
                    "**/temp/**",
                    "**/logs/**",
                    "**/.DS_Store",
                ],
            });
        }

        // 设置下载头
        res.setHeader("Content-Type", "application/zip");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=${path.basename(zipPath)}`
        );

        // 流式传输zip文件
        const fileStream = fs.createReadStream(zipPath);
        fileStream.pipe(res);

        // 传输完成后删除临时文件
        fileStream.on("close", () => fsExtra.remove(zipPath).catch(console.error));

        res.status(200).json(utilsService.returnData({ status: 'success', message: '项目导出成功' }));
    } catch (error) {
        console.error("Export project failed:", error);
        res.status(500).json(utilsService.returnData({}, {
            errorMessage: error.message,
            errorCode: ErrorCodes.FILE_IO_ERROR,
            error,
        }));
    }
}

// 同步 projectMap 数据到 workflow
async function syncProjectMapToWorkflow(projectId) {
    try {
        // 1. 读取 project-map.json
        const projectMapPath = path.join(projectDir, "project-map.json");
        let projectMap = {};
        if (
            await fs.promises
                .access(projectMapPath)
                .then(() => true)
                .catch(() => false)
        ) {
            const content = await fs.promises.readFile(projectMapPath, "utf8");
            projectMap = JSON.parse(content);
        }

        // 2. 获取项目信息
        const projectInfo = projectMap[projectId];
        if (!projectInfo) {
            throw new Error("项目不存在");
        }

        // 3. 读取 workflow 数据
        const version = await getProjectVersion(projectId);
        let workflow = await readWorkflow(projectId, version);

        if (workflow) {
            console.log("workflow-----", workflow.content);
            // 4. 将 projectMap 中的数据同步到 workflow
            Object.keys(projectInfo).forEach((key) => {
                workflow[key] = projectInfo[key];
            });
            const projectName = projectInfo.projectName
                ? projectInfo.projectName
                : workflow.content.projectName;
            workflow.content.projectName = projectName;
            // 5. 保存更新后的 workflow
            await writeWorkflow(projectId, version, workflow);

            return workflow;
        }

        return null;
    } catch (error) {
        console.error("同步 projectMap 到 workflow 失败:", error);
        throw error;
    }
}

// 处理同步 projectMap 到 workflow 的路由
async function handleSyncProjectToWorkflow(req, res, data) {
    const { projectId } = data;

    try {
        const workflow = await syncProjectMapToWorkflow(projectId);

        if (workflow) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(
                JSON.stringify(
                    utilsService.returnData({
                        status: "success",
                        workflow: workflow,
                        message: "数据同步完成",
                    })
                )
            );
        } else {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(
                JSON.stringify(
                    utilsService.returnData({
                        errorCode: ErrorCodes.NOT_FOUND,
                        errorMessage: "项目或工作流未找到",
                    })
                )
            );
        }
    } catch (error) {
        console.error("数据同步失败:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
            JSON.stringify(
                utilsService.returnData({
                    errorCode: ErrorCodes.INTERNAL_SERVER_ERROR,
                    errorMessage: "数据同步失败: " + error.message,
                })
            )
        );
    }
}

/**
 * 处理公共组件生成
 */
export async function processGlobalCompGeneration(
    pages = [],
    projectId = "",
    model = "qwen-coder"
) {
    //导航组件
    await processGlobalNavCompGeneration(pages, projectId, model);
    //其他组件...
}

export async function processGlobalNavCompGeneration(
    pages = [],
    projectId = "",
    model
) {
    const globalNavigationCompPath = path.join(
        projectDir,
        projectId,
        "1",
        "components",
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
    try {
        const messages = [{ role: "user", content: prompt }];
        const response = await llmService.chatCompletion(messages, model);
        let componentCode = JSON.parse(response.choices[0].message.content).content;

        await fs.writeFileSync(globalNavigationCompPath, componentCode);

        const targetNavigationCompPath = path.join(
            componentDir,
            "GlobalNavigation.vue"
        );

        await utilsService.copyFileWithReplace(
            globalNavigationCompPath,
            targetNavigationCompPath
        );

        return {
            status: "success",
            message: "全局导航组件生成成功",
            data: componentCode,
        };
    } catch (error) {
        console.error("生成全局导航组件失败:", error);
    }
}

export async function getGlobalComp(projectId) {
    let compArrayStr = "";
    //导航组件
    let globalNav = await getGlobalNavigationComp(projectId);
    compArrayStr += globalNav;
    //其他组件...
    console.log("公共组件:" + compArrayStr);
    return compArrayStr;
}

export async function getGlobalNavigationComp(projectId) {
    try {
        const globalNavigationCompPath = path.join(
            projectDir,
            projectId,
            "1",
            "components",
            "GlobalNavigation.vue"
        );
        const globalNavigationCompCode = fs.readFileSync(
            globalNavigationCompPath,
            "utf-8"
        );
        return `
        ## 导航组件
        ### 组件源码
        ${globalNavigationCompCode}
        `;
    } catch (error) {
        return "";
    }
}

async function handleShareProject(req, res, data) {
    const { projectId } = data;
    // 1. 打包  2. 上传ng
    const serverConfig = {
        ip: '158.1.10.98',
        user: 'root',
        password: 'Hzbank@2025',
        port: '22',
        uploadDir: '/home/nginx/web'
    };

    try {
        // 1. 打包
        const tempDir = path.join(clientDir, "temp");
        await fsExtra.ensureDir(tempDir);
        const zipPath = path.join(tempDir, `hzUx.zip`);
        await new Promise((resolve, reject) => {
            exec("npm run build", { cwd: clientDir }, (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
        await zipDirectory(path.join(clientDir, "dist"), zipPath);

        // 2. 上传到指定服务器
        // 使用SSH连接并上传文件
        console.log('开始上传项目文件...');
        execSync(
            `sshpass -p '${serverConfig.password}' scp -P ${serverConfig.port} ${zipPath}/hzUx.tar.gz ${serverConfig.user}@${serverConfig.ip}:${serverConfig.uploadDir}`
        );

        // 在远程服务器解压文件
        console.log('上传完成，正在远程服务器解压...');
        execSync(
            `sshpass -p '${serverConfig.password}' ssh -p ${serverConfig.port} ${serverConfig.user}@${serverConfig.ip} "cd ${serverConfig.uploadDir} && tar -zxf hzUx.tar.gz"`
        );

        console.log('项目部署完成');
        res.status(200)
        res.end(
            JSON.stringify(
                utilsService.returnData({
                    url: 'http://158.1.10.98/hzUx/index.html',
                    status: 'success',
                    message: '项目分享成功'
                })
            )
        );
    } catch (error) {
        console.error('项目分享失败:', error);
        res.status(500)
        res.end(
            JSON.stringify(
                utilsService.returnData({}, {
                    errorCode: 5000,
                    status: 'error',
                    errorMessage: '项目分享失败',
                    error: error
                })
            )
        );
    }
}

function handleSSE(req, res, data) {
    const clientId = `client_${Date.now()}`
    sseManager.addClient(clientId, res)
}

let server = null;
export const bootstrapHzuxServer = () => {
    // 启动服务器函数
    function startServer(port, attempts = 3) {
        server = http.createServer(async (req, res) => {
            const { method, url: reqUrl } = req;
            const parsedUrl = url.parse(reqUrl, true);
            const pathname = parsedUrl.pathname;

            // 设置CORS响应头
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS, GET");
            res.setHeader(
                "Access-Control-Allow-Headers",
                "Content-Type, Authorization"
            );

            // 处理预检请求(OPTIONS)
            if (method === "OPTIONS") {
                res.writeHead(204);
                return res.end();
            }

            // 处理图片请求
            if (pathname.startsWith("/assets/") && pathname.endsWith(".png")) {
                const homeDir = await utilsService.getHzuxRoot("ai-ux");
                const filePath = path.join(homeDir, pathname);
                fs.readFile(filePath, (err, data) => {
                    if (err) {
                        res.writeHead(404);
                        return res.end("Not Found");
                    }

                    res.writeHead(200, {
                        "Content-Type": "image/png",
                        "Cache-Control": "public, max-age=31536000", // 设置长期缓存
                    });
                    res.end(data);
                });
                return;
            }

            // 收集请求体数据
            let body = [];
            req
                .on("data", (chunk) => {
                    body.push(chunk);
                })
                .on("end", async () => {
                    body = Buffer.concat(body).toString();
                    let requestData;
                    try {
                        requestData = body ? JSON.parse(body) : {};
                    } catch (e) {
                        res.writeHead(400, { "Content-Type": "application/json" });
                        return res.end(
                            JSON.stringify(
                                utilsService.returnData({
                                    errorCode: ErrorCodes.FILE_IO_ERROR,
                                    errorMessage: "Invalid JSON",
                                })
                            )
                        );
                    }

                    // 路由处理
                    switch (pathname) {
                        case "/v1/ai-ux/events":
                            handleSSE(req, res, requestData);
                            break;
                        case "/v1/chat/completions":
                            await handleChatCompletions(req, res, requestData);
                            break;
                        case "/v1/update-workflow":
                            await handleUpdateWorkflow(req, res, requestData);
                            break;
                        case "/v1/regenerate-code":
                            await handleRegenerateCode(req, res, requestData);
                            break;
                        case "/v1/generate-code":
                            await handleGenerateCode(req, res, requestData);
                            break;
                        case "/v1/generate-recode":
                            await handleGenerateRecode(req, res, requestData);
                            break;
                        case "/platform/project/upload/pages/img":
                            await handleUploadPagesImg(req, res, requestData);
                            break;
                        case "/platform/project/design/workflow/detail":
                            await handleWorkflowDetail(req, res, requestData);
                            break;
                        case "/platform/project/design/pages":
                            await handleDesignPages(req, res, requestData);
                            break;
                        case "/platform/project":
                            await handlePlatformProject(req, res, requestData);
                            break;
                        case "/platform/initial":
                            await handleInitial(req, res, requestData);
                            break;
                        case "/platform/project/page/error":
                            await handlePageError(req, res, requestData);
                            break;
                        case "/platform/project/delete":
                            await handleDeleteProject(req, res, requestData);
                            break;
                        case "/platform/project/rename":
                            await handleRenameProject(req, res, requestData);
                            break;
                        case "/platform/project/duplicate":
                            await handleDuplicateProject(req, res, requestData);
                            break;
                        case "/platform/project/export":
                            await handleExportProject(req, res, requestData);
                            break;
                        case "/platform/project/share":
                            await handleShareProject(req, res, requestData);
                            break;
                        default:
                            res.writeHead(404, { "Content-Type": "application/json" });
                            res.end(JSON.stringify({ error: "Not Found" }));
                    }
                });
        });

        // 启动服务器
        server.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });

        server.on("error", (err) => {
            if (err.code === "EADDRINUSE" && attempts > 0) {
                console.log(
                    `Port ${port} is already in use. Trying port ${port + 1}...`
                );
                startServer(port + 1, attempts - 1); // 尝试下一个端口
            } else {
                console.error("Server error:", err);
                console.error(`服务启动失败：${err}`);
            }
        });
    }
    // 设置服务器监听的端口
    const defaultPort = 9369;
    // 设置端口尝试次数
    const defaultAttempts = 50;

    return startServer(defaultPort, defaultAttempts);
};
// 导出启动函数
export const closeAIUXServer = async () => {
    // 当服务器永久关闭，客户端关闭，需要把generating 正在生成的，更新文件状态为pending
    console.log('activeProjectId---', activeProjectId)
    if (activeProjectId) {
        await verifyWorkflowPagesStatus(activeProjectId);
    }
    sseManager.closeAll();

    if (server) {
        server?.close(() => {
        });
    }
};
