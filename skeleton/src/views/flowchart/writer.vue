<template>
  <div class="typewriter">
    <span>{{ displayText }}</span>
    <span class="cursor" :class="{ 'cursor-active': isTyping }">|</span>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";

const props = defineProps({
  text: {
    type: String,
    default: "",
  },
  speed: {
    type: Number,
    default: 100,
  },
  delay: {
    type: Number,
    default: 1000,
  },
  loop: {
    type: Boolean,
    default: false,
  },
});

const displayText = ref("");
const currentIndex = ref(0);
const isTyping = ref(true);

watch(
  () => props.text,
  (newText, oldText) => {
    if (newText !== oldText) {
      reset();
    }
  }
);

// 生命周期钩子
onMounted(() => {
  setTimeout(() => {
    type();
  }, props.delay);
});

const type = () => {
  if (currentIndex.value < props.text.length) {
    displayText.value += props.text.charAt(currentIndex.value);
    currentIndex.value++;
    setTimeout(type, props.speed);
  } else {
    isTyping.value = false;
    if (props.loop) {
      setTimeout(reset, props.delay * 2);
    }
  }
};

const reset = () => {
  displayText.value = "";
  currentIndex.value = 0;
  isTyping.value = true;
  type();
};
</script>

<style scoped>
.typewriter {
  display: inline-block;
}

.cursor {
  opacity: 1;
  animation: blink 0.7s infinite;
}

.cursor-active {
  animation: none;
  opacity: 1;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
</style>
