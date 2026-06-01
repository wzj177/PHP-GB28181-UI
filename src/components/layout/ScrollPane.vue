<template>
  <div
    ref="scrollContainerRef"
    class="scroll-container"
  >
    <div
      ref="scrollWrapperRef"
      class="scroll-wrapper"
      @DOMMouseScroll="handleScroll"
      @mousewheel="handleScroll"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const emits = defineEmits(['scroll'])

const scrollContainerRef = ref<HTMLElement>()
const scrollWrapperRef = ref<HTMLElement>()

const handleScroll = (e: WheelEvent) => {
  const eventDelta = e.wheelDelta || -e.deltaY * 40
  const scrollWrapper = scrollWrapperRef.value
  if (!scrollWrapper) return
  scrollWrapper.scrollLeft = scrollWrapper.scrollLeft + eventDelta / 4
}

const moveToTarget = (currentTag: HTMLElement) => {
  const container = scrollContainerRef.value
  const wrapper = scrollWrapperRef.value
  if (!container || !wrapper) return

  const containerWidth = container.offsetWidth
  const containerOffsetLeft = container.getBoundingClientRect().left
  const tag = currentTag
  const tagWidth = tag.offsetWidth
  const tagOffsetLeft = tag.getBoundingClientRect().left

  // Adjust tag position
  const left = tagOffsetLeft - containerOffsetLeft + wrapper.scrollLeft - 40
  const right = left + tagWidth

  if (left < 0) {
    wrapper.scrollLeft = left
  } else if (right > containerWidth) {
    wrapper.scrollLeft = right - containerWidth
  }
}

onMounted(() => {
  // Initialize scroll container
})

defineExpose({
  moveToTarget,
  scrollContainerRef
})
</script>

<style lang="scss" scoped>
.scroll-container {
  white-space: nowrap;
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 100%;
  .scroll-wrapper {
    display: inline-block;
    position: absolute;
    height: 100%;
    width: 100%;
  }
}
</style>