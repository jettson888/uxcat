module.exports = {
    env: { browser: true, es2021: true },
    plugins: ['vue'],
    extends: ['eslint:recommended'],
    parserOptions: { sourceType: 'module' },
    rules: { 'no-unused-vars': 'off', 'vue/multi-word-component-names': 'off' }
}