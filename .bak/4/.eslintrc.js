// .eslintrc.js
module.exports = {
    // 环境配置
    env: {
        browser: true,
        es2021: true,
        node: true
    },

    // 扩展推荐规则
    extends: [
        'eslint:recommended',
        // Vue 2 相关规则
        'plugin:vue/base'
    ],

    // 解析器选项
    parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module'
    },

    // 插件
    plugins: [
        'vue'
    ],

    // 规则配置
    rules: {
        // 基础 JavaScript 规则
        'no-console': 'warn',
        'no-debugger': 'warn',
        'comma-dangle': ['error', {
            arrays: 'always-multiline',
            objects: 'always-multiline',
            imports: 'always-multiline',
            exports: 'always-multiline',
            functions: 'never',
        }],
        'no-unexpected-multiline': 'error',

        // Vue 2 规则
        // 'vue/html-indent': ['error', 2],
        // 'vue/max-attributes-per-line': ['error', {
        //     'singleline': {
        //         'max': 3
        //     },
        //     'multiline': {
        //         'max': 1
        //     }
        // }],
        'vue/html-self-closing': ['error', {
            'html': {
                void: 'always',
                normal: 'always',
                component: 'always',
            },
            svg: 'always',
            math: 'always'
        }],
        // 'vue/component-name-in-template-casing': ['error', 'kebab-case']
    },
};