import request from '@/utils/request'

/**
 * UUID 响应类型
 */
export interface UserUuidResponse {
  uuid: string
}

/**
 * 用户 API 服务
 */
export const userApi = {
  /**
   * 获取当前用户 UUID
   * GET /api/admin/user/uuid
   */
  showUUid: () => {
    return request.get<UserUuidResponse>('/admin/user/uuid')
  }
}
