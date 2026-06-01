<template>
  <div
    v-show="localVisible && !isMinimized"
    ref="dialogWrapperRef"
    class="dialog-wrapper"
    :class="{ 'dialog-maximized': isMaximized }"
    :style="{
      top: isMaximized ? '0' : dialogStyle.top,
      left: isMaximized ? '0' : dialogStyle.left,
      width: isMaximized ? '100vw' : dialogStyle.width,
      height: isMaximized ? '100vh' : dialogStyle.height,
      zIndex: zIndex
    }"
    @mousedown="bringToFront"
  >
    <div
      ref="dialogHeaderRef"
      class="dialog-header"
      @mousedown="startDrag"
    >
      <span class="dialog-title">云台控制（PTZ）</span>
      <div class="dialog-controls">
        <button
          class="dialog-btn"
          @click="minimizeDialog"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 1024 1024"
          >
            <path d="M1024 810.666667H0l34.133333-42.666667h955.733334l34.133333 42.666667z" />
          </svg>
        </button>
        <button
          class="dialog-btn"
          @click="toggleMaximize"
        >
          <svg
            v-if="!isMaximized"
            width="12"
            height="12"
            viewBox="0 0 1024 1024"
          >
            <path
              d="M725.333333 725.333333H298.666667V298.666667h426.666666v426.666666z m-42.666666-42.666666V341.333333H341.333333v341.333334h341.333334z m85.333333-469.333333H170.666667c-47.061333 0-85.333333 38.272-85.333334 85.333333v597.333334c0 47.061333 38.272 85.333333 85.333334 85.333333h682.666666c47.061333 0 85.333333-38.272 85.333334-85.333333V298.666667c0-47.061333-38.272-85.333333-85.333334-85.333333z"
            />
          </svg>
          <svg
            v-else
            width="12"
            height="12"
            viewBox="0 0 1024 1024"
          >
            <path
              d="M896 640h-128v128H512V512h256V128h128v512z m-640 0V128H128v512H384V512H256V256h384v128h128v128H256z"
            />
          </svg>
        </button>
        <button
          class="dialog-btn close-btn"
          @click="handleClose"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 1024 1024"
          >
            <path
              d="M512 469.651304l302.638948-302.638948 65.361052 65.361052L577.361052 535.012354l302.638948 302.638948-65.361052 65.361052L512 599.651304l-302.638948 302.638948-65.361052-65.361052L446.638948 535.012354 144 232.373406l65.361052-65.361052L512 469.651304z"
            />
          </svg>
        </button>
      </div>
    </div>
    <div class="dialog-body">
      <PTZControlPanel :channel-id="props.channelId" />
    </div>
  </div>
  <!-- Minimized window indicator -->
  <div
    v-if="localVisible && isMinimized"
    class="minimized-indicator"
    :style="{ zIndex: zIndex }"
    @click="restoreDialog"
  >
    <div class="minimized-content">
      <span class="minimized-title">云台控制（PTZ）</span>
      <button
        class="dialog-btn close-btn"
        @click.stop="handleClose"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 1024 1024"
        >
          <path
            d="M512 469.651304l302.638948-302.638948 65.361052 65.361052L577.361052 535.012354l302.638948 302.638948-65.361052 65.361052L512 599.651304l-302.638948 302.638948-65.361052-65.361052L446.638948 535.012354 144 232.373406l65.361052-65.361052L512 469.651304z"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import PTZControlPanel from './PTZControlPanel.vue'

interface Props {
  modelValue: boolean
  channelId?: string
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  channelId: ''
})

const emit = defineEmits<Emits>()

const localVisible = ref(props.modelValue)
const isMaximized = ref(false)
const isMinimized = ref(false)
const dialogStyle = ref({
  top: '100px',
  left: '100px',
  width: '840px',
  height: '600px'
})
const startPos = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const zIndex = ref(2000)
const maxZIndex = ref(2000)

// DOM refs
const dialogWrapperRef = ref<HTMLElement | null>(null)
const dialogHeaderRef = ref<HTMLElement | null>(null)

// Watch for changes to the model value
watch(() => props.modelValue, (newVal) => {
  localVisible.value = newVal
  if (newVal && !isMaximized.value) {
    // Position dialog in a visible area
    nextTick(() => {
      autoPositionDialog()
    })
  }
})

