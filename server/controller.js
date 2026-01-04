const flowPrompt = require('./prompts/flow.js');
const { HZBUI_CODE_PROMPT, CODE_PROMPT } = require('./prompts/code.js');
const fileTools = require('./tools/file-tools.js');
const knowledgeTool = require('./tools/knowledge-tool.js');
const { checkVueCode } = require('./utils/eslint-checker.js');
const { getLintConfigs } = require('./utils/lint-config.js');
const { callWithTimeoutAndRetry, callWithTimeout } = require('./utils/wrapper.js');
const { handleToolCalls } = require('./utils/tools.js');
const { callChatCompletion } = require('./utils/api.js');
const { replacePlaceholders } = require('./utils/slot-template.js');
const taskManager = require('./utils/task-manager.js');
const pageQueueManager = require('./utils/page-queue-manager.js');
const fs = require('fs-extra');
const path = require('path');
const { readWorkflowSafely, writeWorkflowSafely } = require('./utils/workflow-file-handler.js');

// 简单的文件锁机制，避免并发写入冲突
const fileLocks = new Map(); // 存储锁的状态
const lockWaiters = new Map(); // 存储等待锁的队列

/**
 * 获取文件锁
 * @param {string} filePath 文件路径
 * @returns {Promise<Function>} 释放锁的函数
 */
async function acquireFileLock(filePath) {
    // 如果没有锁，直接获取
    if (!fileLocks.has(filePath)) {
        fileLocks.set(filePath, true);
        return () => releaseFileLock(filePath);
    }

    // 否则等待锁释放
    return new Promise((resolve) => {
        if (!lockWaiters.has(filePath)) {
            lockWaiters.set(filePath, []);
        }
        lockWaiters.get(filePath).push(resolve);
    });
}

/**
 * 释放文件锁
 * @param {string} filePath 文件路径
 */
function releaseFileLock(filePath) {
    const waiters = lockWaiters.get(filePath) || [];
    if (waiters.length > 0) {
        // 将锁传递给下一个等待者
        const nextResolve = waiters.shift();
        nextResolve(() => releaseFileLock(filePath));
    } else {
        // 没有等待者，释放锁
        fileLocks.delete(filePath);
    }
}

const config = require('./config.js');

const systemEnvironment = replacePlaceholders(`
系统设计说明:
模型生成的flow等非代码文件需要写入到{{projectDir}}/{{projectId}}/1/data文件目录下, 模型生成的代码page文件需要写入到{{projectDir}}/{{projectId}}/1/code文件目录下, 模型生成的代码components公共组件需要写入到{{projectDir}}/{{projectId}}/1/components文件目录下。
模型生成的数据文件需要在{{projectDir}}存储一份副本，实时渲染代码文件需要clone到{{clientDir}}目录下。
系统环境说明：
projectDir: {{projectDir}} 项目副本存储目录
projectId: {{projectId}} 项目ID
clientDir: {{clientDir}} 项目前端代码实时渲染目录
注意:
你需要自主决定scope是 clientDir 还是 projectDir 
对于write_file时常要把文件写入到 projectDir 此时 path 是 ./1/data、./1/components、./1/code 根据情况而定, 如果你需要读取工程代码结构或者查询package.json或者src/*、src/router、src/dynamic或者引用文件路径或者alias、assets、*.config.js 那么scope就是clientDir, 
对于read_file时常要查看代码文件有没生成、以及代码文件内容是否完整、读取代码文件,那么 scope是projectDir dir 此时就是 ./1/data、./1/components、./1/code, 但是如果要读取前端工程目录、读取路由配置、读取*.config.js、package.json、src/*那么scope是clientDir, dir 此时就是 ./src/*、./src/router、./src/dynamic、./assets、./*.config.js
对于list_files同理, 一旦你确定了你需要查看前端工程代码文件那么scope就是clientDir 一旦你需要确认文件是否写入从副本查看代码那么scope就是projectDir。
`, {
    projectDir: config.PROJECT_DIR,
    clientDir: config.CLIENT_DIR
})

