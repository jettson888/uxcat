const flowPrompt = require('./prompts/flow.js');
const fileTools = require('./tools/file-tools.js');
const { handleToolCalls } = require('./utils/tools.js');
const { callChatCompletion } = require('./utils/api.js');
const { replacePlaceholders } = require('./utils/slot-template.js');
const config = require('./config.js');

const systemEnvironment = replacePlaceholders(`
系统设计说明:
模型生成的flow等非代码文件需要写入到{{projectDir}}/{{projectId}}/data文件目录下, 模型生成的代码page文件需要写入到{{projectDir}}/{{projectId}}/code文件目录下, 模型生成的代码components公共组件需要写入到{{projectDir}}/{{projectId}}/components文件目录下。
模型生成的数据文件需要在{{projectDir}}存储一份副本，实时渲染代码文件需要clone到{{clientDir}}目录下。
系统环境说明：
projectDir: {{projectDir}} 项目副本存储目录
projectId: {{projectId}} 项目ID
clientDir: {{clientDir}} 项目前端代码实时渲染目录
`, {
    projectDir: config.PROJECT_DIR,
    clientDir: config.CLIENT_DIR
})

async function handleChatCompletions(req, res, data) {
    const { projectId, prompt } = data
    try {
        const userPrompt = `请根据以上需求生成完整的流程JSON字符串，直接返回JSON内容，**不要**返回Markdown代码块，并把内容写入${config.PROJECT_DIR}/${projectId}/data/flow.json文件。scope: write_flow \n\n` + replacePlaceholders(systemEnvironment, {
            projectId
        })
        const flowMessages = [
            { role: "system", content: flowPrompt.replace('{{userInput}}', prompt) },
            { role: "user", content: userPrompt }
        ];

        const availableTools = fileTools
            .map(t => ({
                type: "function",
                function: {
                    name: t.name,
                    description: t.description,
                    parameters: t.input_schema
                }
            }));
        // 处理工具调用循环
        let message = await handleToolCalls(flowMessages, availableTools, callChatCompletion);
    } catch (error) {

    }

};

function handleGenerateCode(req, res, data) {
    const { projectId } = data

};

function handlePlatformProject(req, res, data) {
    const { projectId } = data

};

module.exports = {
    handleChatCompletions,
    handleGenerateCode,
    handlePlatformProject,
}