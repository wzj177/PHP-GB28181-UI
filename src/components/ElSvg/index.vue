<template>
  <svg
    class="el-svg"
    :class="[`el-svg--${name}`, { 'el-svg--spin': spin }]"
    :style="{
      width: toUnit(size),
      height: toUnit(size),
      color: color
    }"
    aria-hidden="true"
    v-bind="attrs"
  >
    <use :xlink:href="`#icon-${name}`" />
  </svg>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { loadSvg } from './loadSvg'

interface Props {
  name: string
  size?: number | string
  color?: string
  spin?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 16,
  color: '',
  spin: false
})

const attrs = computed(() => ({
  xmlns: 'http://www.w3.org/2000/svg',
  fill: 'currentColor'
}))

const toUnit = (value: number | string): string => {
  if (typeof value === 'number') {
    return `${value}px`
  }
  return value
}

// Load SVG on mount
onMounted(async () => {
  try {
    await loadSvg(props.name)
  } catch (error) {
    console.warn(`Failed to load SVG icon: ${props.name}`, error)
  }
})
</script>

<style scoped lang="scss">
.el-svg {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;

  &--spin {
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
