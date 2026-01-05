<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ElMenu,
  ElMenuItem,
  ElSubMenu,
  ElIcon,
  ElAvatar,
  ElDropdown,
  ElDropdownMenu,
  ElDropdownItem,
  ElMessage,
  ElMessageBox,
  ElDivider
} from 'element-plus'
import {
  Monitor,
  VideoCamera,
  Bell,
  MapLocation,
  House,
  Fold,
  Expand,
  ArrowDown,
  User,
  Setting,
  SwitchButton,
  DataAnalysis,
  VideoPlay,
  Film,
  Sunny,
  Moon,
  Clock
} from '@element-plus/icons-vue'
import TagsView from './TagsView.vue'
import { loadMenuData, MenuItem } from '@/utils/routeUtils'
import { useTagsViewStore } from '@/stores/tagsView'
import { useThemeStore } from '@/stores/theme'
import { useSystemInfoStore } from '@/stores/systemInfo'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const tagsViewStore = useTagsViewStore()
const themeStore = useThemeStore()
const systemInfoStore = useSystemInfoStore()
const userStore = useUserStore()

// Navigation items - load from menu.json
const navItems = ref<MenuItem[]>([])

// Filter menu items by type - only show 'menu' and 'directory' types in sidebar
// 'path' and 'api' types are hidden from menu but still have routes loaded
const visibleNavItems = computed<MenuItem[]>(() => {
  return navItems.value
    .filter(item => !item.type || item.type === 'menu' || item.type === 'directory')
    .map(item => ({
      ...item,
      // Also filter children by type
      children: item.children?.filter(child =>
        !child.type || child.type === 'menu' || child.type === 'directory'
      )
    }))
})

// 主题图标计算
const themeIcon = computed(() => {
  if (themeStore.themeMode === 'auto') return Clock
  return themeStore.currentTheme === 'light' ? Sunny : Moon
})

// 主题提示文本
const themeTooltip = computed(() => {
  if (themeStore.themeMode === 'auto') {
    return `自动模式 (当前: ${themeStore.currentTheme === 'light' ? '亮色' : '暗色'})`
  }
  return themeStore.currentTheme === 'light' ? '亮色模式' : '暗色模式'
})

// Load menu data on component mount
onMounted(async () => {
  try {
    const menuData = await loadMenuData()
    navItems.value = menuData.filter(item => !item.parentId || item.parentId === 0)
  } catch (error) {
    console.error('Failed to load navigation menu:', error)
    ElMessage.error('加载导航菜单失败')
  }
})

// Note: TagsView 组件内部已经处理了路由监听和 tag 添加
// 这里不需要重复监听，避免代码冗余

// Get icon component - supports all Element Plus icons
const getIconComponent = (iconName?: string) => {
  if (!iconName) return Monitor

  // 将图标名转换为 PascalCase (如 video-camera -> VideoCamera)
  const pascalCase = iconName
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')

  // 图标映射表 - 支持所有已导入的图标
  const iconMap: Record<string, any> = {
    // 基础图标
    'House': House,
    'Home': House,
    'Monitor': Monitor,
    'VideoCamera': VideoCamera,
    'Camera': VideoCamera,
    'Bell': Bell,
    'MapLocation': MapLocation,
    'Location': MapLocation,
    'User': User,
    'Setting': Setting,
    'Settings': Setting,

    // 视频相关
    'VideoPlay': VideoPlay,
    'Play': VideoPlay,
    'Film': Film,
    'Movie': Film,
    'DataAnalysis': DataAnalysis,

    // 其他
    'Fold': Fold,
    'Expand': Expand,
    'ArrowDown': ArrowDown,
    'SwitchButton': SwitchButton,
    'Sunny': Sunny,
    'Moon': Moon,
    'Clock': Clock
  }

  // 如果找到对应图标则返回，否则返回默认图标
  return iconMap[pascalCase] || iconMap[iconName] || Monitor
}

// Active menu index - watch route changes
const activeIndex = computed(() => route.name?.toString() || 'dashboard')

// Sidebar collapsed state
const sidebarCollapsed = ref(false)

// Handle menu select
const handleSelect = (index: string, indexPath: string[]) => {
  // index: the selected menu item's id (e.g., "system-stats")
  // indexPath: the full path from root (e.g., ["monitoring", "system-stats"])

  // Find the menu item by ID in visibleNavItems
  let selectedItem: MenuItem | undefined
  for (const item of visibleNavItems.value) {
    if (item.id === index) {
      selectedItem = item
      break
    }
    // Check if it's a child item
    if (item.children) {
      const childItem = item.children.find(child => child.id === index)
      if (childItem) {
        selectedItem = childItem
        break
      }
    }
  }

  if (selectedItem) {
    router.push(selectedItem.path)
  }
}

// User profile data - 从 store 获取
const userDropdownVisible = ref(false)

