const fs = require('fs-extra')
const { checkVueCode } = require('../utils/eslint-checker.js');

async function runs() {
  const code = fs.readFileSync('./visitRegistration.vue', { encoding: 'utf-8' })
  const result = await checkVueCode(code, 'visitRegistration.vue')
  console.log(result)
}

runs()