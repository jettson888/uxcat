
import { llmService, utilsService } from "./provider.js";
import { SYSTEM_PROMPT } from "./prompt.js";
import { isValidVueComponent } from "./utils.js";

export class GeneratorAgent {
    constructor(llmService) {
        this.llmService = llmService;
    }

    async generate(page, target, resolution, globalCompPrompt) {
        const basePrompt = `
        页面名称：${page.name}
        页面描述：${page.description}
        页面导航：${JSON.stringify(page.navigationList)}
        设备类型：${target}
        页面分辨率：${resolution}
        任务描述：基于我输入的页面描述、页面导航、设备类型等信息帮我进行页面设计和开发工作
      `;

        let systemPrompt = SYSTEM_PROMPT;
        systemPrompt = systemPrompt.replace("{globalComponents}", globalCompPrompt);
        systemPrompt = systemPrompt.replace("{stype}", "");

        const messages = [
            { role: "system", content: systemPrompt },
            { role: "user", content: basePrompt },
        ];

        try {
            console.log(`[GeneratorAgent] Generating code for ${page.pageId}...`);
            const response = await this.llmService.chatCompletion(messages, "qwen-coder");
            const content = response.choices[0].message.content;
            return content;
        } catch (error) {
            console.error(`[GeneratorAgent] Generation failed for ${page.pageId}`, error);
            throw error;
        }
    }
}

export class ReviewerAgent {
    async review(code, pageId) {
        console.log(`[ReviewerAgent] Reviewing code for ${pageId}...`);

        // 1. Basic Syntax/Structure Check
        if (!isValidVueComponent(code)) {
            return {
                approved: false,
                reason: "Invalid Vue Component Structure"
            };
        }

        // 2. Checkpoint: Here we could add more advanced checks or even a separate LLM call 
        // to verify against requirements. For now, we enforce structure validity as the checkpoint.
        // In a real multi-agent system, this could be a "Human in the Loop" trigger or a "Critic" agent.

        // TODO: Add stricter checks if needed.

        return {
            approved: true,
            code: await utilsService.extractVueTemplates(code)
        };
    }
}

export const generatorAgent = new GeneratorAgent(llmService);
export const reviewerAgent = new ReviewerAgent();
