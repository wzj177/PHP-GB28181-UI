好，这里给你一个**适合 Vue3 + TS + Element Plus 简易后台**的 **Tag-View（标签页）完整 Demo**，结构和思路接近常见后台（类似 vue-element-admin 的 tagView），但**代码尽量简洁、可直接用**。

---

## 一、效果说明（你将得到什么）

* 顶部一排 **Tag 标签**
* 路由切换时 **自动新增 / 激活 tag**
* 支持：

  * 关闭当前
  * 关闭其他
  * 关闭全部
* 刷新页面 tag 仍存在（基于 pinia，可很容易改成 localStorage）

---

## 二、整体结构

```txt
src/
├─ layout/
│  ├─ Layout.vue
│  └─ components/
│     └─ TagView.vue
├─ store/
│  └─ tagView.ts
├─ router/
│  └─ index.ts
```

---

## 三、路由示例（router/index.ts）

> 关键点：**meta.title 必须有**

```ts
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import Layout from '@/layout/Layout.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '仪表盘' }
      },
      {
        path: 'user',
        component: () => import('@/views/User.vue'),
        meta: { title: '用户管理' }
      }
    ]
  }
]

export default createRouter({
  history: createWebHistory(),
  routes
})
```

---

## 四、TagView Store（pinia）

### `store/tagView.ts`

```ts
import { defineStore } from 'pinia'
import type { RouteLocationNormalizedLoaded } from 'vue-router'

export interface TagView {
  path: string
  title: string
}

export const useTagViewStore = defineStore('tagView', {
  state: () => ({
    tags: [] as TagView[],
    activePath: ''
  }),

  actions: {
    addTag(route: RouteLocationNormalizedLoaded) {
      if (!route.meta.title) return

      const exists = this.tags.find(t => t.path === route.path)
      if (!exists) {
        this.tags.push({
          path: route.path,
          title: route.meta.title as string
        })
      }
      this.activePath = route.path
    },

    removeTag(path: string) {
      this.tags = this.tags.filter(t => t.path !== path)
    },

    removeOthers(path: string) {
      this.tags = this.tags.filter(t => t.path === path)
    },

    removeAll() {
      this.tags = []
      this.activePath = ''
    }
  }
})
```

---

## 五、TagView 组件（核心）

### `layout/components/TagView.vue`

```vue
<template>
  <div class="tag-view">
    <el-scrollbar>
      <div class="tags">
        <el-tag
          v-for="tag in store.tags"
          :key="tag.path"
          :closable="tag.path !== '/dashboard'"
          :effect="tag.path === store.activePath ? 'dark' : 'plain'"
          @click="go(tag.path)"
          @close="close(tag.path)"
        >
          {{ tag.title }}
        </el-tag>
      </div>
    </el-scrollbar>

    <el-dropdown>
      <el-button size="small">
        更多 <el-icon><ArrowDown /></el-icon>
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item @click="closeOthers">关闭其他</el-dropdown-item>
          <el-dropdown-item @click="closeAll">关闭全部</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { ArrowDown } from '@element-plus/icons-vue'
import { useTagViewStore } from '@/store/tagView'

const router = useRouter()
const route = useRoute()
const store = useTagViewStore()

const go = (path: string) => {
  router.push(path)
}

const close = (path: string) => {
  store.removeTag(path)
  if (store.activePath === path) {
    const last = store.tags.at(-1)
    router.push(last ? last.path : '/dashboard')
  }
}

const closeOthers = () => {
  store.removeOthers(store.activePath)
}

const closeAll = () => {
  store.removeAll()
  router.push('/dashboard')
}
</script>

<style scoped>
.tag-view {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  background: #fff;
  border-bottom: 1px solid #eee;
}
.tags {
  display: flex;
  gap: 8px;
  margin-right: 10px;
}
</style>
```

---

## 六、Layout 中使用 TagView

### `layout/Layout.vue`

```vue
<template>
  <div class="layout">
    <TagView />
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import TagView from './components/TagView.vue'
import { useTagViewStore } from '@/store/tagView'

const route = useRoute()
const store = useTagViewStore()

watch(
  () => route.fullPath,
  () => {
    store.addTag(route)
  },
  { immediate: true }
)
</script>
```

---

## 七、你可以很容易再扩展的点（我猜你马上会要）

* ✅ **右键菜单（关闭左侧 / 右侧）**
* ✅ **固定 tag（affix）**
* ✅ **localStorage 持久化**
* ✅ **iframe 页面 tag**
* ✅ **刷新当前 tag**

如果你愿意，我可以下一步直接帮你做：

> **「支持 affix 固定 + 右键菜单 + 缓存 keep-alive 的完整版 tag-view」**

你现在这个后台是 **多级路由 + keep-alive** 吗？我可以按你的真实结构给你定制一版。
