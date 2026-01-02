import path from "path"

const data = {
  "projectName": "智慧园区管理系统",
  "pages": [
    {
      pageId: "homePage",
      pageName: "首页",
    },
    {
      pageId: "userListPage",
      pageName: "用户列表",
    },
    {
      pageId: "userDetailPage",
      pageName: "用户详情",
    },
    {
      pageId: "dataReportPage",
      pageName: "数据报表",
    }
  ],
  "workflows": [],
  "globalComponents": {},
  "pageGenerateStatus": {},
  "generateQueue": [],
  "status": "generating"  // 项目整体状态：generating | completed | error
}

async function writeWorkflow(projectId, version, workflowData) {
  const workflowPath = path.join(projectDir, projectId, version, 'data', 'workflow.json');
  const workflowDir = path.dirname(workflowPath);

  try {
    // 确保目录存在
    await fs.promises.mkdir(workflowDir, { recursive: true });

    // 确保content是object
    if (typeof workflowData.content === 'string') {
      workflowData.content = JSON.parse(workflowData.content);
    }

    // 写入临时文件
    const tempPath = `${workflowPath}.tmp`;
    await fs.promises.writeFile(tempPath, JSON.stringify({
      ...workflowData,
      content: workflowData.content || {},
    }, null, 2));

    // 原子性重命名
    await fs.promises.rename(tempPath, workflowPath);

    console.log(`Workflow写入成功: ${workflowPath}`);
  } catch (error) {
    console.error('写入workflow失败:', {
      error: error.message,
      path: workflowPath
    });
    throw error;
  }
}
async function readWorkflow(projectId, version) {
  const workflowPath = path.join(projectDir, projectId, version, 'data', 'workflow.json');
  try {
    if (await fs.promises.access(workflowPath).then(() => true).catch(() => false)) {
      const fileContent = await fs.promises.readFile(workflowPath, 'utf8');
      const content = JSON.parse(fileContent);
      if (content && typeof content.content === "string") {
        content.content = JSON.parse(content.content)
      }
      return content;
    }
  } catch (error) {
    console.error('读取workflow失败:', error);
  }
  return null;
}

async function handleGenerateCode(req, res, data) {
  const { projectId, pageIds } = data; // 支持传单个或数组
  const workflow = await readWorkflow(projectId, version);

  const pagesToGenerate = Array.isArray(pageIds) ? pageIds : [pageIds];

  // 初始化状态字段（如果不存在）
  if (!workflow.content.pageGenerateStatus) {
    workflow.content.pageGenerateStatus = {};
    workflow.content.generateQueue = [];
  }

  let hasNewTask = false;

  for (const pageId of pagesToGenerate) {
    const currentStatus = workflow.content.pageGenerateStatus[pageId];

    if (currentStatus === 'completed') {
      // 已完成：允许重新生成（覆盖）
      workflow.content.pageGenerateStatus[pageId] = 'pending';
      workflow.content.generateQueue.push(pageId);
      hasNewTask = true;
    } else if (currentStatus === 'generating') {
      // 正在生成：拒绝重复，提示正在进行中
      continue;
    } else if (!currentStatus || currentStatus === 'pending' || currentStatus === 'error') {
      // 未开始或失败：加入队列
      workflow.content.pageGenerateStatus[pageId] = 'pending';
      if (!workflow.content.generateQueue.includes(pageId)) {
        workflow.content.generateQueue.push(pageId);
        hasNewTask = true;
      }
    }
  }

  await writeWorkflow(projectId, version, workflow);

  // 如果有新任务，启动后台工作者（如果还没启动的话）
  if (hasNewTask) {
    startPageGenerateWorker(projectId, version);
  }

  res.json(utilsService.returnData({ message: "任务已加入队列" }));
}

const activeWorkers = new Set(); // 防止重复启动

async function startPageGenerateWorker(projectId, version) {
  const key = `${projectId}-${version}`;
  if (activeWorkers.has(key)) return;
  activeWorkers.add(key);

  while (true) {
    const workflow = await readWorkflow(projectId, version);
    const queue = workflow.content.generateQueue || [];

    if (queue.length === 0) break;

    const pageId = queue.shift(); // 出队
    workflow.content.pageGenerateStatus[pageId] = 'generating';
    await writeWorkflow(projectId, version, workflow);

    try {
      // 执行真正的页面代码生成（调用 Agent 或直接 LLM）
      await generateSinglePageCode(projectId, version, pageId);

      workflow.content.pageGenerateStatus[pageId] = 'completed';
    } catch (err) {
      workflow.content.pageGenerateStatus[pageId] = 'error';
      console.error(`生成页面 ${pageId} 失败`, err);
    }

    await writeWorkflow(projectId, version, workflow);
  }

  activeWorkers.delete(key);

  // 检查是否全部完成
  const workflow = await readWorkflow(projectId, version);
  const allDone = Object.values(workflow.content.pageGenerateStatus)
    .every(s => s === 'completed' || s === 'error');
  if (allDone) {
    workflow.content.status = 'completed';
    await writeWorkflow(projectId, version, workflow);
  }
}