async function handleChatCompletions(req, res, data) {
    const { projectId, prompt } = data;

    try {
        // 1. 立即创建任务并返回
        const taskId = `generate-flow-${projectId}`
        let task = null
        // 创建或更新任务
        if (taskManager.getTask(taskId)) {
            taskManager.updateTask(taskId, {
                status: 'pending',
                updatedAt: Date.now()
            });
        } else {
            task = taskManager.createTask(taskId, 'flow', projectId);
        }


        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
            success: true,
            projectId,
            taskId: taskId,
            status: task.status,
            message: '任务已创建，请轮询查询状态'
        }));

        // 2. 异步执行实际的LLM调用（不阻塞响应）
        setImmediate(() => {
            executeFlowGeneration(projectId, prompt).catch(error => {
                console.error(`项目 ${projectId} 执行失败:`, error);
            });
        });

    } catch (error) {
        console.error('创建任务失败:', error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
            success: false,
            error: error.message || '创建任务失败'
        }));
    }
}

// 异步执行流程图生成
async function executeFlowGeneration(projectId, prompt) {
    const taskId = `generate-flow-${projectId}`
    try {
        // 标记任务开始处理
        taskManager.startTask(taskId);

        const systemPrompt = replacePlaceholders(`请根据以上需求生成完整的流程JSON，直接返回JSON内容，**不要**返回Markdown代码块，并把内容写入 {{projectDir}}/{{projectId}}/1/data/workflow.json文件。`, {
            projectDir: config.PROJECT_DIR,
            projectId: projectId
        });

        const flowMessages = [
            { role: "system", content: flowPrompt.replace('{{systemPrompt}}', systemPrompt) },
            { role: "user", content: prompt }
        ];

        // 注意权限问题，确保目录可写
        /**
         * try {  await fs.promises.access(`${config.PROJECT_DIR}/${projectId}/1/data`, fs.constants.W_OK);  } catch (error) {  // 权限不足  }
         */

        const availableTools = fileTools
            .filter(t => t.name !== 'read_file')
            .filter(t => t.name !== 'list_files')
            .map(t => ({
                type: "function",
                function: {
                    name: t.name,
                    description: t.description,
                    parameters: t.input_schema
                }
            }));

        // 使用超时控制包装器
        const task = async (signal) => {
            const options = {
                messages: flowMessages,
                tools: availableTools,
                criticalTools: ['write_file'], // 关键工具优先 + 部分成功处理
                signal,
                // transaction: false,  // 是否支持事务
                callback: async (messages, tools) => {
                    return await callChatCompletion({
                        messages,
                        tools,
                        model: 'qwen-coder',
                        signal,
                        timeout: 60000
                    });
                },
                maxIterations: 10,
                earlyExit: true  // ✅ 启用早期退出：工具执行成功后不再调用模型
            }
            return await handleToolCalls(options);
        }

        // 重试3次, 2分钟超时
        const result = await callWithTimeoutAndRetry(task, 3, 120000);

        // 任务完成
        taskManager.completeTask(taskId, {
            message: result,
            workflowPath: `${config.PROJECT_DIR}/${projectId}/1/data/workflow.json`
        });

    } catch (error) {
        console.error(`项目 ${projectId} 生成失败:`, error);

        // 判断是否超时
        if (error.message.includes('超时') || error.message.includes('timeout')) {
            taskManager.timeoutTask(taskId);
        } else {
            taskManager.failTask(taskId, error);
        }
    }
}

async function handleWorkflowDetail(req, res, data) {
    const { projectId } = data

    try {
        const flow = await readWorkflowSafely(projectId);
        if (flow) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
                success: true,
                data: {
                    content: flow
                }
            }));
        } else {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
                success: false,
                error: 'flow不存在或格式错误'
            }));
        }
    } catch (error) {
        console.error('读取workflow.json失败:', error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
            success: false,
            error: '读取flow失败'
        }));
    }
}

// 新增：查询任务状态接口
function handleTaskStatus(req, res, data) {
    const { projectId, type, pageId } = data;

    let task = null
    let taskId = ''

    try {
        if (type === 'flow') {
            taskId = `generate-flow-${projectId}`
            task = taskManager.getTask(taskId);
        } else {
            if (pageId) {
                taskId = `generate-code-${projectId}-${pageId}`
                task = taskManager.getTask(taskId);
            } else {
                task = taskManager.getCodeTasks(projectId);
            }
        }

        if (!task) {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
                success: false,
                error: '任务不存在'
            }));
            return;
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
            success: true,
            task
        }));

    } catch (error) {
        console.error('查询任务状态失败:', error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
            success: false,
            error: error.message || '查询失败'
        }));
    }
}

