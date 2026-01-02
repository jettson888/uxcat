// 测试同步 projectMap 到 workflow 功能的示例脚本

async function testSyncProjectToWorkflow() {
    const projectId = 'test-project-123';
    
    // 首先创建一个测试项目（模拟 /v1/chat/completions 调用后的状态）
    const createProjectData = {
        prompt: "创建一个用户管理系统",
        projectId: projectId,
        target: "web",
        resolution: "1920 * 1080"
    };
    
    try {
        // 模拟调用 /v1/chat/completions 接口
        console.log('1. 创建项目...');
        const createResponse = await fetch('http://localhost:3000/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(createProjectData)
        });
        
        const createResult = await createResponse.json();
        console.log('项目创建响应:', createResult);
        
        // 等待一段时间让异步处理完成
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 测试同步功能
        console.log('2. 同步 projectMap 到 workflow...');
        const syncData = {
            projectId: projectId
        };
        
        const syncResponse = await fetch('http://localhost:3000/platform/project/sync-workflow', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(syncData)
        });
        
        const syncResult = await syncResponse.json();
        console.log('同步响应:', syncResult);
        
        if (syncResult.body && syncResult.body.data && syncResult.body.data.workflow) {
            console.log('同步成功！');
            console.log('项目信息:', syncResult.body.data.workflow.projectInfo);
            console.log('工作流内容:', syncResult.body.data.workflow.content);
        }
        
    } catch (error) {
        console.error('测试过程中出错:', error);
    }
}

// 运行测试
testSyncProjectToWorkflow();
