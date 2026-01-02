const fs = require('fs-extra');

const { checkVueCode } = require('../utils/eslint-checker')


const path = require('path');


function getCodeFiles(rootDir, targetDir = 'code') {
    const codeFiles = []

    function walkDir(currentDir) {
        const files = fs.readdirSync(currentDir);
        files.forEach(file => {
            const fullPath = path.join(currentDir, file);
            const stat = fs.statSync(fullPath)
            if (stat.isDirectory()) {
                if (file === targetDir) {
                    fs.readdirSync(fullPath).forEach(codeFile => {
                        codeFiles.push(path.join(fullPath, codeFile))
                    })
                } else {
                    walkDir(fullPath)
                }
            }
        })
    }

    walkDir(rootDir);
    return codeFiles
}

const rootPath = 'D:/frontend-code/hzux'
const codeFiles = getCodeFiles(rootPath)
console.log(codeFiles)

async function bootstrap() {
    // const filePath = path.join(__dirname, 'homePage.vue');
    // const code = await fs.readFile(filePath, { encoding: 'utf-8' })
    // const result = await checkVueCode(code, 'temp.vue')
    // console.log(result)
    codeFiles.forEach(async filePath => {
        const code = await fs.readFile(filePath, { encoding: 'utf-8' })
        const result = await checkVueCode(code, 'temp.vue')
        console.log(result)
    })
}

bootstrap()
