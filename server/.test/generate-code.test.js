const { handleGenerateCode } = require('../controller.js');


const fakeRes = {
    writeHead(...args) {
        console.log(args)
    },
    end(...args) {
        console.log(args)
    },
    send(...args) {
        console.log(args)
    }
}
const result = handleGenerateCode(_, fakeRes, {

})
console.log(result)