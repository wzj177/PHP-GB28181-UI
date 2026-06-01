import axios from 'axios'
// eslint-disable-next-line no-unused-vars
import { Message, Notification } from 'element-ui'
import store from '@/store'
import { getToken } from '@/utils/auth'

// create an axios instance
const service = axios.create({
  // 实际请求时会判断用户是不是租户,替换url请求地址
  baseURL: process.env.VUE_APP_DEV_API || process.env.VUE_APP_BASE_API, // url = base url + request url
  // withCredentials: true, // send cookies when cross-domain requests
  timeout: 6 * 5000 // request timeout
})

/**
 *处理静默登录：安全作用：authorization的有效期为1个小时
 * @param {*} response
 */
const renewToken = response => {
  if (response.headers['authorization'] || response.headers['token']) {
    if (response.headers['token']) {
      response.headers['authorization'] = response.headers['token']
    }
    store
      .dispatch('user/autoLogin', response.headers['authorization'])
      .then(() => {
        // location.reload()
      })
  }
}

// request interceptor
service.interceptors.request.use(
  (config) => {
    // do something before request is sent
    config.headers['X-Requested-With'] = 'XMLHttpRequest'
    if (store.getters.user.type === 'corp') {
      config.baseURL = config.baseURL.replace('/admin/', '/tenant/')
    }
    if (store.getters.token) {
      // let each request carry token
      // ['X-Token'] is a custom headers key
      // please modify it according to the actual situation
      config.headers['Authorization'] = config.headers['Token'] = getToken()
    }
    return config
  },
  (error) => {
    // do something with request error
    // console.log(error) // for debug
    return Promise.reject(error)
  }
)

// response interceptor
service.interceptors.response.use(
  /**
   * If you want to get http information such as headers or status
   * Please return  response => response
   */

  /**
   * Determine the request status by custom code
   * Here is just an example
   * You can also judge the status by HTTP Status Code
   */
  (response) => {
    const res = response.data
    // let res_temp = null
    // if (/\/horizon\//.test(response.config.url)) {
    //   res_temp = JSON.parse(JSON.stringify({
    //     code: 0,
    //     data: res
    //   }))
    //   res = JSON.parse(JSON.stringify(res_temp))
    // }

    // if (typeof (res) === 'object' && Object.prototype.toString.call(res).toLowerCase() === '[object object]' && !res.length && res.code === undefined) {
    //   console.log(res)
    //   return res
    // }
    // if the custom code is not 20000, it is judged as an error.
    if (res instanceof Blob) {
      return res
    }
    if (res.success) {
      res.code = 0
    }
    if (res.code !== 0) {
      Notification({
        message: res.message || 'Error',
        type: 'error',
        duration: 5 * 1000
      })

      return Promise.reject(new Error(res.message || 'Error'))
    } else {
      renewToken(response)
      return res
    }
  },
  (error) => {
    // restfull
    const errorResponse = error.response
    renewToken(errorResponse)
    if (errorResponse && 'data' in errorResponse && errorResponse.data) {
      const { code, message } = errorResponse.data
      Notification({
        message: message,
        type: 'error',
        duration: 5 * 1000
      })
      if ([401000, 401001, 401003, 401004].includes(code)) {
        store.dispatch('user/resetToken').then(() => {
          if (code !== 401001) {
            setTimeout(() => {
              location.reload()
            }, 5 * 1000)
          }
        })
      }
    } else {
      Notification({
        message: error.message,
        type: 'error',
        duration: 5 * 1000
      })
    }

    return Promise.reject(error)
  }
)

export default service
