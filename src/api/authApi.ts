import request from '@/utils/request'
import axios from 'axios'

/**
 * 登录配置类型
 */
export interface LoginConfig {
  user_password_level: 'low' | 'middle' | 'high'  // 密码等级
  login_connect_login_limit: number  // 用户登录限制
  login_connect_client_login_limit: number  // 设备终端登录限制
  login_mode: 'nickname' | 'phone'  // 登录方式
  login_captcha: number  // 是否需要验证码：1=开启，0=关闭
  oauth_login_enabled: number  // 第三方登录：1=开启，0=关闭
  temporary_lock_enabled: number  // 用户登录保护：1=开启，0=关闭
}

/**
 * 认证 API 服务
 * 对应后端路由：
 * POST /auth/login - 管理员登录
 * POST /auth/logout - 退出登录
 * GET /auth/captcha - 获取验证码
 * GET /auth/config - 获取登录配置
 */
export const authApi = {
  /**
   * 获取登录配置
   * GET /admin/auth/config
   */
  getConfig: () => {
    return request.get<LoginConfig>('/admin/auth/config', {
      headers: { 'X-Public': true }
    })
  },

  /**
   * 管理员登录
   * POST /admin/auth/login
   */
  login: (username: string, password: string, captcha?: string) => {
    const data: any = {
      username,
      password
    };

    // Only include captcha and checkCaptcha if captcha is provided
    if (captcha) {
      data.checkCaptcha = true;
      data.captcha = captcha;
    }

    // Use X-Public header to bypass authentication token
    return request.post('/admin/auth/login', data, {
      headers: { 'X-Public': true }
    });
  },

  /**
   * 退出登录
   * POST /auth/logout
   */
  logout: () =>
    request.post('/admin/auth/logout'),

  /**
   * 获取验证码图片
   * GET /auth/captcha
   */
  getCaptcha: async () => {
    const baseURL = import.meta.env.VITE_API_BASE_URL || '';
    // Use direct axios request to bypass mock and interceptors
    const response = await axios({
      url: `${baseURL}/admin/auth/captcha`,
      method: 'GET',
      responseType: 'blob',
      validateStatus: (status) => status === 200
    });

    return response.data;
  }
}

export default authApi