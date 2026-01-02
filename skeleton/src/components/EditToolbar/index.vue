<template>
  <div
    @dblclick="stop"
    @mouseenter="stop"
    @mouseleave="stop"
    @mousemove="stop"
    @mouseout="stop"
    @mouseover="stop"
    @mouseup="stop" 
    @click="stop"
    class="wrap"
    :style="{'left': config.left, 'top': config.top, 'width': config.lineWidth, 'height': config.lineHeight}"
  >
    <div class="tools-box"  v-if="config.toolMode === 'edit'" :style="{
      'left': getTooltipPos.left,
      'top': getTooltipPos.top
    }">
      <!-- <el-tooltip
        effect="dark"
        :content="item.name"
        :auto-color="500"
        :placement="getTooltipPos.placement"
        :teleported="false"
        v-for="(item, index) in toolbarConfig" 
        :key="index"
      > -->
        <el-icon v-for="(item, index) in toolbarConfig" :key="index" class="item-icon" @click="iconClick(item.component)">
          <component :is="item.component" />
        </el-icon>
      <!-- </el-tooltip> -->
    </div>
    <div 
      class="mark-line"
      :style="{'width': config.lineWidth, 'height': config.lineHeight}"
    >
    </div>
  </div>
</template>

<script setup>
import { reactive, defineProps, watch, computed, ref } from "vue"
import { ElIcon, ElTooltip } from "element-plus"
import { More, Top, Delete, Setting, Location } from "@element-plus/icons-vue"

const props = defineProps({
  toolConfig: {
    type: String,
    required: false,
    default: "{}"
  },
  isMultiSelect: {
    type: String,
    required: false,
    default: "disable"
  }
})
const getTooltipPos = computed(() => {
  const tooltipDirection = config.tooltipDirection
  if(tooltipDirection === "top") {
    return {
      top: "-20px",
      left: "0px",
      placement: "top"
    }
  } else if(tooltipDirection === "bottom") {
    return {
      top: config.lineHeight,
      left: "0px",
      placement: "bottom"
    }
  } else if(tooltipDirection === "left") {
    return {
      top: "0px",
      left: "-114px",
      placement: "left"
    }
  } else if(tooltipDirection === "right") {
    return {
      top: "0px",
      left: Number(config.lineWidth.replace("px", "")) + "px",
      placement: "right" 
    }
  } else if(tooltipDirection === "inside") {
    return {
      top: "0px",
      left: "0px",
      placement: "bottom-left"  
    }
  }
  return {
    top: "-20px",
    left: "0px",
    placement: "top"
  }
})
const config = reactive({
  toolMode: "edit",
  lineWidth: "0px",
  lineHeight: "0px",
  top: "0px",
  left: "0px"
})

const toolbarConfig = ref(
  [
    // {
    //   name: "基础配置",
    //   component: Setting
    // },
    // {
    //   name: "定位到源码",
    //   component: Location
    // },
    {
      name: "选中上级节点",
      component: Top
    },
    // {
    //   name: "添加至多选列表",
    //   component: More
    // },
    {
      name: "删除",
      component: Delete
    }
  ]
)

watch(() => props.toolConfig, (newValue) => {
  // 只做增量更新
  const newValueObj = Utils.safeJsonParse(newValue)
  if(newValueObj) {
    for(let key in newValueObj) {
      config[key] = newValueObj[key]
    }
  }
}, { immediate: true })

watch(() => props.isMultiSelect, (newValue) => {
  if(newValue === "disable") {
    toolbarConfig.value = [
      // {
      //   name: "基础配置",
      //   component: Setting
      // },
      // {
      //   name: "定位到源码",
      //   component: Location
      // },
      {
        name: "选中上级节点",
        component: Top
      },
      // {
      //   name: "添加至多选列表",
      //   component: More
      // },
      {
        name: "删除",
        component: Delete
      }
    ]
  } else {
    toolbarConfig.value = [
      // {
      //   name: "定位到源码",
      //   component: Location
      // },
      {
        name: "选中上级节点",
        component: Top
      },
      // {
      //   name: "添加至多选列表",
      //   component: More
      // },
      {
        name: "删除",
        component: Delete
      }
    ]
  }
}, { immediate: true })

const iconClick = (component) => {
  const { name } = component
  const functionMap = {
    // 打开基础配置面板
    Setting: () => {
      const msg = {
        type: "action-right",
        data: {
          action: "open"
        }
      };
      Message?.sendMessage(msg);
    },
    // 快速定位到源码
    Location: () => {
      const dom = _Global.currSelectedDom
      if(dom) {
        // 找出最近的标记节点
        const nearlyEle = dom.closest("[data-insp-path]");
        // 获取代码路径
        const info = nearlyEle.getAttribute("data-insp-path");
        if(!info) return
        // 打开编辑器
        const [path, line, column] = info.split(":");
        Message?.sendMessage({
          type: "open-code",
          data: {
            path: `${path}:${line}:${column}`
          }
        })
      }
    },
    // 选中上级节点
    Top: () => {
      Business?.clickTopNode()
    },
    // 添加至多选列表
    More: () => {
      Business?.addToMultiList()
    },
    // 删除节点
    Delete: () => {
      Business?.deleteAdapter()
    }
  }

  const callFunction = functionMap[name]
  // 进行非基础配置时  统一关闭属性配置面板处理
  if(name !== "Setting") {
    const msg = {
      type: "action-right",
      data: {
        action: "close"
      }
    };
    Message && Message.sendMessage(msg);
  }
  callFunction?.()
}

const stop = (e) => {
  e.stopPropagation();
  e.preventDefault();
}

</script>
