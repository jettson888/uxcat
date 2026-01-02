/* eslint-disable */
export function parseCodeJson(jsonData) {
  try {
    const { codes, async_task_thought } = jsonData.data
    const thoughtLogs = JSON.parse(async_task_thought)
    
    return {
      components: codes.map(item => ({
        path: item.path,
        content: item.content
      })),
      logs: thoughtLogs.filter(log => log.data?.v)
    }
  } catch (e) {
    console.error('解析失败', e)
    return null
  }
}



// 1. 首先定义JSON提取工具函数
export function extractJSONFromContent(content) {
  if (!content) return null;
  console.log('extractJSONFromContent---content----',content)
  // 情况1：直接是JSON字符串
  try {
    return JSON.parse(content);
  } catch (e) {
    // 不是纯JSON，继续尝试情况2
  }
  
  // 情况2：包含Markdown代码块
  const jsonMatch = content.match(/```json\n([\s\S]*?)```/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1].trim());
    } catch (e) {
      console.error('Markdown中的JSON解析失败:', e);
    }
  }
  
  // 情况3：尝试无标记的代码块
  const genericMatch = content.match(/```\n([\s\S]*?)```/);
  if (genericMatch) {
    try {
      return JSON.parse(genericMatch[1].trim());
    } catch (e) {
      console.error('无标记代码块中的JSON解析失败:', e);
    }
  }
  
  return null;
}