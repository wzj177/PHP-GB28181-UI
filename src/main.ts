// 导入全局样式（包含主题变量） - 必须在最前面
import './styles/index.scss'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

import App from './App.vue'
import router from './router'

const isMockEnabled = import.meta.env.VITE_MOCK_ENABLED !== 'false'


async function setupMock() {
  if (!isMockEnabled) return

  await import('./mock/setup')
}

setupMock()

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(ElementPlus, {
  locale: zhCn
})

// 初始化主题（必须在 pinia 安装后）
import { useThemeStore } from './stores/theme'
useThemeStore()
// Store 定义时已经初始化了主题，这里只是确保它被加载

app.mount('#app')