import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  CancelTokenSource
} from 'axios'
import router from '@/router'
import { authUtils } from '@/utils/authUtils'
// 如果你有 Message / MessageBox，直接替换即可
// import { ElMessage, ElMessageBox } from 'element-plus'

/* ================= axios 实例 ================= */

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 60000,
  headers: {
    'X-Requested-With': 'XMLHttpRequest'
  }
})

/* ================= CancelToken ================= */

const CancelToken = axios.CancelToken

export const requestQueue: Record<
  string,
  { source: CancelTokenSource }
> = {}

export const cancelAllRequest = (msg = '') => {
  Object.values(requestQueue).forEach(i => i.source.cancel(msg))
  Object.keys(requestQueue).forEach(k => delete requestQueue[k])
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
   
  (config: AxiosRequestConfig & { startTime?: number }) => {
    config.startTime = Date.now()

    const source = CancelToken.source()
    if ('cancelToken' in config) {
      config.cancelToken = source.token
    }

    if ('url' in config && config.url) {
      requestQueue[config.url.replace(/^\//, '')] = { source }
    }

    const token = authUtils.getToken()
    if (token && !config.headers?.['X-Public']) {
      const tokenKey = authUtils.getTokenKey() || 'Authorization'
      config.headers = config.headers || {}
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

    const res = response.data
    if (
      typeof res === 'string' &&
      response.config.responseType === 'blob'
    ) {
      const blob = new Blob([res], {
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
