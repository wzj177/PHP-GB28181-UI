<template>
  <ElDialog
    :model-value="visible"
    title="坐标拾取"
    width="900px"
    top="5vh"
    @update:model-value="handleClose"
  >
    <div class="coordinate-picker-container">
      <div class="iframe-wrapper">
        <iframe
          :src="baiduMapUrl"
          frameborder="0"
          class="map-iframe"
        ></iframe>
      </div>
    </div>

    <template #footer>
      <ElButton @click="handleClose">关闭</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const baiduMapUrl = 'https://lbs.baidu.com/maptool/getpoint'

const handleClose = () => {
  emit('update:modelValue', false)
}
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.coordinate-picker-container {
  height: 600px;

  .iframe-wrapper {
    width: 100%;
    height: 100%;

    .map-iframe {
      width: 100%;
      height: 100%;
      border-radius: $radius-base;
      border: 1px solid var(--border-base);
    }
  }
}
</style>
