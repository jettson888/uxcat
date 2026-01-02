import * as path from "path";
import fs from "fs-extra";
import { exec } from "child_process";
import archiver from "archiver";
//

import { projectService, llmService, utilsService } from "./provider.js";
import {
  processChatCompletion,
  processCodeGeneration,
  replacePages,
  replaceWorkflows,
  updatePageStatus,
  updatePage,
  replaceAssetsCover,
  updatePageImgUrl,
  getWorkflow,
  getWorkflowPages,
  replacePagesAndWorkflow,
  firstGenerateCode,
  updateWorkflowProjectName,
} from "./fs-core.js";

import { ANALYSIS_SYSTEM_PROMPT, SYSTEM_PROMPT } from "./prompt.js";

import { isValidVueComponent } from "./utils.js";


// 各个路由的处理函数
export async function handleChatCompletions(req, res, data) {
  console.log("Chat completions request:", data);
  const {
    prompt,
    projectId: reqProjectId,
    target = "web",
    resolution = "1920 * 1080",
  } = data;

  const projectId = reqProjectId || Date.now();
  await projectService.createProjectMap(projectId);
  await projectService.updateProjectMap(projectId, {
    target,
    resolution,
  });

  const newPrompt = `设备类型：${target} 页面分辨率：${resolution} 任务描述：${prompt}`;

  const messages = [
    { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
    { role: "user", content: newPrompt },
  ];

  processChatCompletion(projectId, messages, target, resolution).catch(
    (err) => {
      console.error(
        `Background processing failed for project ${projectId}`,
        err
      );
    }
  );

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify(
      utilsService.returnData({
        projectId,
        status: "pending",
        message: "Chat completions processed",
      })
    )
  );
}

export async function handleUpdateWorkflow(req, res, data) {
  console.log("Update workflow request:", data);
  const { pages, projectId, workflows } = data;

  const projectPath = await utilsService.getProjectPath(projectId);
  const version = "1";
  const projectDir = path.join(projectPath, version);

  await fs.ensureDir(path.join(projectDir, "data"));
  await fs.ensureDir(path.join(projectDir, "code"));

  // 直接替换workflow.json下面的pages
  await replacePages(projectDir, pages);
  await replaceWorkflows(projectDir, workflows);

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify(
      utilsService.returnData({
        status: "Success",
        message: "Workflow updated",
      })
    )
  );
}

export async function handleRegenerateCode(req, res, data) {
  console.log("Regenerate code request:", data);
  const { pages, projectId } = data;

  const projectPath = await utilsService.getProjectPath(projectId);
  const version = "1";
  const projectDir = path.join(projectPath, version);

  await fs.ensureDir(path.join(projectDir, "data"));
  await fs.ensureDir(path.join(projectDir, "code"));

  const projectInfo = await projectService.getProjectMap();
  const currentProject = projectInfo[projectId];
  const { target, resolution } = currentProject;

  let previousPageCode = null;

  processCodeGeneration(
    pages,
    projectDir,
    target,
    resolution,
    previousPageCode
  ).catch((err) => {
    console.error("Code generation failed", err);
  });

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify(
      utilsService.returnData({
        status: "generating",
        message: "Code regenerated",
      })
    )
  );
}

export async function handleGenerateCode(req, res, data) {
  console.log("Generate code request:", data);
  const {
    pages,
    checkedNodes,
    projectId,
    target = "web",
    resolution = "1920 * 1080",
    workflows,
  } = data;

  res.writeHead(200, { "Content-Type": "application/json" });
  const projectPath = await utilsService.getProjectPath(projectId);
  const version = "1";
  const projectDir = path.join(projectPath, version);
  await replacePagesAndWorkflow(data);
  // for (const page of checkedNodes) {
  //   const pageName = page.pageId;
  //   await updatePageStatus(projectDir, pageName, "generating");
  // }
  console.log('projectDir-------------', projectDir)
  firstGenerateCode(pages, checkedNodes, projectDir, target, resolution);
  res.end(
    JSON.stringify(
      utilsService.returnData({
        status: "generating",
        message: "Code generated",
      })
    )
  );
}

