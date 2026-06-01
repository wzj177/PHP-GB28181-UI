import request from '@/utils/request'

/**
 * 登录api接口集合
 * @method signIn 用户登录
 * @method signOut 用户退出登录
 */
export function useLoginApi() {
  return {
    signIn: params => {
      return request({
        url: '/auth/login',
        method: 'post',
        data: {
          captcha: params.captcha,
          checkCaptcha: true
        },
        auth: {
          username: params.username,
          password: params.password
        }
      })
    },
    signOut: params => {
      return request({
        url: '/auth/logout',
        method: 'post',
        data: params
      })
    },
    captcha: () => {
      return request({
        url: 'auth/captcha',
        method: 'get',
        responseType: 'blob'
      })
    },
    config: () => {
      return request({
        url: 'auth/config',
        method: 'get'
      })
    }
  }
}
