import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type ThemeMode = 'light' | 'dark' | 'auto'

export const useThemeStore = defineStore('theme', () => {
  // 主题模式：light, dark, auto
  const themeMode = ref<ThemeMode>('auto')
  
  // 当前实际应用的主题
  const currentTheme = ref<'light' | 'dark'>('dark')

  // 从 localStorage 恢复主题设置
  const savedTheme = localStorage.getItem('theme-mode') as ThemeMode
  if (savedTheme) {
    themeMode.value = savedTheme
  }

  /**
   * 判断当前是否为白天（6:00-18:00 为白天）
   */
  const isDayTime = (): boolean => {
    const hour = new Date().getHours()
    return hour >= 6 && hour < 18
  }

  /**
   * 应用主题到 DOM
   */
  const applyTheme = (theme: 'light' | 'dark') => {
    console.log('Applying theme:', theme)
    currentTheme.value = theme
    document.documentElement.setAttribute('data-theme', theme)
    
    // 同时设置 class 用于调试
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
    }
    
    console.log('Theme applied. data-theme:', document.documentElement.getAttribute('data-theme'))
    console.log('Classes:', document.documentElement.className)
  }

  /**
   * 更新主题
   */
  const updateTheme = () => {
    if (themeMode.value === 'auto') {
      // 自动模式：根据时间切换
      const theme = isDayTime() ? 'light' : 'dark'
      applyTheme(theme)
    } else {
      // 手动模式
      applyTheme(themeMode.value)
    }
  }

  /**
   * 设置主题模式
   */
  const setThemeMode = (mode: ThemeMode) => {
    themeMode.value = mode
    localStorage.setItem('theme-mode', mode)
    updateTheme()
  }

  /**
   * 切换主题（在 light 和 dark 之间直接切换）
   */
  const toggleTheme = () => {
    // 获取当前实际应用的主题
    const actualTheme = themeMode.value === 'auto'
      ? (isDayTime() ? 'light' : 'dark')
      : themeMode.value

    // 切换到相反的主题（退出 auto 模式）
    const nextMode: ThemeMode = actualTheme === 'light' ? 'dark' : 'light'
    console.log(`🔄 Toggle theme: ${themeMode.value} (${actualTheme}) -> ${nextMode}`)
    setThemeMode(nextMode)
  }

  // 初始化主题
  updateTheme()

  // 自动模式下，每分钟检查一次时间
  if (themeMode.value === 'auto') {
    setInterval(() => {
      if (themeMode.value === 'auto') {
        updateTheme()
      }
    }, 60000) // 每分钟检查一次
  }

  // 监听主题模式变化
  watch(themeMode, () => {
    updateTheme()
  })

  return {
    themeMode,
    currentTheme,
    setThemeMode,
    toggleTheme,
    isDayTime
  }
})
