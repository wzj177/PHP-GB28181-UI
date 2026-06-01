<template>
  <div class="tags-view-container">
    <scroll-pane ref="scrollPaneRef" class="tags-view-wrapper">
      <router-link v-for="tag in visitedViews" ref="tagRefs" :key="tag.path" :class="isActive(tag) ? 'active' : ''"
        :to="tag.fullPath || tag.path" class="tags-view-item"
        @click.middle="!isAffix(tag) ? closeSelectedTag(tag) : ''" @contextmenu.prevent="openMenu(tag, $event)">
        {{ tag.title }}
        <el-icon v-if="!isAffix(tag)" class="close-icon" @click.prevent.stop="closeSelectedTag(tag)">
          <Close />
        </el-icon>
      </router-link>
    </scroll-pane>
    <ul v-show="visible" :style="{ left: left + 'px', top: top + 'px' }" class="contextmenu">
      <li @click="refreshSelectedTag(selectedTag)">
        <el-icon>
          <Refresh />
        </el-icon>
        <span>刷新</span>
      </li>
      <li v-if="!isAffix(selectedTag)" @click="closeSelectedTag(selectedTag)">
        <el-icon>
          <Close />
        </el-icon>
        <span>关闭</span>
      </li>
      <li @click="closeOthersTags">
        <el-icon>
          <CircleClose />
        </el-icon>
        <span>关闭其他</span>
      </li>
      <li v-if="!isAffix(selectedTag)" @click="closeAllTags(selectedTag)">
        <el-icon>
          <SwitchButton />
        </el-icon>
        <span>关闭所有</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed, onMounted, onBeforeUnmount } from 'vue'
// @ts-ignore
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElIcon } from 'element-plus'
import { Close, Refresh, CircleClose, SwitchButton } from '@element-plus/icons-vue'
import ScrollPane from './ScrollPane.vue'

interface Tag {
  fullPath: string;
  path: string;
  title: string;
  name?: string;
  affix?: boolean;
  noCache?: boolean;
}

const router = useRouter()
const route = useRoute()

const scrollPaneRef = ref()
const tagRefs = ref<any[]>([])
const visible = ref(false)
const top = ref(0)
const left = ref(0)
const selectedTag = ref<Tag>({} as Tag)
const affixTags = ref<Tag[]>([])

// Store views - these can come from pinia or other store
// For now, using reactive values
import { useTagsViewStore } from '@/stores/tagsView'

const store = useTagsViewStore()

// Computed properties using the store
const visitedViews = computed(() => store.visitedViews)
const cachedViews = computed(() => store.cachedViews)

// Functions
const isActive = (tag: Tag) => {
  return tag.path === route.path
}

const isAffix = (tag: Tag) => {
  return tag.affix
}

const filterAffixTags = (routes: any[], basePath = '/') => {
  let tags: Tag[] = []
  routes.forEach(route => {
    if (route.meta && route.meta.affix) {
      const tagPath = basePath + route.path
      tags.push({
        fullPath: tagPath,
        path: tagPath,
        name: route.name as string,
        title: (route.meta?.title as string) || 'no-name',
        affix: true
      })
    }
    if (route.children) {
      const childTags = filterAffixTags(route.children, basePath + route.path + '/')
      tags = tags.concat(childTags)
    }
  })
  return tags
}

const initTags = () => {
  const affixTagsTemp = filterAffixTags(router.getRoutes())
  for (const tag of affixTagsTemp) {
    if (tag.name) {
      store.addView(tag)
    }
  }
  affixTags.value = affixTagsTemp
}

const addTags = () => {
  const routeData = route
  const { name } = routeData
  if (name && routeData.meta?.title) {
    store.addView({
      name: name as string,
      title: routeData.meta.title as string,
      path: routeData.path,
      fullPath: routeData.fullPath,
      affix: !!routeData.meta?.affix,
      noCache: !!routeData.meta?.noCache
    })
  }
}

const updateVisitedView = () => {
  store.updateVisitedView({
    name: route.name as string,
    title: route.meta?.title as string,
    path: route.path,
    fullPath: route.fullPath
  })
}