async function handleGenerateCode(req, res, data) {
    const { projectId, checkedNodes = [], pages = [], pageId = "", name = "", description = "" } = data

    const selectedPages = checkedNodes ? checkedNodes : pages;
    try {
        // 判断是批量生成还是单页面重新生成
        const isSinglePageRegenerate = !selectedPages.length && pageId && name && description;

        let taskIds = [];
        let tasks = [];
        let message = '';

        if (isSinglePageRegenerate) {
            // 单页面重新生成
            const taskId = `generate-code-${projectId}-${pageId}`;
            taskIds = [taskId];
            message = `页面 ${name} 重新生成任务已创建`;

            // 创建或更新任务
            if (taskManager.getTask(taskId)) {
                taskManager.updateTask(taskId, {
                    status: 'pending',
                    updatedAt: Date.now()
                });
            } else {
                const task = taskManager.createTask(taskId, 'code', projectId);
                tasks.push(task)
            }

            // 异步执行单页面生成
            setImmediate(() => {
                executeSinglePageGeneration(projectId, {
                    pageId,
                    name,
                    description
                }).catch(error => {
                    console.error(`页面 ${pageId} 生成失败:`, error);
                });
            });

        } else if (selectedPages.length > 0) {
            // 批量生成多个页面
            taskIds = selectedPages.map(p => `generate-code-${projectId}-${p.pageId}`);
            message = `批量生成 ${selectedPages.length} 个页面任务已创建`;

            // 为每个页面创建任务
            taskIds.forEach(taskId => {
                if (taskManager.getTask(taskId)) {
                    taskManager.updateTask(taskId, {
                        status: 'pending',
                        updatedAt: Date.now()
                    });
                } else {
                    const task = taskManager.createTask(taskId, 'code', projectId);
                    tasks.push(task)
                }
            });

            // 异步执行批量生成
            setImmediate(() => {
                executeCodeGeneration(projectId, selectedPages).catch(error => {
                    console.error(`项目 ${projectId} 批量生成失败:`, error);
                });
            });

        } else {
            // 参数错误
            throw new Error('请提供 pages 数组或单个页面信息（pageId, name, description）');
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
            success: true,
            projectId,
            taskIds,
            message,
            tasks,
        }));

    } catch (error) {
        console.error('创建代码生成任务失败:', error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
            success: false,
            error: error.message || '创建任务失败'
        }));
    }
};

/**
 * 执行代码生成（批量，使用队列管理）
 */
async function executeCodeGeneration(projectId, pages) {
    console.log(`\n📦 开始批量生成 ${pages.length} 个页面`);

    try {
        const task = (page) => {
            return {
                pageId: page.pageId,
                taskFn: async (signal) => {
                    const taskId = `generate-code-${projectId}-${page.pageId}`;

                    try {
                        // 标记任务开始处理
                        taskManager.startTask(taskId);

                        // 执行生成
                        const result = await generateSinglePageWithSteps(projectId, page, signal);

                        // 标记任务完成
                        taskManager.completeTask(taskId, result);

                        return { success: true, pageId: page.pageId, ...result };
                    } catch (error) {
                        // 判断是否超时
                        if (error.message.includes('超时') || error.message.includes('timeout')) {
                            taskManager.timeoutTask(taskId);
                        } else if (error.message.includes('取消')) {
                            // 任务被取消，不更新状态（保持 pending）
                            console.log(`⚠️  任务被取消: ${taskId}`);
                        } else {
                            taskManager.failTask(taskId, error);
                        }
                        return { success: false, pageId: page.pageId, error: error.message };
                    }
                }
            }
        }
        // 为每个页面创建生成任务
        const tasks = pages.map(page => task(page));

        // 使用队列管理器批量执行
        const results = await pageQueueManager.addBatchTasks(tasks);

        // 统计结果
        const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        const failedCount = results.length - successCount;

        console.log(`\n✅ 批量生成完成: ${successCount} 成功, ${failedCount} 失败`);

    } catch (error) {
        console.error(`项目 ${projectId} 批量生成失败:`, error);
    }
}

/**
 * 执行单页面生成（重新生成）
 */
