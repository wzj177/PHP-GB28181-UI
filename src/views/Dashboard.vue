<template>
  <div class="welcome-page">
    <div class="welcome-content">
      <h1 class="welcome-title">欢迎使用系统</h1>
      <div class="clock-display">
        <div class="clock-time">{{ clockTime }}</div>
        <div class="clock-date">{{ clockDate }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const clockTime = ref('')
const clockDate = ref('')
let timer: ReturnType<typeof setInterval> | null = null

const updateClock = () => {
  const now = new Date()
  clockTime.value = now.toLocaleTimeString('zh-CN', { hour12: false })
  clockDate.value = now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
}

onMounted(() => {
  updateClock()
  timer = setInterval(updateClock, 1000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.welcome-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 40px;
  background: var(--bg-hover);
}

.welcome-content {
  text-align: center;
}

.welcome-title {
  font-size: 36px;
  font-weight: 300;
  color: var(--text-main);
  margin: 0 0 40px;
  letter-spacing: 2px;
}

.clock-display {
  .clock-time {
    font-size: 72px;
    font-weight: 200;
    color: var(--text-main);
    font-variant-numeric: tabular-nums;
    line-height: 1.1;
    letter-spacing: 4px;
  }

  .clock-date {
    font-size: 18px;
    color: var(--text-muted);
    margin-top: 12px;
    font-weight: 300;
  }
}
</style>