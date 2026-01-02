<template>
  <div class="diy-collapse" :class="{ 'diy-collapse-accordion': accordion }">
    <slot></slot>
  </div>
</template>

<script>
import { defineComponent, ref, watch, nextTick, provide } from "vue";

export default defineComponent({
  name: "DiyCollapse",
  props: {
    // 是否开启手风琴模式，开启后每次只能展开一个面板
    accordion: {
      type: Boolean,
      default: false,
    },
    // 当前激活的面板name数组
    value: {
      type: [Array, String, Number],
      default: () => [],
    },
    // 是否默认激活第一个面板
    defaultFirst: {
      type: Boolean,
      default: true,
    },
  },
  setup(props, { emit, slots }) {
    const activeNames = ref([]);

    // 监听value变化
    watch(
      () => props.value,
      (val) => {
        activeNames.value = Array.isArray(val) ? val : [val];
      },
      { immediate: true }
    );

    // 初始化时确保activeNames是数组格式
    activeNames.value = Array.isArray(props.value)
      ? props.value
      : [props.value];

    // 尝试激活第一个面板项
    const tryActivateFirstItem = () => {
      const firstItem = getFirstItem();
      if (firstItem && firstItem.name !== undefined) {
        setActiveNames([firstItem.name]);
      }
    };

    // 获取第一个面板项
    const getFirstItem = () => {
      // 在Vue3中，我们需要通过其他方式获取子组件信息
      // 这里返回null，实际逻辑应该在子组件中处理
      return null;
    };

    // 切换面板的展开/收起状态
    const setActiveNames = (names) => {
      const activeNamesArray = [].concat(names);
      const value = props.accordion ? activeNamesArray[0] : activeNamesArray;
      activeNames.value = activeNamesArray;
      emit("update:value", value);
      emit("change", value);
    };

    // 处理面板的展开/收起
    const handleItemClick = (item) => {
      if (props.accordion) {
        // 手风琴模式：只保留当前点击的面板
        setActiveNames(
          (activeNames.value[0] || activeNames.value[0] === 0) &&
            activeNames.value[0] === item.name
            ? ""
            : item.name
        );
      } else {
        // 普通模式：可以展开多个面板
        const activeNamesCopy = [...activeNames.value];
        const index = activeNamesCopy.indexOf(item.name);

        if (index > -1) {
          // 如果已展开，则收起
          activeNamesCopy.splice(index, 1);
        } else {
          // 如果未展开，则展开
          activeNamesCopy.push(item.name);
        }

        setActiveNames(activeNamesCopy);
      }
    };

    // 向子组件提供collapse实例方法
    provide("collapse", {
      activeNames,
      handleItemClick,
    });

    // 如果设置了默认激活第一个且当前没有激活的面板，则激活第一个
    if (props.defaultFirst && activeNames.value.length === 0) {
      nextTick(() => {
        tryActivateFirstItem();
      });
    }

    // 当组件更新时，如果仍然没有激活面板且需要默认激活第一个，则尝试激活
    const onUpdate = () => {
      if (props.defaultFirst && activeNames.value.length === 0) {
        nextTick(() => {
          tryActivateFirstItem();
        });
      }
    };

    return {
      activeNames,
      setActiveNames,
      handleItemClick,
      onUpdate,
    };
  },
});
</script>

<style lang="scss" scoped>
.diy-collapse {
}

.diy-collapse-accordion {
  // 手风琴模式样式
}
</style>
