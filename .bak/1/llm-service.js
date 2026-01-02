
import axios from "axios";
// const LLM_HOST = "http://aigw.aibs.hzb:7997";
const LLM_HOST = "http://158.2.130.21:9997";


export class LlmService {
  async chatCompletion(messages = [], model = 'deepseek-reason', temperature = 0.3) {
    try {
      const response = await axios.post(
        `${LLM_HOST}/v1/chat/completions`,
        {
          model: model,
          messages: messages,
          temperature: temperature,
          stream: false
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
          }
        }
      );

      return response.data;
    } catch (error) {
      throw error;
    }
  }
}
