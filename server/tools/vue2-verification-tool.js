const fs = require('fs-extra');
const path = require('path');
const { checkVueCode } = require('../utils/eslint-checker.js');

/**
 * Vue2 代码验证工具
 * 用于检查生成的 Vue2 代码是否符合规范
 */
const vue2VerificationTool = {
  name: 'vue2_code_verification',
  description: '验证 Vue2 代码是否符合规范，检查语法错误、格式问题和最佳实践',
  input_schema: {
    type: 'object',
    properties: {
      code: {
        type: 'string',
        description: '要验证的 Vue2 代码'
      },
      fileName: {
        type: 'string',
        description: '文件名，用于错误报告'
      }
    },
    required: ['code', 'fileName']
  },
  execute: async function (args) {
    const { code, fileName = 'generated.vue' } = args;

    if (!code) {
      throw new Error('代码不能为空');
    }

    try {
      // 使用 ESLint 检查代码
      const lintResult = await checkVueCode(code);

      if (lintResult.ok) {
        return {
          success: true,
          message: `代码验证通过: ${fileName}`,
          fileName,
          errors: [],
          warnings: []
        };
      } else {
        // 代码检查失败，返回错误信息
        // lintResult 格式: { ok: false, message: '发现 N 个错误', details: '行:列 错误信息 [规则ID]\n...' }
        // 需要将 details 转换为数组格式
        const errorList = lintResult.details
          ? lintResult.details.split('\n')
          : [lintResult.message];

        return {
          success: false,
          message: `代码验证失败: ${fileName}. ${lintResult.message}`,
          fileName,
          errors: errorList,
          warnings: [],
          suggestion: '请根据上述错误信息修正代码，然后重新生成'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `代码验证过程中发生错误: ${error.message}`,
        fileName,
        errors: [error.message],
        warnings: []
      };
    }
  }
};

module.exports = vue2VerificationTool;