// Toggle sidebar collapse
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

// Toggle theme
const toggleTheme = () => {
  console.log('NavigationLayout toggleTheme called')
  console.log('Before:', themeStore.themeMode, themeStore.currentTheme)
  themeStore.toggleTheme()
  console.log('After:', themeStore.themeMode, themeStore.currentTheme)
  
  // 手动检查 DOM
  setTimeout(() => {
    const dataTheme = document.documentElement.getAttribute('data-theme')
    const classes = document.documentElement.className
    console.log('DOM check - data-theme:', dataTheme, 'classes:', classes)
  }, 100)
}

// Handle user commands
const handleUserCommand = (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'settings':
      router.push('/settings')
      break
    case 'logout':
      handleLogout()
      break
    case 'theme-toggle':
      toggleTheme()
      break
  }
  userDropdownVisible.value = false
}

// Handle logout
const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      // 清除用户信息和认证数据
      userStore.clearUserInfo()
      ElMessage.success('已退出登录')
      router.push('/login')
    })
    .catch(() => { })
}

// Close dropdown when clicking anywhere else
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.user-profile') && !target.closest('.user-dropdown')) {
    userDropdownVisible.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="layout-container">
    <!-- Sidebar Navigation -->
    <div
      class="sidebar"
      :class="{ collapsed: sidebarCollapsed }"
    >
      <div class="logo">
        <template v-if="!sidebarCollapsed">
          <img v-if="systemInfoStore.systemInfo.platformLogo" :src="systemInfoStore.systemInfo.platformLogo" class="platform-logo" :alt="systemInfoStore.systemInfo.platformName" />
          <h2 v-else>{{ systemInfoStore.systemInfo.platformName }}</h2>
        </template>
        <template v-else>
          <img v-if="systemInfoStore.systemInfo.platformLogo" :src="systemInfoStore.systemInfo.platformLogo" class="platform-logo platform-logo-small" :alt="systemInfoStore.systemInfo.platformShortName" />
          <h2 v-else>{{ systemInfoStore.systemInfo.platformShortName }}</h2>
        </template>
      </div>

      <div class="nav-menu-wrapper">
        <ElMenu
          :default-active="activeIndex"
          class="nav-menu"
          :unique-opened="true"
          @select="handleSelect"
        >
          <template
            v-for="item in visibleNavItems"
            :key="item.id"
          >
            <!-- If the menu item has children, render as a sub-menu -->
            <ElSubMenu
              v-if="item.children && item.children.length > 0"
              :index="item.id"
            >
              <template #title>
                <ElIcon>
                  <component :is="getIconComponent(item.icon || 'Monitor')" />
                </ElIcon>
                <span>{{ item.title }}</span>
              </template>
              <ElMenuItem
                v-for="child in item.children"
                :key="child.id"
                :index="child.id"
              >
                <ElIcon>
                  <component :is="getIconComponent(child.icon || 'Monitor')" />
                </ElIcon>
                <span>{{ child.title }}</span>
              </ElMenuItem>
            </ElSubMenu>
            <!-- If the menu item has no children, render as a regular menu item -->
            <ElMenuItem
              v-else
              :index="item.id"
            >
              <ElIcon>
                <component :is="getIconComponent(item.icon || 'Monitor')" />
              </ElIcon>
              <span>{{ item.title }}</span>
            </ElMenuItem>
          </template>
        </ElMenu>
      </div>

      <!-- Sidebar Footer -->
      <div class="sidebar-footer">     
        <el-dropdown
          v-model:visible="userDropdownVisible"
          placement="bottom-end"
          trigger="click"
          class="user-dropdown"
        >
          <div class="user-profile">
            <div class="user-avatar">
              <ElAvatar
                :size="32"
                :src="userStore.displayAvatar"
              />
            </div>
            <div
              v-show="!sidebarCollapsed"
              class="user-info"
            >
              <div class="user-name">
                {{ userStore.displayName }}
              </div>
              <div class="user-role">
                {{ userStore.displayRole }}
              </div>
            </div>
            <ElIcon
              v-show="!sidebarCollapsed"
              class="dropdown-icon"
            >
              <ArrowDown />
            </ElIcon>
          </div>
          <template #dropdown>
            <el-dropdown-menu class="dropdown-menu">
              <el-dropdown-item @click="handleUserCommand('profile')">
                <ElIcon><User /></ElIcon>
                <span>个人资料</span>
              </el-dropdown-item>
              <el-dropdown-item @click="handleUserCommand('theme-toggle')">
                <el-icon :size="20">
                  <component :is="themeIcon" />
                </el-icon>
                <span>切换主题</span>
              </el-dropdown-item>
              <el-divider />
              <el-dropdown-item @click="handleUserCommand('logout')">
                <ElIcon><SwitchButton /></ElIcon>
                <span>退出登录</span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>

      <!-- Collapse/expand button -->
      <div
        class="collapse-btn"
        @click="toggleSidebar"
      >
        <component
          :is="sidebarCollapsed ? Expand : Fold"
          :size="16"
        />
      </div>
    </div>

    <!-- Main Content Area -->
    <div
      class="main-content"
      :class="{ expanded: sidebarCollapsed }"
    >
      <!-- Tags View for navigation tabs -->
      <TagsView />

      <!-- Router View for page content -->
      <div class="content-wrapper">
        <router-view v-slot="{ Component }">
          <template v-if="Component">
            <transition name="fade">
              <component
                :is="Component"
                :key="route.name"
              />
            </transition>
          </template>
        </router-view>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.layout-container {
  display: flex;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background-color: var(--bg-main);
}