// Watch for changes to localVisible
watch(localVisible, (newVal) => {
  if (newVal !== props.modelValue) {
    emit('update:modelValue', newVal)
  }
})

// Auto position the dialog to be visible
const autoPositionDialog = () => {
  if (dialogWrapperRef.value) {
    const dialogWidth = dialogWrapperRef.value.offsetWidth
    const dialogHeight = dialogWrapperRef.value.offsetHeight
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight

    // Position slightly offset from the top-left
    const left = Math.max(20, Math.min(windowWidth - dialogWidth - 20, 100))
    const top = Math.max(20, Math.min(windowHeight - dialogHeight - 20, 100))

    dialogStyle.value.left = `${left}px`
    dialogStyle.value.top = `${top}px`
    dialogStyle.value.width = '840px'
    dialogStyle.value.height = '600px'
  }
}

// Drag functionality
const startDrag = (e: MouseEvent) => {
  if (isMaximized.value) return // Can't drag when maximized

  isDragging.value = true
  startPos.value = {
    x: e.clientX - Number(dialogStyle.value.left.replace('px', '')),
    y: e.clientY - Number(dialogStyle.value.top.replace('px', ''))
  }

  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

const onDrag = (e: MouseEvent) => {
  if (!isDragging.value) return

  const left = e.clientX - startPos.value.x
  const top = e.clientY - startPos.value.y

  // Boundary checks
  const boundedLeft = Math.max(0, Math.min(left, window.innerWidth - parseInt(dialogStyle.value.width)))
  const boundedTop = Math.max(0, Math.min(top, window.innerHeight - parseInt(dialogStyle.value.height)))

  dialogStyle.value.left = `${boundedLeft}px`
  dialogStyle.value.top = `${boundedTop}px`
}

const stopDrag = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

// Maximize/restore functionality
const toggleMaximize = () => {
  isMaximized.value = !isMaximized.value
  if (!isMaximized.value) {
    // Restore to previous size
    dialogStyle.value.width = '840px'
    dialogStyle.value.height = '600px'
    autoPositionDialog()
  }
}

// Minimize functionality (just hide)
const minimizeDialog = () => {
  isMinimized.value = true
}

// Bring dialog to front
const bringToFront = () => {
  maxZIndex.value++
  zIndex.value = maxZIndex.value
}

// Restore dialog from minimized state
const restoreDialog = () => {
  isMinimized.value = false
  bringToFront()
}

// Dialog functions
const handleClose = () => {
  // If dialog is minimized, close the minimized indicator too
  isMinimized.value = false
  emit('update:modelValue', false)
  emit('close')
}

// Clean up event listeners
onUnmounted(() => {
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
})
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.dialog-wrapper {
  position: fixed;
  background: $bg-panel;
  border: 1px solid $border-base;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dialog-maximized {
  border-radius: 0;
  box-shadow: none;
}

.dialog-header {
  height: 40px;
  background: $bg-active;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  cursor: move;
  user-select: none;
  border-bottom: 1px solid $border-base;
}

.dialog-title {
  color: $text-main;
  font-size: 14px;
  font-weight: 500;
}

.dialog-controls {
  display: flex;
  gap: 8px;
}

.dialog-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: $text-main;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;

  &:hover {
    background: $bg-hover;
  }

  &.close-btn:hover {
    background: #ff6b6b;
    color: white;
  }
}

.dialog-body {
  flex: 1;
  overflow: auto;
  background: $bg-panel;
}

/* Scrollbar styling to match theme */
.dialog-body::-webkit-scrollbar {
  width: 8px;
}

.dialog-body::-webkit-scrollbar-track {
  background: $bg-panel;
}

.dialog-body::-webkit-scrollbar-thumb {
  background: $border-light;
  border-radius: 4px;
}

.dialog-body::-webkit-scrollbar-thumb:hover {
  background: $border-base;
}

/* Minimized indicator */
.minimized-indicator {
  position: fixed;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  background: $bg-active;
  border: 1px solid $border-base;
  border-radius: 20px;
  padding: 6px 12px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  user-select: none;
  transition: all 0.2s ease;

  &:hover {
    background: $bg-hover;
    transform: translateX(-50%) scale(1.02);
  }
}

.minimized-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.minimized-title {
  color: $text-main;
  font-size: 12px;
  white-space: nowrap;
}
</style>
