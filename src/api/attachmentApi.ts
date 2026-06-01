/**
 * 附件管理 API 服务
 * 基于 Vue2 版本重构，所有接口路径前加 /admin
 */
import request from '@/utils/request'

/**
 * 附件分组/目录
 */
export interface AttachmentCatalog {
  id: number
  title: string
  code: string
  parent_id: number
  is_default: number
  sort: number
  children?: AttachmentCatalog[]
  tree_title?: string
}

/**
 * 附件文件响应
 */
export interface AttachmentFile {
  id: number
  filename: string
  original_name: string
  ext: string
  type: string
  type_text: string
  mime_type: string
  size: number
  file_size_text: string
  width?: number
  height?: number
  length?: number
  length_text?: string
  url: string
  cover: string
  cover_full: string
  storage: string
  storage_text: string
  create_client: string
  create_client_text: string
  group_code?: string
  group_title?: string
  created_time: string
  created_time_text?: string
}

/**
 * 目录表单数据
 */
export interface CatalogFormData {
  id?: number
  title: string
  code?: string
  parent_id: number
  is_default: number
  sort: number
}

/**
 * 分页列表响应
 */
export interface ListResponse<T> {
  list: T[]
  paginator: {
    total: number
    per_page: number
    current_page: number
    last_page: number
  }
}

/**
 * 文件列表查询参数
 */
export interface FileListParams {
  page?: number
  page_size?: number
  type?: string
  keyword?: string
  group?: string
  start_time?: string
  end_time?: string
}

export const attachmentApi = {
  /**
   * 获取系统附件配置
   * GET /admin/attachment/config
   */
  config: () => {
    return request.get('/admin/attachment/config')
  },

  /**
   * 查询分片文件是否上传
   * GET /admin/attachment/snippet/check/:hash
   */
  checkSnippet: (hash: string) => {
    return request.get(`/admin/attachment/snippet/check/${hash}`)
  },

  /**
   * 上传切片文件
   * POST /admin/attachment/snippet/upload
   */
  uploadSnippet: (params: FormData) => {
    return request.post('/admin/attachment/snippet/upload', params, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  /**
   * 文件合并接口
   * POST /admin/attachment/snippet/merge
   */
  mergeSnippetFile: (params: any) => {
    return request.post('/admin/attachment/snippet/merge', params)
  },

  /**
   * 上传单个文件
   * POST /admin/attachment/upload
   */
  uploadFile: (params: FormData, onUploadProgress?: (progressEvent: any) => void) => {
    return request.post('/admin/attachment/upload', params, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress
    })
  },

  /**
   * 上传Base64图片
   * POST /admin/attachment/upload/base64-img
   */
  uploadBase64Image: (params: any) => {
    return request.post('/admin/attachment/upload/base64-img', params)
  },

  /**
   * 上传网络文件
   * POST /admin/attachment/upload/remote-file
   */
  uploadRemoteFile: (params: any) => {
    return request.post('/admin/attachment/upload/remote-file', params)
  },

  /**
   * 上传多个文件
   * POST /admin/attachment/uploads
   */
  uploadFiles: (params: FormData) => {
    return request.post('/admin/attachment/uploads', params, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  /**
   * 获取分组树
   * GET /admin/attachment/group/trees
   */
  getCatalogTree: (params?: any) => {
    return request.get('/admin/attachment/group/trees', { params })
  },

  /**
   * 添加分组
   * POST /admin/attachment/group
   */
  addCatalog: (params: CatalogFormData) => {
    return request.post('/admin/attachment/group', params)
  },

  /**
   * 更新分组
   * PUT /admin/attachment/group/:id
   */
  editCatalog: (id: number, params: CatalogFormData) => {
    return request.put(`/admin/attachment/group/${id}`, params)
  },

  /**
   * 删除分组
   * POST /admin/attachment/group/removes
   */
  delCatalog: (ids: number[]) => {
    return request.post('/admin/attachment/group/removes', { ids })
  },

  /**
   * 获取分组详情
   * GET /admin/attachment/group/:id
   */
  showCatalog: (id: number) => {
    return request.get(`/admin/attachment/group/${id}`)
  },

  /**
   * 获取附件列表
   * GET /admin/attachment/index
   */
  files: (params?: FileListParams): Promise<ListResponse<AttachmentFile>> => {
    return request.get('/admin/attachment/index', { params })
  },

  /**
   * 下载附件
   * GET /admin/attachment/download/:id
   */
  download: (id: number, onDownloadProgress?: (progressEvent: any) => void) => {
    return request.get(`/admin/attachment/download/${id}`, {
      responseType: 'blob',
      onDownloadProgress
    })
  },

  /**
   * 获取附件类型选项
   * GET /admin/attachment/type-options
   */
  typeOptions: () => {
    return request.get('/admin/attachment/type-options')
  },

  /**
   * 移动分组
   * POST /admin/attachment/move-group
   */
  moveGroup: (params: { ids: number[]; groupCode: string }) => {
    return request.post('/admin/attachment/move-group', params)
  },

  /**
   * 删除单个附件
   * DELETE /admin/attachment/:id
   */
  delete: (id: number) => {
    return request.delete(`/admin/attachment/${id}`)
  },

  /**
   * 批量删除附件
   * POST /admin/attachment/deletes
   */
  deletes: (ids: number[]) => {
    return request.post('/admin/attachment/deletes', { ids })
  }
}

export default attachmentApi
