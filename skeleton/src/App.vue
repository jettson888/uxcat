<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script setup>
import { onBeforeMount } from "vue";
import { useAppStore } from "@/stores/app";

const appStore = useAppStore();

// 从URL参数初始化地址信息
const initUrlParams = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const ip = urlParams.get("ip");
  const clientPort = urlParams.get("clientPort");
  const serverPort = urlParams.get("serverPort");

  console.log("通过URL参数接收到地址信息:", { ip, clientPort, serverPort });
  if (ip && clientPort) {
    const clientResult = `http://${ip}:${clientPort}`;
    appStore.setClientUrl(clientResult);
  }
  if (ip && serverPort) {
    const serverResult = `http://${ip}:${serverPort}`;
    appStore.setServerUrl(serverResult);
  }
};

// 初始化postMessage监听器
const initPostMessageListener = () => {
  const handleMessage = (event) => {
    // 检查消息类型是否为ADDRESS_INFO
    if (event.data && event.data.type === "ADDRESS_INFO") {
      const { ip, clientPort, serverPort } = event.data.data;
      console.log("通过postMessage接收到地址信息:", {
        ip,
        clientPort,
        serverPort,
      });

      if (ip && clientPort) {
        const clientResult = `http://${ip}:${clientPort}`;
        appStore.setClientUrl(clientResult);
      }
      if (ip && serverPort) {
        const serverResult = `http://${ip}:${serverPort}`;
        appStore.setServerUrl(serverResult);
      }
    }
  };

  // 添加事件监听器
  window.addEventListener("message", handleMessage);
};

onBeforeMount(() => {
  // 从URL参数获取地址信息
  initUrlParams();

  // 初始化postMessage监听器
  initPostMessageListener();
});
</script>
