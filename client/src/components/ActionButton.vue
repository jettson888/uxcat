<template>
  <button 
    class="action-button" 
    :class="buttonClass" 
    @click="handleClick"
    :disabled="disabled"
  >
    <i v-if="iconClass" class="iconfont" :class="iconClass" />
    <span>{{ text }}</span>
  </button>
</template>

<script>
export default {
  name: 'ActionButton',
  props: {
    text: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      default: 'primary',
    },
    iconClass: {
      type: String,
      default: '',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    buttonClass() {
      return `btn-${this.type}`;
    },
  },
  methods: {
    handleClick(event) {
      this.$emit('click', event);
    },
  },
};
</script>

<style scoped>
.action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
  outline: none;
}

.action-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #007AFF;
  color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0062CC;
}

.btn-secondary {
  background-color: #F2F2F7;
  color: #333;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #E5E5EA;
}

.action-button i {
  margin-right: 8px;
  font-size: 16px;
}
</style>