import request from '@/utils/request';

/**
 * 菜单项接口
 */
export interface MenuItem {
  id: number
  menuId: string
  name: string
  icon?: string
  path: string
  component?: string
  title?: string
  parentId: number
  parentMenuId?: string
  sort: number
  type: 'menu' | 'directory' | 'path' | 'api'
  httpMethod?: string
  routeName?: string
  status?: number
  createdTime?: number
  updatedTime?: number
  children?: MenuItem[]
}

/**
 * 角色接口
 */
export interface Role {
  id: number
  name: string
  code: string
  data?: any[]
  data_v2?: any[]
  menuIds?: number[]
  createdTime?: number
  updatedTime?: number
}

/**
 * 用户角色接口
 */
export interface UserRole {
  name: string
  code: string
}

/**
 * 用户接口
 */
export interface User {
  id: number
  email: string
  nickname?: string
  avatar?: string
  verifiedMobile?: string
  emailVerified?: number
  roles?: UserRole[]
  locked?: number
  lockDeadline?: number
  consecutivePasswordErrorTimes?: number
  lastPasswordFailTime?: number
  loginTime?: number
  loginIp?: string
  approvalTime?: number
  approvalStatus?: string
  createdIp?: string
  createdTime?: number
  updatedTime?: number
  orgId?: number
  orgCode?: string
  registeredWay?: string
  uuid?: string
  passwordInit?: number
  registerVisitId?: string
  destroyed?: number
  type?: string
  setup?: number
}

/**
 * 分页响应接口
 */
export interface PaginatedResponse<T> {
  total: number
  list: T[]
}

/**
 * 权限管理 API
 * API 基础路径: /api/admin
 * 文档参考: docs/permission-api.md
 */