async function executeSinglePageGeneration(projectId, page) {
    const { pageId, name, description } = page;
    const taskId = `generate-code-${projectId}-${pageId}`;

    console.log(`\n🔄 重新生成页面: ${name} (${pageId})`);

    try {
        // 添加到队列（会自动取消该页面的旧任务）
        await pageQueueManager.addTask(pageId, async (signal) => {
            try {
                // 标记任务开始处理
                taskManager.startTask(taskId);

                // 执行生成
                const result = await generateSinglePageWithSteps(projectId, page, signal);

                // 标记任务完成
                taskManager.completeTask(taskId, result);

                return result;
            } catch (error) {
                // 判断是否超时
                if (error.message.includes('超时') || error.message.includes('timeout')) {
                    taskManager.timeoutTask(taskId);
                } else if (error.message.includes('取消')) {
                    // 任务被取消，不更新状态
                    console.log(`⚠️  任务被取消: ${taskId}`);
                } else {
                    taskManager.failTask(taskId, error);
                }
                throw error;
            }
        });

        console.log(`✅ 页面重新生成成功: ${name}`);

    } catch (error) {
        if (!error.message.includes('取消')) {
            console.error(`页面重新生成失败: ${name}`, error);
        }
    }
}

/**
 * 生成单个页面（带重试机制和取消支持）
 * 步骤：
 * 1. 调用 LLM 分析需要哪些组件
 * 2. 调用 knowledge_chat 获取组件示例
 * 3. 调用 LLM 生成完整代码
 * 4. ESLint 检查
 * 5. 写入磁盘
 */
