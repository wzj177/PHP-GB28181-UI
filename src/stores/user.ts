import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authUtils } from '@/utils/authUtils'

export interface UserRole {
  name: string
  code: string
}

export interface UserInfo {
  id: number
  nickname: string
  avatar: string
  roles: UserRole[]
  loginTime: number
  loginIp: string
  uuid: string
  email: string
}

const STORAGE_KEY = 'userInfo'

export const useUserStore = defineStore('user', () => {
  // State
  const userInfo = ref<UserInfo | null>(null)

  // 初始化 - 从 localStorage 加载用户信息
  const loadFromStorage = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        userInfo.value = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load user info from storage:', error)
    }
  }

  // 设置登录信息（登录成功后调用）
  const setLoginInfo = (data: {
    token: { value: string; type: string; key: string }
    user: UserInfo
  }) => {
    // 保存用户信息
    userInfo.value = data.user
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user))
  }

  // 清除用户信息（退出登录时调用）
  const clearUserInfo = () => {
    userInfo.value = null
    localStorage.removeItem(STORAGE_KEY)
    // 清除认证信息
    authUtils.clear()
  }

  // 计算属性 - 获取显示名称
  const displayName = computed(() => {
    return userInfo.value?.nickname || '管理员'
  })

  // 计算属性 - 获取显示角色
  const displayRole = computed(() => {
    if (!userInfo.value?.roles?.length) return '系统管理员'

    // roles 现在是对象数组: [{name: '演示角色', code: 'ROLE_DEMO'}]
    const mainRole = userInfo.value.roles[0]
    return mainRole?.name || '系统管理员'
  })

  // 计算属性 - 获取显示头像
  const displayAvatar = computed(() => {
    return userInfo.value?.avatar || 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'
  })

  // 初始化时加载
  loadFromStorage()

  return {
    // State
    userInfo,
    // Computed
    displayName,
    displayRole,
    displayAvatar,
    // Actions
    setLoginInfo,
    clearUserInfo,
    loadFromStorage
  }
})