export const permissionApi = {
  // ================= 菜单管理 =================

  /**
   * 获取菜单列表
   * GET /api/admin/menu
   */
  getMenus: (params?: {
    start?: number
    limit?: number
    sort?: string
    type?: string
    nameLike?: string
  }) => {
    return request.get<PaginatedResponse<MenuItem>>('/admin/menu', { params })
  },

  /**
   * 获取菜单树
   * GET /api/admin/menu/tree
   */
  getMenuTree: () => {
    return request.get<MenuItem[]>('/admin/menu/tree')
  },

  /**
   * 获取单个菜单
   * GET /api/admin/menu/{id}
   */
  getMenu: (id: number) => {
    return request.get<MenuItem>(`/admin/menu/${id}`)
  },

  /**
   * 创建菜单
   * POST /api/admin/menu
   */
  createMenu: (data: {
    menuId: string
    name: string
    icon?: string
    path: string
    component?: string
    title?: string
    parentId?: number
    parentMenuId?: string
    sort?: number
    type: 'menu' | 'directory' | 'path' | 'api'
    httpMethod?: string
    routeName?: string
    status?: number
  }) => {
    return request.post('/admin/menu', data)
  },

  /**
   * 更新菜单
   * PUT /api/admin/menu/{id}
   */
  updateMenu: (id: number, data: Partial<MenuItem>) => {
    return request.put(`/admin/menu/${id}`, data)
  },

  /**
   * 删除菜单
   * DELETE /api/admin/menu/{id}
   */
  deleteMenu: (id: number) => {
    return request.delete(`/admin/menu/${id}`)
  },

  /**
   * 批量删除菜单
   * POST /api/admin/menu/batch-delete
   */
  batchDeleteMenus: (ids: number[]) => {
    return request.post('/admin/menu/batch-delete', { ids })
  },

  /**
   * 同步菜单（从 menu.json）
   * POST /api/admin/menu/sync
   */
  syncMenus: () => {
    return request.post('/admin/menu/sync')
  },

  /**
   * 获取当前用户的菜单树
   * GET /api/admin/menu/user/menu
   */
  getUserMenus: () => {
    return request.get<MenuItem[]>('/admin/menu/user/menu')
  },

  /**
   * 获取菜单类型选项
   * GET /api/admin/menu/type-options
   */
  getMenuTypeOptions: () => {
    return request.get<Array<{ value: string; label: string }>>('/admin/menu/type-options')
  },

  // ================= 角色管理 =================

  /**
   * 获取角色列表
   * GET /api/admin/role
   */
  getRoles: (params?: {
    start?: number
    limit?: number
    sort?: string
  }) => {
    return request.get<PaginatedResponse<Role>>('/admin/role', { params })
  },

  /**
   * 获取角色选项（用于下拉框）
   * GET /api/admin/role/options
   */
  getRoleOptions: () => {
    return request.get<Array<{ value: number; label: string; code: string }>>('/admin/role/options')
  },

  /**
   * 获取单个角色
   * GET /api/admin/role/{id}
   */
  getRole: (id: number) => {
    return request.get<Role & { menuIds?: number[] }>(`/admin/role/${id}`)
  },

  /**
   * 创建角色
   * POST /api/admin/role
   */
  createRole: (data: {
    name: string
    code: string
    menuIds?: number[]
  }) => {
    return request.post('/admin/role', data)
  },

  /**
   * 更新角色
   * PUT /api/admin/role/{id}
   */
  updateRole: (id: number, data: {
    name: string
    code: string
    menuIds?: number[]
  }) => {
    return request.put(`/admin/role/${id}`, data)
  },

  /**
   * 删除角色
   * DELETE /api/admin/role/{id}
   */
  deleteRole: (id: number) => {
    return request.delete(`/admin/role/${id}`)
  },

  /**
   * 批量删除角色
   * POST /api/admin/role/batch-delete
   */
  batchDeleteRoles: (ids: number[]) => {
    return request.post('/admin/role/batch-delete', { ids })
  },

  /**
   * 获取角色的菜单权限
   * GET /api/admin/role/{id}/menus
   */
  getRoleMenus: (id: number) => {
    return request.get<MenuItem[]>(`/admin/role/${id}/menus`)
  },

  /**
   * 分配菜单权限给角色
   * POST /api/admin/role/{id}/menus
   */
  assignRoleMenus: (id: number, menuIds: number[]) => {
    return request.post(`/admin/role/${id}/menus`, { menuIds })
  },

  // ================= 用户管理 =================

  /**
   * 获取用户列表
   * GET /api/admin/user
   */
  getUsers: (params?: {
    start?: number
    limit?: number
    orderBy?: string
  }) => {
    return request.get<PaginatedResponse<User>>('/admin/user', { params })
  },

  /**
   * 获取单个用户
   * GET /api/admin/user/{id}
   */
  getUser: (id: number) => {
    return request.get<User>(`/admin/user/${id}`)
  },

  /**
   * 创建用户
   * POST /api/admin/user
   */
  createUser: (data: {
    email: string
    nickname: string
    password: string
    roles?: string[]
  }) => {
    return request.post('/admin/user', data)
  },

  /**
   * 更新用户
   * PUT /api/admin/user/{id}
   */
  updateUser: (id: number, data: {
    email?: string
    nickname?: string
    roles?: string[]
  }) => {
    return request.put(`/admin/user/${id}`, data)
  },

  /**
   * 删除用户
   * DELETE /api/admin/user/{id}
   */
  deleteUser: (id: number) => {
    return request.delete(`/admin/user/${id}`)
  },

  /**
   * 批量删除用户
   * POST /api/admin/user/batch-delete
   */
  batchDeleteUsers: (ids: number[]) => {
    return request.post('/admin/user/batch-delete', { ids })
  },

  /**
   * 分配角色给用户
   * POST /api/admin/user/{id}/roles
   */
  assignUserRoles: (id: number, roles: string[]) => {
    return request.post(`/admin/user/${id}/roles`, { roles })
  },

  /**
   * 重置用户密码
   * POST /api/admin/user/{id}/reset-password
   */
  resetUserPassword: (id: number, password: string) => {
    return request.post(`/admin/user/${id}/reset-password`, { password })
  },

  /**
   * 锁定/解锁用户
   * POST /api/admin/user/{id}/toggle-lock
   */
  toggleUserLock: (id: number, locked: boolean) => {
    return request.post(`/admin/user/${id}/toggle-lock`, { locked })
  },

  /**
   * 获取用户角色选项
   * GET /api/admin/user/role-options
   */
  getUserRoleOptions: () => {
    return request.get<Array<{ value: string; label: string }>>('/admin/user/role-options')
  }
}

export default permissionApi
