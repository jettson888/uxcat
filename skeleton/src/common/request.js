import axios from 'axios'
import {
  ElMessage
} from 'element-plus'

// 创建axios实例
const service = axios.create({
  baseURL: '', // 使用相对路径，通过Vite代理解决跨域问题
  // timeout: 15000 // 请求超时时间
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 在发送请求之前做些什么
    // 可以在这里添加token等认证信息
    // const token = store.getters.token
    // if (token) {
    //   config.headers['Authorization'] = 'Bearer ' + token
    // }

    // 如果没有data则默认添加空对象，不然不会带上Content-Type会导致post请求有问题
    if (!config.data) {
      config.data = {}
    }
    // 设置Content-Type
    if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json;charset=UTF-8'
    }

    return config
  },
  error => {
    // 对请求错误做些什么
    console.log('请求错误:', error)
    ElMessage.error('请求发送失败')
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    // 对响应数据做点什么
    const res = response.data

    // 文件流
    if (res.type == 'application/zip') {
      return res;
    }

    // 根据后端约定的状态码进行处理
    if (res.header && res.header.errorCode !== '0') {
      // 统一错误处理
      const errorMessage = res.header.errorMessage || '未知错误'
      console.error('接口错误:', errorMessage)

      // ElMessage.error(errorMessage)

      // 根据不同的错误码进行不同的处理
      // switch (res.header.code) {
      //   case 401:
      //     // 未登录或token过期
      //     console.warn('登录已过期，请重新登录')
      //     // 可以在这里跳转到登录页
      //     // store.dispatch('user/resetToken').then(() => {
      //     //   location.reload()
      //     // })
      //     break
      //   case 403:
      //     // 没有权限
      //     console.warn('没有权限访问该资源')
      //     break
      //   case 500:
      //     // 服务器内部错误
      //     console.error('服务器内部错误')
      //     break
      //   default:
      //     break
      // }

      return Promise.reject(new Error(errorMessage))
    } else {
      // 返回成功的数据
      return res.body || res
    }
  },
  error => {
    // 对响应错误做点什么
    console.log('响应错误:', error)

    // 网络错误处理
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.error('请求超时，请稍后重试')
      ElMessage.error('请求超时，请稍后重试')
    } else if (error.message.includes('Network Error')) {
      console.error('网络错误，请检查网络连接')
      ElMessage.error('网络错误，请检查网络连接')
    } else {
      console.error('请求失败:', error.message)
      ElMessage.error(error.message || '请求失败')
    }

    return Promise.reject(error)
  }
)

export default service