const refreshSelectedTag = (view: Tag) => {
  store.delCachedView(view)
  const { fullPath } = view
  nextTick(() => {
    router.go(0) // Refresh current page
  })
}

const closeSelectedTag = (view: Tag) => {
  store.delView(view)
  if (isActive(view)) {
    const latestView = visitedViews.value.slice(-1)[0]
    if (latestView) {
      router.push(latestView.fullPath)
    } else {
      router.push('/')
    }
  }
}

const closeOthersTags = () => {
  const currentTag = selectedTag.value
  if (currentTag.name) {
    router.push(currentTag.path)
    store.delOtherViews(currentTag)
    nextTick(() => {
      if (scrollPaneRef.value) {
        scrollPaneRef.value.moveToTarget(tagRefs.value)
      }
    })
  }
}

const closeAllTags = (view: Tag) => {
  store.delAllViews(view)
  if (affixTags.value.some(tag => tag.path === route.path)) {
    // to affix tags
  } else {
    router.push('/')
  }
}

const openMenu = (tag: Tag, e: MouseEvent) => {
  const menuMinWidth = 105
  const containerEl = scrollPaneRef.value?.scrollContainerRef
  if (!containerEl) return

  const offsetLeft = containerEl.getBoundingClientRect().left
  const offsetWidth = containerEl.offsetWidth
  const maxLeft = offsetWidth - menuMinWidth
  const leftValue = e.clientX - offsetLeft

  // 计算菜单位置 - 显示在鼠标位置下方，并增加一点间距
  left.value = leftValue > maxLeft ? maxLeft : leftValue
  top.value = e.clientY + 10 // 在鼠标下方 10px
  visible.value = true
  selectedTag.value = tag
}

const closeMenu = () => {
  visible.value = false
}

const handleScroll = () => {
  closeMenu()
}

// Watch for route changes to update tags
watch(
  () => route.fullPath,
  () => {
    addTags()
    updateVisitedView()
  },
  { immediate: true }
)

// Lifecycle hooks
onMounted(() => {
  initTags()
  addTags()
  document.body.addEventListener('click', closeMenu)
})

onBeforeUnmount(() => {
  document.body.removeEventListener('click', closeMenu)
})
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.tags-view-container {
  position: relative;
  height: 34px;
  width: 100%;
  background: var(--bg-panel);
  border-bottom: 1px solid var(--border-base);
  transition: background 0.3s, border-color 0.3s;

  .tags-view-wrapper {
    .tags-view-item {
      display: inline-block;
      position: relative;
      cursor: pointer;
      text-decoration: none;
      height: 26px;
      line-height: 26px;
      border: 1px solid var(--border-base);
      color: var(--text-muted);
      background: var(--bg-hover);
      padding: 0 8px;
      font-size: 12px;
      margin-left: 5px;
      margin-top: 4px;
      border-radius: 4px;
      transition: all 0.2s;

      &:first-of-type {
        margin-left: 15px;
      }

      &:last-of-type {
        margin-right: 15px;
      }

      &:hover {
        background: var(--bg-active);
        color: var(--text-main);
      }

      &.active {
        background-color: $primary;
        color: #fff;
        border-color: $primary;

        &::before {
          content: '';
          background: #fff;
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          position: relative;
          margin-right: 2px;
        }
      }
    }

    .close-icon {
      width: 14px;
      height: 14px;
      margin-left: 4px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      vertical-align: middle;
      transition: all 0.2s;

      &:hover {
        background-color: rgba(255, 255, 255, 0.3);
        transform: scale(1.1);
      }
    }
  }

  .contextmenu {
    margin: 0;
    background: var(--bg-panel);
    border: 1px solid var(--border-base);
    z-index: 3000;
    position: absolute;
    list-style-type: none;
    padding: 5px 0;
    border-radius: $radius-base;
    font-size: 12px;
    font-weight: 400;
    color: var(--text-main);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

    li {
      margin: 0;
      padding: 7px 16px;
      cursor: pointer;
      transition: background 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;

      &:hover {
        background: var(--bg-hover);
      }

      .el-icon {
        font-size: 14px;
      }
    }
  }
}
</style>