async function generateSinglePageWithSteps(projectId, page, signal) {
    const { pageId, name, description, navigationList = [] } = page;
    let retries = 3; // 重试3次
    let lastError = null;

    console.log(`\n🚀 开始生成页面: ${name} (${pageId})`);

    // 更新页面状态为 generating
    await updatePageStatus(projectId, pageId, 'generating');

    while (retries >= 0) {
        try {
            // 检查是否已取消 场景 A（排队时被取消/重试前被取消）：Gatekeeper
            if (signal?.aborted) {
                throw new Error('任务被取消');
            }

            // 单个页面生成任务的总超时时间：4分钟
            let strict = false;
            let result = {};
            if (strict) {
                result = await generatePageWithStepsInStrict(projectId, page, signal)
            } else {
                result = await generatePageWithStepsInLoose(projectId, page, signal)
            }

            // 再次检查是否已取消（防止在生成过程中被取消但未抛出错误的情况）
            if (signal?.aborted) {
                throw new Error('任务被取消');
            }

            // 成功
            await updatePageStatus(projectId, pageId, 'done', result);
            console.log(`✅ 页面生成成功: ${name}`);
            return { success: true, pageId, name, ...result };

        } catch (error) {
            console.log('error-------', error.message)
            // 如果是取消错误，直接抛出不重试
            if (error.message.includes('取消') || signal?.aborted) {
                await updatePageStatus(projectId, pageId, 'pending'); // 恢复为待生成
                throw error;
            }

            lastError = error;
            console.error(`❌ 页面生成失败 (剩余重试: ${retries}):`, error.message);

            if (retries > 0) {
                // 等待后重试（指数退避）
                const waitTime = (3 - retries) * 2000; // 2s, 4s
                console.log(`⏳ 等待 ${waitTime}ms 后重试...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                retries--;
            } else {
                break;
            }
        }
    }

    // 所有重试都失败
    const status = (lastError.message.includes('超时') || lastError.message.includes('timeout')) ? 'timeout' : 'error';
    await updatePageStatus(projectId, pageId, status, { error: lastError.message });
    console.error(`💥 页面生成最终失败: ${name} - ${lastError.message}`);
    throw lastError; // 抛出错误而不是返回对象
}

/**
 * 严格模式，必须都成功才成功，一个不成功抛错
 * 执行页面生成的三个步骤
 */
async function generatePageWithStepsInStrict(projectId, page, signal) {
    const { pageId, name, description, navigation = [] } = page;

    // 步骤1: 调用 LLM 分析需要哪些组件（3分钟超时）
    console.log(`  📝 步骤1: 分析页面所需组件...`);
    const componentsNeeded = await analyzeRequiredComponents(page, signal);
    console.log(`  ✅ 需要的组件:`, componentsNeeded);

    // 步骤2: 调用 knowledge_chat 获取组件示例（批量查询）
    console.log(`  📚 步骤2: 查询组件使用示例...`);
    const componentExamples = await fetchComponentExamples(componentsNeeded, signal);
    console.log(`  ✅ 获取到 ${componentExamples.length} 个组件示例`);

    // 步骤3: 调用 LLM 生成完整代码（3分钟超时）
    console.log(`  💻 步骤3: 生成完整页面代码...`);
    const code = await generatePageCode(page, componentExamples, signal);
    console.log(`  ✅ 代码生成完成，长度: ${code.length}`);

    // 步骤4: ESLint 检查
    console.log(`  🔍 步骤4: ESLint 检查...`);
    const lintResult = await checkVueCode(code);
    if (!lintResult.valid) {
        throw new Error(`ESLint 检查失败: ${lintResult.errors.join(', ')}`);
    }
    console.log(`  ✅ ESLint 检查通过`);

    // 步骤5: 写入磁盘
    console.log(`  💾 步骤5: 写入文件...`);
    const filePath = await savePageToFile(projectId, pageId, code);
    console.log(`  ✅ 文件写入成功: ${filePath}`);

    return { filePath, codeLength: code.length };
}

/**
 * 执行页面生成的三个步骤
 */
async function generatePageWithStepsInLoose(projectId, page, signal) {
    const { pageId, name, description, navigation = [] } = page;
    let componentsNeeded = [];
    let componentExamples = [];

    // 步骤1: 调用 LLM 分析需要哪些组件（3分钟超时）
    console.log(`  📝 步骤1: 分析页面所需组件...`);
    try {
        componentsNeeded = await analyzeRequiredComponents(page, signal);
        // 如果返回为空或非数组，视为失败/无结果
        if (!Array.isArray(componentsNeeded) || componentsNeeded.length === 0) {
            console.log(`  ⚠️ 分析结果为空，跳过组件示例获取`);
            componentsNeeded = [];
        } else {
            console.log(`  ✅ 需要的组件:`, componentsNeeded);
        }
    } catch (error) {
        console.warn(`  ⚠️ 分析组件失败，跳过组件示例获取: ${error.message}`);
        componentsNeeded = [];
    }

    // 步骤2: 调用 knowledge_chat 获取组件示例（批量查询）
    // 场景 B（执行中被取消）：
    if (signal?.aborted) throw new Error('任务被取消');
    if (componentsNeeded.length > 0) {
        console.log(`  📚 步骤2: 查询组件使用示例...`);
        try {
            componentExamples = await fetchComponentExamples(componentsNeeded, signal);
            console.log(`  ✅ 获取到 ${componentExamples.length} 个组件示例`);
        } catch (error) {
            console.warn(`  ⚠️ 获取组件示例失败: ${error.message}`);
            componentExamples = [];
        }
    } else {
        console.log(`  ⏭️ 跳过步骤2: 无需查询组件示例`);
    }

    // 步骤3: 调用 LLM 生成完整代码（3分钟超时）
    if (signal?.aborted) throw new Error('任务被取消');
    console.log(`  💻 步骤3: 生成完整页面代码...`);
    const code = await generatePageCode(page, componentExamples, signal);
    console.log(`  ✅ 代码生成完成，长度: ${code.length}`);

    // 步骤4: ESLint 检查
    if (signal?.aborted) throw new Error('任务被取消');
    console.log(`  🔍 步骤4: ESLint 检查...`);
    const lintResult = await checkVueCode(code);
    if (!lintResult.valid) {
        throw new Error(`ESLint 检查失败: ${lintResult.errors.join(', ')}`);
    }
    console.log(`  ✅ ESLint 检查通过`);

    // 步骤5: 写入磁盘
    if (signal?.aborted) throw new Error('任务被取消');
    console.log(`  💾 步骤5: 写入文件...`);
    const filePath = await savePageToFile(projectId, pageId, code);
    console.log(`  ✅ 文件写入成功: ${filePath}`);

    return { filePath, codeLength: code.length };
}

/**
 * 步骤1: 分析页面需要哪些组件
 */
async function analyzeRequiredComponents(page, signal) {
    const prompt = `请分析以下页面需求，列出需要使用的 <hzb-ui> 组件名称（只需要组件名，用逗号分隔）：

页面名称：${page.name}
页面描述：${page.description}

请直接返回组件名称列表，例如：Button, Table, Form, Input`;

    const messages = [
        { role: 'system', content: '你是一个 Vue 组件分析专家，擅长根据需求识别所需的 UI 组件。' },
        { role: 'user', content: prompt }
    ];
    const response = await callChatCompletion({
        messages,
        signal,
        model: 'qwen-coder',
        timeout: 10000 // 30000 == 30s,  2min = 120000
    });

    // 解析组件列表
    const content = response.content || '';
    const components = content
        .split(/[,，\n]/)
        .map(c => c.trim())
        .filter(c => c && c.length > 0 && c.length < 30)
        .slice(0, 10); // 最多10个组件

    return components;
}

/**
 * 步骤2: 获取组件使用示例
 */
async function fetchComponentExamples(components, signal) {
    if (!components || components.length === 0) {
        return [];
    }

    const examples = [];
    for (const componentName of components) {
        try {
            if (signal?.aborted) {
                throw new Error('任务被取消');
            }

            const result = await knowledgeTool.execute({ query: `${componentName} 组件使用示例` });
            examples.push({ component: componentName, example: result });
        } catch (error) {
            console.warn(`  ⚠️  获取组件 ${componentName} 示例失败:`, error.message);
            // 不阻断流程，继续下一个
        }
    }

    return examples;
}

/**
 * 步骤3: 生成完整页面代码
 */
async function generatePageCode(page, componentExamples, signal) {
    const { name, description, navigation = [] } = page;

    // 组装组件示例文本
    let componentsText = '';
    if (Array.isArray(componentExamples) && componentExamples.length > 0) {
        const examplesText = componentExamples
            .map(e => `## ${e.component}\n${e.example}`)
            .join('\n\n');
        // 只有在有示例时才添加 <hzb-ui> 标签
        componentsText = `<hzb-ui>\n${examplesText}\n</hzb-ui>`;
    }

    // 使用代码模板
    const codePromptTemplate = componentExamples.length > 0 ? HZBUI_CODE_PROMPT : CODE_PROMPT;
    const prompt = replacePlaceholders(codePromptTemplate, {
        pageName: name,
        pageDesc: description,
        pageNavigation: JSON.stringify(navigation, null, 2),
        components: componentsText,
        icons: '[]', // TODO: 从配置读取
        projectDirs: '[]', // TODO: 从配置读取
        publicComponents: '[]', // TODO: 从配置读取
        deviceType: 'PC'
    });

    const messages = [
        { role: 'user', content: prompt }
    ];

    const availableTools = fileTools
        .filter(t => t.name === 'write_file')
        .map(t => {
            return {
                type: "function",
                function: {
                    name: t.name,
                    description: t.description,
                    parameters: t.input_schema
                }
            }
        })

    // 使用超时控制包装器
    const task = async () => {
        const options = {
            messages,
            tools: availableTools,
            signal,
            // transaction: false,  // 是否支持事务
            callback: async (messages, tools) => {
                return await callChatCompletion({
                    messages,
                    tools,
                    signal,
                    model: 'qwen-coder',
                    timeout: 10000
                });
            },
            maxIterations: 10,
            earlyExit: true  // ✅ 启用早期退出：工具执行成功后不再调用模型
        }
        return await handleToolCalls(options);
    }

    const response = await task();

    let code = response.content || '';

    // 清理 Markdown 代码块标记
    code = code.replace(/```vue\n?/g, '').replace(/```\n?$/g, '').trim();

    if (!code || code.length < 100) {
        throw new Error('生成的代码为空或过短');
    }

    return code;
}

/**
 * 步骤5: 保存页面到文件
 */
async function savePageToFile(projectId, pageId, code) {
    const codeDir = path.join(config.PROJECT_DIR, projectId, '1', 'code');
    await fs.ensureDir(codeDir);

    const fileName = `${pageId}.vue`;
    const filePath = path.join(codeDir, fileName);

    // 使用临时文件和原子操作来避免文件损坏
    const tempPath = filePath + '.tmp';
    await fs.writeFile(tempPath, code, 'utf-8');

    // 原子性地替换原文件
    await fs.move(tempPath, filePath, { overwrite: true });

    // TODO: 同步到 client 目录（实时渲染）
    // const clientPath = path.join(config.CLIENT_DIR, 'src', 'views', 'dynamic', fileName);
    // await fs.copy(filePath, clientPath);

    return filePath;
}

/**
 * 更新页面状态
 */
async function updatePageStatus(projectId, pageId, status, extraData = {}) {
    const workflowPath = path.join(config.PROJECT_DIR, projectId, '1', 'data', 'workflow.json');
    try {

        if (!await fs.pathExists(workflowPath)) {
            console.warn(`workflow.json 不存在，跳过状态更新: ${workflowPath}`);
            return;
        }

        const workflow = await readWorkflowSafely(projectId);
        if (!workflow) {
            console.warn('无法读取workflow.json，跳过状态更新');
            return;
        }

        if (!workflow.pages || !Array.isArray(workflow.pages)) {
            console.warn('workflow.json 中没有 pages 数组');
            return;
        }

        const pageIndex = workflow.pages.findIndex(p => p.pageId === pageId);
        if (pageIndex === -1) {
            console.warn(`页面 ${pageId} 在 workflow.json 中不存在`);
            return;
        }

        // 更新状态
        const previousStatus = workflow.pages[pageIndex].status;
        workflow.pages[pageIndex].status = status;
        workflow.pages[pageIndex].updatedAt = Date.now();
        Object.assign(workflow.pages[pageIndex], extraData);

        // 添加日志以便调试
        console.log(`  📝 页面 ${pageId} 状态从 ${previousStatus} 更新为 ${status}`);

        // 使用文件锁避免并发写入冲突
        const releaseLock = await acquireFileLock(workflowPath);
        try {
            // 在获取锁之后，重新读取最新的文件内容以避免状态覆盖
            const latestWorkflow = await readWorkflowSafely(projectId);
            if (latestWorkflow && latestWorkflow.pages && Array.isArray(latestWorkflow.pages)) {
                const latestPageIndex = latestWorkflow.pages.findIndex(p => p.pageId === pageId);
                if (latestPageIndex !== -1) {
                    // 更新最新文件中的页面状态
                    const previousStatus = latestWorkflow.pages[latestPageIndex].status;
                    latestWorkflow.pages[latestPageIndex].status = status;
                    latestWorkflow.pages[latestPageIndex].updatedAt = Date.now();
                    Object.assign(latestWorkflow.pages[latestPageIndex], extraData);

                    console.log(`  📝 页面 ${pageId} 状态从 ${previousStatus} 更新为 ${status} (使用最新文件)`);

                    // 使用临时文件和原子操作来避免文件损坏
                    const tempPath = workflowPath + '.tmp';
                    await fs.writeJson(tempPath, latestWorkflow, { spaces: 2 });

                    // 原子性地替换原文件
                    await fs.move(tempPath, workflowPath, { overwrite: true });

                    console.log(`  📝 已更新页面状态: ${pageId} -> ${status}`);
                } else {
                    console.warn(`页面 ${pageId} 在最新workflow中不存在`);
                }
            } else {
                console.warn('无法获取最新的workflow数据，使用原始数据');
                // 退回到原始逻辑
                const tempPath = workflowPath + '.tmp';
                await fs.writeJson(tempPath, workflow, { spaces: 2 });

                // 原子性地替换原文件
                await fs.move(tempPath, workflowPath, { overwrite: true });

                console.log(`  📝 已更新页面状态: ${pageId} -> ${status}`);
            }
        } finally {
            // 释放锁
            releaseLock();
        }

    } catch (error) {
        console.error(`更新页面状态失败:`, error);

        // 尝试清理临时文件
        try {
            const tempPath = workflowPath + '.tmp';
            if (await fs.pathExists(tempPath)) {
                await fs.remove(tempPath);
            }
        } catch (cleanupError) {
            console.error('清理临时文件失败:', cleanupError);
        }

        // 不抛出异常，避免影响主流程
    }
}

function handlePlatformProject(req, res, data) {
    const { projectId } = data

};

module.exports = {
    handleChatCompletions,
    handleGenerateCode,
    handlePlatformProject,
    handleTaskStatus,
    handleWorkflowDetail,
}