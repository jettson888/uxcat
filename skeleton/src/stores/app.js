import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    clientUrl: 'http://127.0.0.1:9370', // 默认的iframe服务地址
    serverUrl: 'http://127.0.0.1:9369'  // 默认的API服务地址
  }),
  
  actions: {
    setClientUrl(url) {
      this.clientUrl = url
    },
    setServerUrl(url) {
      this.serverUrl = url
    }
  },
  
  getters: {
    getClientUrl: (state) => state.clientUrl,
    getServerUrl: (state) => state.serverUrl
  }
})
