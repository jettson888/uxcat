// ai生成原型稿后端服务
import http from "http";
import url from "url";
import fs from "fs";
import path from "path";

import { ErrorCodes } from "./error-codes.js";

import {
  handleChatCompletions,
  handleUpdateWorkflow,
  handleRegenerateCode,
  handleGenerateCode,
  handleGenerateRecode,
  handleUploadPagesImg,
  handleWorkflowDetail,
  handleDesignPages,
  handlePlatformProject,
  handleReplaceAll,
  handleDeleteProject,
  handleRenameProject,
  handleDuplicateProject,
  handleProjectImage,
  handleExportProject,
} from "./controller.js";

import { UtilsService } from "./utils-service.js";

const utilsService = new UtilsService();

export default function bootstrap() {
  const server = http.createServer(async (req, res) => {
    const { method, url: reqUrl } = req;
    const parsedUrl = url.parse(reqUrl, true);
    const pathname = parsedUrl.pathname;
    // 设置CORS响应头
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS, GET");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );

    // 处理预检请求(OPTIONS)
    if (method === "OPTIONS") {
      res.writeHead(204);
      return res.end();
    }

    // 处理图片请求
    if (pathname.startsWith("/assets/") && pathname.endsWith(".png")) {
      const homeDir = await utilsService.getHzuxRoot("ai-ux");
      const filePath = path.join(homeDir, pathname);
      console.log("filePath---", filePath);
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          return res.end("Not Found");
        }

        res.writeHead(200, {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=31536000", // 设置长期缓存
        });
        res.end(data);
      });
      return;
    }

    // 收集请求体数据
    let body = [];
    req
      .on("data", (chunk) => {
        body.push(chunk);
      })
      .on("end", () => {
        body = Buffer.concat(body).toString();
        let requestData;
        try {
          requestData = body ? JSON.parse(body) : {};
        } catch (e) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify(
              utilsService.returnData({
                errorCode: ErrorCodes.FILE_IO_ERROR,
                errorMessage: "Invalid JSON",
              })
            )
          );
        }

        // 路由处理
        switch (pathname) {
          case "/v1/chat/completions":
            handleChatCompletions(req, res, requestData);
            break;
          case "/v1/update-workflow":
            handleUpdateWorkflow(req, res, requestData);
            break;
          case "/v1/regenerate-code":
            handleRegenerateCode(req, res, requestData);
            break;
          case "/v1/generate-code":
            handleGenerateCode(req, res, requestData);
            break;
          case "/v1/generate-recode":
            handleGenerateRecode(req, res, requestData);
            break;
          case "/platform/project/upload/pages/img":
            handleUploadPagesImg(req, res, requestData);
            break;
          case "/platform/project/design/workflow/detail":
            handleWorkflowDetail(req, res, requestData);
            break;
          case "/platform/project/design/pages":
            handleDesignPages(req, res, requestData);
            break;
          case "/platform/project":
            handlePlatformProject(req, res, requestData);
            break;
          case "/platform/replace-all": // 首页有很多项目，通过点击不同的项目，可以看到当前项目的页面，什么时机通过本地存储的代码替换掉旧代码
            handleReplaceAll(req, res, requestData);
            break;
          case "/platform/project/delete": // 删除
            handleDeleteProject(req, res, requestData);
            break;
          case "/platform/project/rename": // 重命名
            handleRenameProject(req, res, requestData);
            break;
          case "/platform/project/duplicate": // 复制
            handleDuplicateProject(req, res, requestData);
            break;
          case "/platform/project/export":
            handleExportProject(req, res, requestData);
            break;
          case "/v1/platform/project/img": // 废弃
            handleProjectImage(req, res, requestData);
            break;
          default:
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Not Found" }));
        }
      });
  });

  // 启动服务器
  const PORT = 9369;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  return () => {
    server?.close(() => {
      console.log("hzux service close");
    });
  };
}

bootstrap()