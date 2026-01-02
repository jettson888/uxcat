import { ProjectService } from "./project-service.js";
import { LlmService } from "./llm-service.js";
import { UtilsService } from "./utils-service.js";

const projectService = new ProjectService()
const llmService = new LlmService();
const utilsService = new UtilsService();

export {
    projectService,
    llmService,
    utilsService
}