<script setup lang="ts">
import { ref, computed, markRaw } from 'vue'
import { ElPopover, ElInput, ElScrollbar, ElIcon, ElButton } from 'element-plus'
import * as ElementPlusIcons from '@element-plus/icons-vue'

const props = defineProps<{
  modelValue?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

// 常用图标列表 - 从导入的图标中筛选出常用的
const iconList = Object.keys(ElementPlusIcons).filter(key => {
  // 过滤掉一些不太常用的图标
  const excludeList = ['iconName', 'componentName', 'default', 'install', 'version']
  return !excludeList.includes(key)
})

const searchQuery = ref('')
const popoverVisible = ref(false)

// 过滤后的图标列表
const filteredIcons = computed(() => {
  if (!searchQuery.value) return iconList
  return iconList.filter(icon =>
    icon.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// 当前选中的图标
const currentIcon = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// 选择图标
const selectIcon = (icon: string) => {
  currentIcon.value = icon
  popoverVisible.value = false
}

// 清除图标
const clearIcon = () => {
  currentIcon.value = ''
  popoverVisible.value = false
}

// 获取图标组件
const getIconComponent = (iconName: string) => {
  // @ts-ignore - 动态获取图标组件
  const icon = ElementPlusIcons[iconName]
  return icon ? markRaw(icon) : null
}
</script>

<template>
  <div class="icon-selector">
    <ElPopover
      v-model:visible="popoverVisible"
      placement="bottom-start"
      :width="380"
      trigger="click"
      :show-arrow="false"
      popper-class="icon-selector-popper"
    >
      <template #reference>
        <ElInput
          :model-value="currentIcon"
          placeholder="请选择图标"
          readonly
          clearable
          @clear="clearIcon"
          class="icon-selector-input"
        >
          <template #prefix>
            <ElIcon v-if="currentIcon && getIconComponent(currentIcon)" :size="18" color="var(--el-color-primary)">
              <component :is="getIconComponent(currentIcon)" />
            </ElIcon>
            <ElIcon v-else :size="18" color="var(--el-text-color-placeholder)">
              <component :is="getIconComponent('Menu')" />
            </ElIcon>
          </template>
        </ElInput>
      </template>

      <div class="icon-selector-panel" @click.stop>
        <!-- 搜索框 -->
        <ElInput
          v-model="searchQuery"
          placeholder="搜索图标..."
          clearable
          size="small"
          style="margin-bottom: 12px"
        />

        <!-- 图标列表 -->
        <ElScrollbar :height="300">
          <div class="icon-grid">
            <div
              v-for="icon in filteredIcons"
              :key="icon"
              class="icon-item"
              :class="{ 'is-selected': currentIcon === icon }"
              @click="selectIcon(icon)"
            >
              <div class="icon-wrapper">
                <ElIcon :size="20">
                  <component :is="getIconComponent(icon)" />
                </ElIcon>
              </div>
              <span class="icon-name" :title="icon">{{ icon }}</span>
            </div>
          </div>

          <div v-if="filteredIcons.length === 0" class="icon-empty">
            未找到匹配的图标
          </div>
        </ElScrollbar>

        <!-- 清除按钮 -->
        <div v-if="currentIcon" class="icon-actions">
          <el-button size="small" @click="clearIcon" style="width: 100%">
            清除已选图标 ({{ currentIcon }})
          </el-button>
        </div>
      </div>
    </ElPopover>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.icon-selector {
  width: 100%;

  :deep(.el-input__wrapper) {
    cursor: pointer;
  }

  :deep(.el-input__inner) {
    cursor: pointer;
  }

  // 隐藏输入框中的文字值，只显示图标和清除按钮
  :deep(.icon-selector-input) {
    .el-input__inner {
      text-indent: -9999px;
    }
  }

  .icon-selector-panel {
    padding: 12px;
  }

  .icon-actions {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}
  .icon-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 8px;
  }

  .icon-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 12px 8px;
    border: 1px solid var(--el-border-color);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    background: var(--el-bg-color);
    min-height: 70px;
    gap: 8px;

    &:hover {
      border-color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
    }

    &.is-selected {
      border-color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);

      .icon-wrapper {
        background: var(--el-color-primary);
        color: white;
      }

      .icon-name {
        color: var(--el-color-primary);
        font-weight: 600;
      }
    }
  }

  .icon-wrapper {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    background: var(--el-fill-color-light);
    transition: all 0.2s ease;

    .el-icon {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .icon-name {
    font-size: 12px;
    color: var(--el-text-color-regular);
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 100%;
    line-height: 1.2;
  }

  .icon-empty {
    text-align: center;
    padding: 40px 0;
    color: var(--el-text-color-secondary);
    font-size: 14px;
  }
</style>

<style>
.icon-selector-popper {
  padding: 0 !important;
}

.icon-selector-popper .el-select-dropdown__wrap {
  max-height: none !important;
}

.icon-selector-popper .el-scrollbar__wrap {
  max-height: 300px !important;
}
</style>
