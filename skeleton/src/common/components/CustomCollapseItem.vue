<template>
  <div class="custom-collapse-item" :class="{ 'is-active': isActive }">
    <div
      class="custom-collapse-item__header"
      @click="handleHeaderClick"
      :tabindex="disabled ? undefined : 0"
      :aria-expanded="isActive"
      :aria-controls="`custom-collapse-content-${name}`"
    >
      <el-icon style="margin: 0 16px">
        <CaretBottom v-if="isActive" />
        <CaretRight v-else />
      </el-icon>
      <div class="custom-collapse-item__title">
        <slot name="title">{{ title }}</slot>
      </div>
      <div class="custom-collapse-item__extra">
        <slot name="extra"></slot>
      </div>
    </div>
    <div
      class="custom-collapse-item__wrap"
      :aria-hidden="!isActive"
    >
      <div class="custom-collapse-item__content">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "CustomCollapseItem",
  props: {
    name: {
      type: [String, Number],
      default: () => Math.random().toString(36).substring(2, 10),
    },
    title: {
      type: String,
      default: "",
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  inject: ["collapse"],
  data() {
    return {
      contentHeight: 0,
    };
  },
  computed: {
    isActive() {
      return this.collapse.activeNames.indexOf(this.name) > -1;
    },
  },
  methods: {
    handleHeaderClick() {
      if (this.disabled) return;
      this.collapse.handleItemClick(this.name);
    },
  },
};
</script>

<style lang="scss" scoped>
.custom-collapse-item {
  &.is-active {
    border-bottom: 1px solid #efefef;

    .custom-collapse-item__header {
      color: #409eff;
    }
  }
}

.custom-collapse-item__header {
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
}

.custom-collapse-item.is-active .custom-collapse-item__header {
  border-bottom: 1px solid #efefef;
}

.custom-collapse-item__extra {
  margin-left: 8px;
}

.custom-collapse-item__wrap {
  will-change: height;
  overflow: hidden;
  transition: height 0.3s ease-in-out;
}

.custom-collapse-item__header[aria-expanded="false"]
  + .custom-collapse-item__wrap {
  height: 0;
}

.custom-collapse-item__header[aria-expanded="true"]
  + .custom-collapse-item__wrap {
  height: auto;
}
</style>