.sidebar {
  width: 240px;
  background: var(--bg-panel);
  color: var(--text-main);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-right: 1px solid var(--border-base);
  transition: width 0.3s ease, background 0.3s ease;
  position: relative;
  flex-shrink: 0;

  &.collapsed {
    width: 56px;

    .logo h2 {
      font-size: 1.2rem;
    }

    .logo .platform-logo {
      max-width: 32px;
      max-height: 32px;
    }

    .user-info,
    .dropdown-icon {
      display: none;
    }

    .user-profile {
      justify-content: center;
      padding: 12px 0;
    }

    .user-avatar {
      margin-right: 0;
    }
  }
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-active);
  border-bottom: 1px solid var(--border-base);
  color: var(--text-main);
  flex-shrink: 0;
  padding: 0 12px;

  h2 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 500;
    color: var(--text-main);
    white-space: nowrap;
  }

  .platform-logo {
    max-height: 40px;
    max-width: 180px;
    object-fit: contain;

    &.platform-logo-small {
      max-height: 32px;
      max-width: 32px;
    }
  }
}

.nav-menu-wrapper {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.nav-menu {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  border-right: none;
  background-color: var(--bg-panel);

  &:hover {
    overflow-y: auto;
  }

  :deep(.el-menu-item),
  :deep(.el-sub-menu__title) {
    height: 48px;
    line-height: 48px;
    color: var(--text-muted);
    background-color: var(--bg-panel);
    border-left: 3px solid transparent;

    .el-icon {
      margin-right: 8px;
    }
  }

  :deep(.el-menu-item):hover,
  :deep(.el-sub-menu__title):hover {
    background-color: var(--bg-hover);
    border-left-color: $primary;
  }

  :deep(.el-menu-item.is-active),
  :deep(.el-sub-menu.is-active > .el-sub-menu__title) {
    background-color: var(--bg-hover);
    color: var(--text-main);
    border-left-color: $primary;
  }

  :deep(.el-sub-menu) {
    .el-menu {
      background-color: var(--bg-panel);
    }

    .el-menu-item {
      padding-left: 56px !important;
      height: 44px;
      line-height: 44px;
    }
  }
}

.sidebar-footer {
  flex-shrink: 0;
  padding-bottom: 4px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  cursor: pointer;
  border-top: 1px solid var(--border-base);
  transition: background-color 0.2s, color 0.2s;
  color: var(--text-muted);

  &:hover {
    background-color: var(--bg-hover);
    color: var(--text-main);
  }

  .el-icon {
    transition: transform 0.3s;
  }

  &:active .el-icon {
    transform: scale(0.9);
  }
}

.user-profile {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  border-top: 1px solid var(--border-base);
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--bg-hover);
  }
}

.user-avatar {
  margin-right: 12px;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-icon {
  color: var(--text-muted);
  flex-shrink: 0;
}

.user-dropdown {
  display: block;
  width: 100%;
}

.dropdown-menu {
  background: var(--bg-panel);
  border: 1px solid var(--border-base);
  border-radius: $radius-base;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  padding: 4px 0;

  :deep(.el-dropdown-menu__item) {
    padding: 8px 16px;
    color: var(--text-main);
    display: flex;
    align-items: center;
    gap: 8px;

    &:hover {
      background-color: var(--bg-hover);
    }
  }

  :deep(.el-divider) {
    margin: 4px 0;
    border-color: var(--border-base);
  }
}

.collapse-btn {
    position: absolute;
    top: 0;
    right: 0px;
    z-index: 20;
    background: var(--bg-panel);
    border: 1px solid var(--border-base);
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: all 0.2s;

  &:hover {
    background: var(--bg-hover);
    border-color: $primary;
  }

  :deep(svg) {
    color: var(--text-main);
  }
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--bg-main);
  transition: all 0.3s ease;
  min-width: 0;
}

.content-wrapper {
  flex: 1;
  overflow: auto;
  padding: 16px;
  background-color: var(--bg-main);
}

// Fade transition for route changes
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
