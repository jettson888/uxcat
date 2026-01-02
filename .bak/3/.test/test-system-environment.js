const { replacePlaceholders } = require('../utils/slot-template.js');

const systemEnvironment = replacePlaceholders(`
系统设计说明:
模型生成的flow等非代码文件需要写入到{{projectDir}}/{{projectId}}/data文件目录下, 模型生成的代码page文件需要写入到{{projectDir}}/{{projectId}}/code文件目录下, 模型生成的代码components公共组件需要写入到{{projectDir}}/{{projectId}}/components文件目录下。
模型生成的数据文件需要在{{projectDir}}存储一份副本，实时渲染代码文件需要clone到{{clientDir}}目录下。
系统环境说明：
{{projectDir}}: 项目副本存储目录
{{projectId}}: 项目ID
{{clientDir}}: 项目前端代码实时渲染目录
`, {
    projectDir: 'D:/frontend-code/hzux',
    clientDir: 'D:/frontend-code/client'
})

console.log('systemEnvironment---', systemEnvironment)
console.log('systemEnvironment---', replacePlaceholders(systemEnvironment, { projectId: '111313131x' }))