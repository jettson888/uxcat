import { bootstrapHzuxServer } from './service.js';

// 启动服务器，监听 3000 端口
const server = bootstrapHzuxServer();

console.log('Natural Language to Code Service starting on port 3000...');
