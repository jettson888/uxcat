<template>
  <div class="diy-collapse-item" :class="{ 'is-active': isActive }">
    <div class="diy-collapse-item__header" @click="handleHeaderClick">
      <el-icon style="margin: 0 16px">
        <CaretBottom v-if="isActive" />
        <CaretRight v-else />
      </el-icon>
      <slot name="title">{{ title }}</slot>
    </div>
    <div
      class="diy-collapse-item__wrap"
      ref="contentWrap"
      :style="{ height: contentHeight }"
    >
      <div ref="content">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script>
import {
  defineComponent,
  ref,
  computed,
  watch,
  nextTick,
  onMounted,
  onBeforeUnmount,
  inject,
} from "vue";

export default defineComponent({
  name: "DiyCollapseItem",
  props: {
    // 面板项的唯一标识符
    name: {
      type: [String, Number],
      default: "",
    },
    // 面板标题
    title: {
      type: String,
      default: "",
    },
    // 是否禁用
    disabled: Boolean,
  },
  setup(props) {
    const contentHeight = ref("0px");
    const contentWrap = ref(null);
    const content = ref(null);

    // 获取父级Collapse组件提供的方法
    const collapse = inject("collapse", null);

    // 是否为激活状态
    const isActive = computed(() => {
      if (collapse && collapse.activeNames) {
        return collapse.activeNames.value.indexOf(props.name) > -1;
      }
      return false;
    });

    // 监听激活状态变化
    watch(
      isActive,
      (val) => {
        nextTick(() => {
          if (val) {
            // 展开时设置为实际高度
            const height = content.value ? content.value.offsetHeight : 0;
            contentHeight.value = height + "px";
          } else {
            // 收起时设置为0
            contentHeight.value = "0px";
          }
        });
      },
      { immediate: true }
    );

    // 处理头部点击事件
    const handleHeaderClick = () => {
      if (props.disabled) return;
      if (collapse && collapse.handleItemClick) {
        collapse.handleItemClick(props);
      }
    };

    // 监听transitionend事件处理函数
    const handleTransitionEnd = () => {
      if (isActive.value) {
        contentHeight.value = "auto";
      }
    };

    // 挂载时添加事件监听器
    onMounted(() => {
      if (contentWrap.value) {
        contentWrap.value.addEventListener(
          "transitionend",
          handleTransitionEnd
        );
      }
    });

    // 卸载前移除事件监听器
    onBeforeUnmount(() => {
      if (contentWrap.value) {
        contentWrap.value.removeEventListener(
          "transitionend",
          handleTransitionEnd
        );
      }
    });

    return {
      contentHeight,
      contentWrap,
      content,
      isActive,
      handleHeaderClick,
    };
  },
});
</script>

<style lang="scss" scoped>
.diy-collapse-item {
  border-bottom: 1px solid #ebeef5;

  &:last-child {
    border-bottom: none;
  }
}

.diy-collapse-item__header {
  display: flex;
  align-items: center;
  height: 44px;
  border-bottom: 1px solid #efefef;
  font-family: PingFangSC-Semibold;
  font-size: 14px;
  font-weight: 600;
  background-color: #fff;
  color: #1f1f1f;
  cursor: pointer;
  transition: border-bottom-color 0.3s;
  outline: none;

  &:hover {
    color: #409eff;
  }

  &.focusing:focus:not(:hover) {
    color: #409eff;
  }

  .is-active & {
    border-bottom-color: transparent;
  }
}
.diy-collapse-item__wrap {
  overflow: hidden;
  transition: height 0.3s ease-in-out;
  box-sizing: border-box;
  background: #f8f8f8;
}

.diy-collapse-item.is-disabled {
  .diy-collapse-item__header {
    color: #bbb;
    cursor: not-allowed;
  }
}
</style>