export async function handleGenerateRecode(req, res, data) {
  console.log("Generate recode request:", data);

  const {
    projectId,
    pageId,
    name,
    description,
    status = "generating",
    navigationList,
    target = "web",
    resolution = "1920 * 1080",
  } = data;
  const clientPath = await utilsService.getHzuxRoot("ai-ux");
  const TARGET_DIR = path.join(clientPath, "client", "src", "views", "dynamic");

  const projectPath = await utilsService.getProjectPath(projectId);
  const version = "1";
  const projectDir = path.join(projectPath, version);
  // await updatePageStatus(projectDir, pageId, "generating");

  const updated = await updatePage(projectId, pageId, { name, description, status });

  const prompt = `
    页面名称：${pageId}
    页面描述：${description}
    页面导航：${JSON.stringify(navigationList)}
    设备类型：${target}
    页面分辨率：${resolution}
    任务描述：基于我输入的页面描述、页面导航、设备类型等信息帮我进行页面设计和开发工作
    `;

  const response = await llmService.chatCompletion(
    [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Create a Vue 2 component for: ${prompt}` },
    ],
    "qwen-coder"
  );

  const componentContent = response.choices[0].message.content;
  if (!isValidVueComponent(componentContent)) {
    throw new Error(`生成的组件格式无效: ${pageId}` + ":" + 500);
  }

  // const latestVersion = await utilsService.getLastestVersion(projectPath);
  // const latestVersionPath = path.join(projectPath, latestVersion);
  // const newVersionPath = await utilsService.createProject(projectId, '1');
  // Copy all files from previous version to new version
  // await fs.copy(latestVersionPath, newVersionPath);
  await updatePageStatus(projectDir, pageId, "done");

  const fileName = `${pageId}.vue`;
  const codeDir = path.join(projectDir, "code");
  await fs.ensureDir(codeDir);
  const patchFile = path.join(codeDir, fileName);

  const vueContent = await utilsService.extractVueTemplates(componentContent);
  await fs.writeFile(patchFile, vueContent);
  await utilsService.copyFileWithReplace(
    patchFile,
    path.join(TARGET_DIR, fileName)
  );

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify(
      utilsService.returnData({ ...updated, message: "Recode generated" })
    )
  );
}

async function uploadLocalImg(data) {
  const { projectId, pageId: pageName, imgUrl: base64Data } = data;

  // 获取操作系统特定存储路径
  let assetsDir = path.join(await utilsService.getHzuxRoot('ai-ux'), 'assets', projectId);

  await fs.ensureDir(assetsDir);
  const versionDir = path.join(assetsDir, '1');
  await fs.ensureDir(versionDir);

  const filePath = path.join(versionDir, pageName + ".png");
  console.log('Uploading image to:', filePath);
  await writeFileImg(filePath, base64Data);
}

async function writeFileImg(dir, data) {
  const base64String = data.split(";base64,").pop();
  const filePath = path.join(dir);
  await fs.writeFile(filePath, base64String, "base64");
}


export async function handleUploadPagesImg(req, res, data) {
  // console.log("Upload pages image request:", data);
  const { projectId, pageId: pageName, imgUrl: base64Data } = data;
  if (!base64Data) {
    throw new Error("base64Data required: " + 400);
  }

  try {
    const projectPath = await utilsService.getProjectPath(projectId);
    const latestVersion = await utilsService.getLastestVersion(projectPath);

    // 获取操作系统特定的封面存储路径
    let coverPath = path.join(projectPath, latestVersion, "cover");

    await fs.ensureDir(coverPath);
    const filePath = path.join(coverPath, pageName + ".png");
    console.log('Saving cover image to:', filePath);
    await writeFileImg(filePath, base64Data);

    await uploadLocalImg(data);

    await replaceAssetsCover(projectId);
    await updatePageImgUrl(projectId, pageName);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify(
        utilsService.returnData({ message: "Image uploaded", filePath })
      )
    );
  } catch (error) {
    throw new Error(error.message + ":" + 500);
  }
}

export async function handleWorkflowDetail(req, res, data) {
  console.log("Workflow detail request:", data);
  const { projectId } = data;
  //TODO: 需要检测本地存储相关文件，如果code里面和workflow数据的data pages里面的代码存在，则把status改成 done
  // await handleReplaceAll(req, res, data);
  await replaceAssetsCover(projectId);

  const projectMap = await projectService.getProjectMap();
  const currentProjectInfo = projectMap[projectId];

  if (!currentProjectInfo) {
    throw new Error("Project not found: " + 404);
  }

  res.writeHead(200, { "Content-Type": "application/json" });

  if (currentProjectInfo.status === "done") {
    const [workflow] = await getWorkflow(projectId);
    if (workflow && typeof workflow.content === "string") {
      workflow.content = JSON.parse(workflow.content);
      res.end(
        JSON.stringify(
          utilsService.returnData({
            ...workflow,
            status: currentProjectInfo.status,
            message: "Workflow detail returned",
          })
        )
      );
    } else {
      res.end(
        JSON.stringify(
          utilsService.returnData({
            content: {},
            status: currentProjectInfo.status,
            message: "Workflow detail returned",
          })
        )
      );
    }
  } else {
    res.end(
      JSON.stringify(
        utilsService.returnData({
          content: {},
          status: currentProjectInfo.status,
          message: "Workflow detail loading",
        })
      )
    );
  }
}

export async function handleDesignPages(req, res, data) {
  console.log("Design pages request:", data);
  const { projectId, version: v } = data;
  let pages = await getWorkflowPages(projectId, v);
  const projectMap = await projectService.getProjectMap();
  const currentProject = projectMap[projectId];
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify(
      utilsService.returnData({
        list: pages,
        ...currentProject,
        message: "Design pages processed",
      })
    )
  );
}

export async function handlePlatformProject(req, res, data) {
  console.log("Platform project request:", data);
  const { keyword, page = 1, sort, pageSize = 10 } = data;
  const map = await projectService.getProjectMap();

  // 为每个项目获取第一个页面的imgUrl
  let projects = await Promise.all(
    Object.entries(map).map(async ([id, info]) => {
      // 获取workflow pages
      const pages = await getWorkflowPages(id);
      let imgUrl = null;
      // 如果有pages且第一个page有imgUrl,则使用它
      if (pages && pages.length > 0 && pages[0].imgUrl) {
        imgUrl = pages[0].imgUrl;
      }
      return {
        projectId: id,
        ...info,
        imgUrl,
      };
    })
  );

  if (keyword) {
    projects = projects.filter((p) => p.projectName?.includes(keyword));
  }

  // 按时间降序排序
  projects.sort((a, b) => {
    const timeA = a.createAt || a.projectId;
    const timeB = b.createAt || b.projectId;
    return new Date(timeB) - new Date(timeA);
  });


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
}

export async function handleReplaceAll(req, res, data) {
  const { projectId } = data;
  const projectPath = await utilsService.getProjectPath(projectId);
  const version = "1";
  const sourceDir = path.join(projectPath, version);
  const sourceCodeDir = path.join(sourceDir, "code");
  await fs.ensureDir(sourceCodeDir);

  const clientPathRoot = await utilsService.getHzuxRoot("ai-ux");
  const clientPath = path.join(clientPathRoot, "client");

  const targetDir = path.join(clientPath, "src");

  const targetPageDir = path.join(targetDir, "views", "dynamic");
  await fs.ensureDir(targetPageDir);
  await utilsService.copyDirectory(sourceCodeDir, targetPageDir);

  const sourceCoverDir = path.join(sourceDir, "cover");
  await fs.ensureDir(sourceCoverDir);
  const targetCoverDir = path.join(targetDir, "assets", "cover");
  await fs.ensureDir(targetCoverDir);
  await utilsService.copyDirectory(sourceCoverDir, targetCoverDir);

  const componentDir = path.join(sourceDir, 'components')
  await fs.ensureDir(componentDir);
  const targetComponentDir = path.join(targetDir, 'components')
  await utilsService.copyDirectory(componentDir, targetComponentDir);
}

export async function handleDeleteProject(req, res, data) {
  const { projectId } = data;

  try {
    // 1. 删除projectId对应的本地文件目录
    const projectPath = await utilsService.getProjectPath(projectId);
    if (await fs.pathExists(projectPath)) {
      await fs.remove(projectPath);
    }

    // 2. 从project-map.json中移除对应的项目记录
    const root = await utilsService.getHzuxRoot();
    const projectMapPath = path.join(root, "project-map.json");
    if (await fs.pathExists(projectMapPath)) {
      let map = await projectService.getProjectMap();
      if (map[projectId]) {
        delete map[projectId];
        await fs.writeJSON(projectMapPath, map, { spaces: 2 });
      }
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify(
        utilsService.returnData({
          success: true,
          message: "Project deleted successfully",
        })
      )
    );
  } catch (error) {
    console.error(`Failed to delete project ${projectId}`, error);
    throw new Error(error.message + ":" + 500);
  }
}

export async function handleRenameProject(req, res, data) {
  const { projectId, projectName } = data;

  try {
    const root = await utilsService.getHzuxRoot();
    const projectMapPath = path.join(root, "project-map.json");
    if (await fs.pathExists(projectMapPath)) {
      let map = await projectService.getProjectMap();
      if (map[projectId]) {
        map[projectId] = {
          ...map[projectId],
          projectName,
        };
        await fs.writeJSON(projectMapPath, map, { spaces: 2 });
      }
    }

    updateWorkflowProjectName(projectId, projectName);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify(
        utilsService.returnData({
          success: true,
          message: "Project rename successfully",
        })
      )
    );
  } catch (error) {
    console.error(`Failed to rename project ${projectId}`, error);
    throw new Error(error.message + ":" + 500);
  }
}

export async function handleDuplicateProject(req, res, data) {
  const { projectId } = data;

  try {
    const root = await utilsService.getHzuxRoot();
    const projectMapPath = path.join(root, "project-map.json");
    const map = await projectService.getProjectMap();

    if (map[projectId]) {
      // 生成新ID
      const newProjectId = Date.now().toString();

      // 复制文件
      const newPath = path.join(root, newProjectId);
      await fs.copy(map[projectId].path, newPath);

      // 更新map
      map[newProjectId] = {
        ...map[projectId],
        projectId: newProjectId,
        path: newPath,
        isCopy: true,
        createdAt: new Date().toISOString(),
      };

      await fs.writeJSON(projectMapPath, map, { spaces: 2 });

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify(
          utilsService.returnData({
            success: true,
            message: "Project duplicated successfully",
            newProjectId,
          })
        )
      );
    }

    throw new Error("Project not found:", 404);
  } catch (error) {
    console.error(`Failed to duplicate project ${projectId}`, error);
    throw new Error(error.message + ":" + 500);
  }
}


function zipDirectory(sourceDir, outputPath, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      const output = fs.createWriteStream(outputPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        console.log(`ZIP created: ${outputPath}, ${archive.pointer()} bytes`);
        resolve(outputPath);
      });
      archive.on('error', err => reject(err));

      archive.pipe(output);

      // 处理排除/包含规则
      const globOptions = {
        cwd: sourceDir,
        dot: true,
        nodir: true,
        ignore: options.ignore || [],
        onlyFiles: true
      };

      if (options.include) {
        archive.glob(options.include, globOptions);
      } else {
        // 默认包含所有文件，除了ignore指定的
        archive.glob('**/*', {
          ...globOptions,
          ignore: [
            ...(options.ignore || []),
            '**/node_modules/**',
            '**/.git/**',
            '**/.vscode/**',
            '**/dist/**'
          ]
        });
      }

      archive.finalize();
    } catch (err) {
      reject(err);
    }
  });
}

export async function handleExportProject(req, res, data) {
  const { projectId, type = 'html' } = data;

  try {
    const clientPathRoot = await utilsService.getHzuxRoot("ai-ux");
    const clientPath = path.join(clientPathRoot, "client");

    // 创建临时目录存储zip文件
    const tempDir = path.join(clientPathRoot, 'temp');
    await fs.ensureDir(tempDir);
    const zipPath = path.join(tempDir, `export_${projectId}_${Date.now()}.zip`);

    if (type === 'html') {
      // 导出HTML包：构建后压缩dist目录
      await new Promise((resolve, reject) => {
        exec('npm run build', { cwd: clientPath }, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
      await zipDirectory(path.join(clientPath, 'dist'), zipPath);
    } else if (type === 'web') {
      // 导出Web工程：排除node_modules后压缩整个client目录
      await zipDirectory(clientPath, zipPath, {
        ignore: [
          '**/node_modules/**',
          '**/.git/**',
          '**/dist/**',
          '**/.vscode/**',
          '**/*.log',
          '**/temp/**',
          '**/logs/**',
          '**/.DS_Store'
        ]
      });
    }

    // 设置下载头
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=${path.basename(zipPath)}`);

    // 流式传输zip文件
    const fileStream = fs.createReadStream(zipPath);
    fileStream.pipe(res);

    // 传输完成后删除临时文件
    fileStream.on('close', () => fs.remove(zipPath).catch(console.error));

  } catch (error) {
    console.error('Export project failed:', error);
    res.status(500).json(utilsService.returnError(error.message));
  }
}

export async function handleProjectImage(req, res, data) {
  const { projectId, pageId } = data
  const projectPath = await utilsService.getProjectPath(projectId);
  const projectDir = path.join(projectPath, '1');
  const coverDir = path.join(projectDir, 'cover');
  await fs.ensureDir(coverDir);

  const imagePath = path.join(coverDir, `${pageId}.png`);
  // 检查文件是否存在
  if (!(await fs.pathExists(imagePath))) {
    throw new Error('Image not found');
  }

  // 读取图片文件并转换为base64
  const imageBuffer = await fs.readFile(imagePath);
  const base64Image = imageBuffer.toString('base64');

  res.end(
    JSON.stringify(
      utilsService.returnData({
        success: true,
        image: base64Image,
        message: "Image retrieved successfully",
      })
    )
  );
}
