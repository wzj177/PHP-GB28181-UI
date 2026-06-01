// @ts-ignore
import axios, {
// @ts-ignore
  type AxiosInstance,
  type AxiosRequestConfig,
// @ts-ignore
  type AxiosResponse,
// @ts-ignore
  CancelTokenSource
} from 'axios'
import router from '@/router'
import { authUtils } from '@/utils/authUtils'
import { ElLoading } from 'element-plus'
import type { LoadingInstance } from 'element-plus/es/components/loading/src/loading'

type RequestConfig = AxiosRequestConfig & {
  headers?: Record<string, any>
  startTime?: number
}

/* ================= axios 实例 ================= */

// @ts-ignore
const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 60000,
  headers: {
    'X-Requested-With': 'XMLHttpRequest'
  }
})

/* ================= CancelToken ================= */

// @ts-ignore
const CancelToken = axios.CancelToken

export const requestQueue: Record<
  string,
// @ts-ignore
  { source: CancelTokenSource }
> = {}

export const cancelAllRequest = (msg = '') => {
  closeAllLoading()
  Object.values(requestQueue).forEach(i => i.source.cancel(msg))
  Object.keys(requestQueue).forEach(k => delete requestQueue[k])
}

/* ================= 全局 Loading ================= */

let loadingInstance: LoadingInstance | null = null
let requestCount = 0

// 显示 loading
const showLoading = (config: RequestConfig) => {
  // 如果配置了不显示 loading，直接返回
  if (config.headers?.['X-Silent']) {
    return
  }

  requestCount++

  // 防止重复创建
  if (!loadingInstance) {
    loadingInstance = ElLoading.service({
      lock: true,
      text: '加载中...',
      background: 'rgba(0, 0, 0, 0.7)',
      fullscreen: true
    })
  }
}

// 隐藏 loading
const hideLoading = () => {
  requestCount--

  if (requestCount <= 0) {
    requestCount = 0
    if (loadingInstance) {
      loadingInstance.close()
      loadingInstance = null
    }
  }
}

// 关闭所有 loading
export const closeAllLoading = () => {
  requestCount = 0
  if (loadingInstance) {
    loadingInstance.close()
    loadingInstance = null
  }
}

/* ================= 错误提示 ================= */

const showError = (res: any) => {
  const msg = res?.data?.message || res?.message
  msg && console.error(msg)
  // ElMessage.error(msg)
}

/* ================= JWT 续签 ================= */

function renewJwtToken(response?: AxiosResponse) {
  if (!response?.headers) return

  const authorization = response.headers['authorization']
  if (authorization && authorization.startsWith('Bearer ')) {
    authUtils.setToken(authorization)
    authUtils.setTokenKey('Authorization')
  }
}

/* ================= 请求拦截器 ================= */

service.interceptors.request.use(
  (config: RequestConfig) => {
    config.startTime = Date.now()

    // 显示 loading
    showLoading(config)

    const source = CancelToken.source()
    if ('cancelToken' in config) {
      config.cancelToken = source.token
    }

    if ('url' in config && config.url) {
      // @ts-ignore
      requestQueue[config.url.replace(/^\//, '')] = { source }
    }

    const token = authUtils.getToken()
    if (token && !config.headers?.['X-Public']) {
      const tokenKey = authUtils.getTokenKey() || 'Authorization'
        // @ts-ignore
      config.headers = config.headers || {}
      // @ts-ignore
      config.headers[tokenKey] = token
    }

    delete config.headers?.['X-Public']

    return config
  },
  error => Promise.reject(error)
)

/* ================= 响应拦截器（核心一致） ================= */

service.interceptors.response.use(
  (response: AxiosResponse) => {
    ;(response as any).duration =
      Date.now() - ((response.config as any).startTime || 0)

    // 隐藏 loading
    hideLoading()

    const res = response.data
    if (
      typeof res === 'string' &&
      response.config.responseType === 'blob'
    ) {
      const blob = new Blob([res], {
        // @ts-ignore
        type: response.headers['content-type'] || 'image/jpeg'
      })
      console.log('文件下载响应')
      return blob
    }
    if (res instanceof Blob) {
      return res
    }

    if (res?.code === 0) {
      renewJwtToken(response)
      return res.data
    }

    return Promise.reject({
      code: res?.code,
      message: res?.message
    })
  },
  error => {
    // 隐藏 loading
    hideLoading()

    const res = error.response
    const config = error.config || {}

    renewJwtToken(res)

    if (res && !config[`disableHandle${res.status}`]) {
      switch (res.status) {
        case 401:
          cancelAllRequest('登录失效')
          authUtils.clear()
          router.push('/login')
          break
        case 403:
          showError(res)
          cancelAllRequest('无权访问')
          router.push('/403')
          break
        case 404:
          console.error('请求地址不存在')
          break
        case 429:
          console.error('操作太频繁')
          cancelAllRequest('too many requests')
          break
        default:
          console.error(`服务器异常(code: ${res.status})`)
          break
      }
    }

    // @ts-ignore
    if (axios.isCancel(error)) {
      console.warn('请求被取消:', error.message)
    } else if (error.message?.includes('timeout')) {
      console.error('网络超时')
    } else if (error.message === 'Network Error') {
      console.error('网络连接错误')
    }

    return Promise.reject(error)
  }
)

export default service
