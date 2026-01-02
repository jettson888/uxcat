<template>
  <div class="custom-collapse">
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: 'CustomCollapse',
  props: {
    modelValue: {
      type: [Array, String, Number],
      default: () => []
    },
    accordion: {
      type: Boolean,
      default: false
    },
  },
  emits: ['update:modelValue', 'change'],
  data() {
    return {
      activeNames: []
    }
  },
  watch: {
    modelValue: {
      immediate: true,
      handler(val) {
        this.activeNames = Array.isArray(val) ? val : [val]
      }
    }
  },
  methods: {
    setActiveNames(activeNames) {
      activeNames = [].concat(activeNames)
      const value = this.accordion ? activeNames[0] : activeNames
      this.activeNames = activeNames
      this.$emit('update:modelValue', value)
      this.$emit('change', value)
    },
    handleItemClick(name) {
      if (this.accordion) {
        const activeNames = (this.activeNames[0] || this.activeNames[0] === 0) && this.activeNames[0] === name 
          ? [] 
          : [name]
        this.setActiveNames(activeNames)
      } else {
        const activeNames = this.activeNames.slice(0)
        const index = activeNames.indexOf(name)
        if (index > -1) {
          activeNames.splice(index, 1)
        } else {
          activeNames.push(name)
        }
        this.setActiveNames(activeNames)
      }
    }
  },
  provide() {
    return {
      collapse: this
    }
  }
}
</script>

<style scoped>
.custom-collapse {
  
}
</style>
