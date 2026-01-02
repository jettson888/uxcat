const flowMessages = [
    { role: "system", content: flowPrompt.replace('{{userInput}}', userInput) },
    { role: "user", content: "请根据以上需求生成完整的流程JSON字符串，直接返回JSON内容，**不要**写入文件，**不要**返回Markdown代码块。" }
];

const availableTools = fileTools
    .filter(t => t.name !== 'write_file')
    .map(t => ({
        type: "function",
        function: {
            name: t.name,
            description: t.description,
            parameters: t.input_schema
        }
    }));

let flowJson;
try {
    // 尝试从响应中提取JSON
    let content = message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        content = jsonMatch[0];
    }

    flowJson = JSON.parse(content);
    // 手动写入文件
    await fs.outputFile('./docs/flow.json', JSON.stringify(flowJson, null, 2));
} catch (parseError) {
    console.error('解析JSON失败:', parseError);
    throw new Error('无法从响应中提取有效的JSON');
}
