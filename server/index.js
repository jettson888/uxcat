const http = require('http');

const fs = require('fs-extra');
const path = require('path');
const url = require("url");
const config = require('./config.js');
const { handleChatCompletions, handleGenerateCode, handlePlatformProject, handleTaskStatus, handleWorkflowDetail, handleProjectPages } = require('./controller.js');


function bootstrap() {
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
      const homeDir = config.AIUX_DIR;
      const filePath = path.join(homeDir, pathname);
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
          return res.end(e.message);
        }

        // 路由处理
        switch (pathname) {
          case "/v1/chat/completions":
            handleChatCompletions(req, res, requestData);
            break;
          case "/v1/task-status":
            handleTaskStatus(req, res, requestData);
            break;
          case "/v1/flow/detail":
            handleWorkflowDetail(req, res, requestData);
            break;
          case "/v1/generate-code":
            handleGenerateCode(req, res, requestData);
            break;
          case "/v1/platform/project":
            handlePlatformProject(req, res, requestData);
            break;
          case "/v1/project/pages":
            handleProjectPages(req, res, requestData);
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
