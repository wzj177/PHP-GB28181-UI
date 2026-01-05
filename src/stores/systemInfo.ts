import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface SystemInfo {
  platformName: string
  platformLogo: string
  platformShortName: string
}

const DEFAULT_SYSTEM_INFO: SystemInfo = {
  platformName: 'PHP-GB28181',
  platformLogo: '',
  platformShortName: 'G'
}

export const useSystemInfoStore = defineStore('systemInfo', () => {
  // System info state
  const systemInfo = ref<SystemInfo>({ ...DEFAULT_SYSTEM_INFO })

  // Load from localStorage
  const loadFromStorage = () => {
    try {
      const saved = localStorage.getItem('system-info')
      if (saved) {
        const parsed = JSON.parse(saved)
        systemInfo.value = { ...DEFAULT_SYSTEM_INFO, ...parsed }
      }
    } catch (error) {
      console.error('Failed to load system info from storage:', error)
    }
  }

  // Save to localStorage
  const saveToStorage = () => {
    try {
      localStorage.setItem('system-info', JSON.stringify(systemInfo.value))
    } catch (error) {
      console.error('Failed to save system info to storage:', error)
    }
  }

  // Update system info
  const updateSystemInfo = (info: Partial<SystemInfo>) => {
    systemInfo.value = { ...systemInfo.value, ...info }
    saveToStorage()
  }

  // Reset to default
  const resetSystemInfo = () => {
    systemInfo.value = { ...DEFAULT_SYSTEM_INFO }
    saveToStorage()
  }

  // Initialize from storage
  loadFromStorage()

  return {
    systemInfo,
    updateSystemInfo,
    resetSystemInfo,
    loadFromStorage,
    saveToStorage
  }
})
