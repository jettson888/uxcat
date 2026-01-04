const fs = require('fs-extra');
const path = require('path');
const config = require('../config.js');

class SimpleLogger {
    constructor() {
        this.logDir = path.join(__dirname, '../logs');
        fs.ensureDirSync(this.logDir);
    }

    _getLogFilePath() {
        const dateStr = new Date().toISOString().split('T')[0];
        return path.join(this.logDir, `execution-${dateStr}.log`);
    }

    _formatMessage(level, message, data = null) {
        const timeStr = new Date().toLocaleTimeString('zh-CN', { hour12: false });
        let logMsg = `[${timeStr}] [${level}] ${message}`;
        if (data) {
            if (typeof data === 'object') {
                try {
                    logMsg += `\n${JSON.stringify(data, null, 2)}`;
                } catch (e) {
                    logMsg += `\n[Data Serialization Error]`;
                }
            } else {
                logMsg += ` ${data}`;
            }
        }
        return logMsg;
    }

    _write(level, message, data) {
        const logMsg = this._formatMessage(level, message, data);

        // 写入文件
        try {
            fs.appendFileSync(this._getLogFilePath(), logMsg + '\n');
        } catch (e) {
            console.error('Failed to write log:', e);
        }

        // 控制台输出 (可选，根据需要开启)
        // console.log(logMsg);
    }

    /**
     * 记录主要步骤
     */
    step(message, data) {
        this._write('STEP', message, data);
    }

    /**
     * 记录普通信息
     */
    info(message, data) {
        this._write('INFO', message, data);
    }

    /**
     * 记录警告
     */
    warn(message, data) {
        this._write('WARN', message, data);
    }

    /**
     * 记录错误
     */
    error(message, error) {
        const data = error && error.stack ? error.stack : error;
        this._write('ERROR', message, data);
    }

    /**
     * 记录分隔符，用于区分不同请求
     */
    divider(title = '') {
        const line = '-'.repeat(50);
        const msg = title ? `\n${line}\n ${title}\n${line}` : `\n${line}`;
        try {
            fs.appendFileSync(this._getLogFilePath(), msg + '\n');
        } catch (e) { }
    }
}

const simpleLogger = new SimpleLogger();
module.exports = simpleLogger;
