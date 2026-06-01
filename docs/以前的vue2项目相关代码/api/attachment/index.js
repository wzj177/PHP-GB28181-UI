import request from '@/utils/request'

/**
 * 附件api接口集合
 * @method checkSnippet 查询分片文件是否上传
 * @method uploadSnippet 上传切片文件
 * @method mergeSnippetFile 文件合并接口
 * @method uploadFile 上传单个文件
 * @method uploadBase64Image 上传Base64图片
 * @method uploadRemoteFile 上传网络文件
 * @method uploadFiles 上传多个文件
 * @method getCatalogTree 获取分组树
 * @method addCatalog 添加分组
 * @method editCatalog 更新分组
 * @method delCatalog 删除分组
 * @method files 获取附件列表
 * @method download 下载附件
 * @method typeOptions 获取附件类型
 * @method moveGroup 移动分组
 * @method config 获取系统附件配置
 * @method delete 删除附件
 * @method deletes 批量删除附件
 */
export function useAttachmentApi() {
  return {
    config: _ => {
      return request({
        url: `/attachment/config`,
        method: 'get'
      })
    },
    checkSnippet: hash => {
      return request({
        url: `/attachment/snippet/check/${hash}`,
        method: 'get'
      })
    },
    uploadSnippet: params => {
      return request({
        url: '/attachment/snippet/upload',
        method: 'post',
        data: params,
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
    mergeSnippetFile: params => {
      return request({
        url: '/attachment/snippet/merge',
        method: 'post',
        data: params
      })
    },
    uploadFile: (params, onUploadProgress = undefined) => {
      return request({
        url: '/attachment/upload',
        method: 'post',
        data: params,
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress
      })
    },
    uploadBase64Image: params => {
      return request({
        url: '/attachment/upload/base64-img',
        method: 'post',
        data: params
      })
    },
    uploadRemoteFile: params => {
      return request({
        url: '/attachment/upload/remote-file',
        method: 'post',
        data: params
      })
    },
    uploadFiles: params => {
      return request({
        url: '/attachment/uploads',
        method: 'post',
        data: params,
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
    getCatalogTree: params => {
      return request({
        url: '/attachment/group/trees',
        method: 'get',
        params
      })
    },
    addCatalog: params => {
      return request({
        url: '/attachment/group',
        method: 'post',
        data: params
      })
    },
    editCatalog: (id, params) => {
      return request({
        url: `/attachment/group/${id}`,
        method: 'put',
        data: params
      })
    },
    delCatalog: ids => {
      return request({
        url: '/attachment/group/removes',
        method: 'post',
        data: { ids: ids }
      })
    },
    showCatalog: id => {
      return request({
        url: `/attachment/group/${id}`,
        method: 'get'
      })
    },
    files: params => {
      return request({
        url: '/attachment/index',
        method: 'get',
        params
      })
    },
    download: (id, onDownloadProgress, cancelToken) => {
      return request({
        url: `/attachment/download/${id}`,
        method: 'get',
        onDownloadProgress: onDownloadProgress,
        cancelToken: cancelToken,
        responseType: 'blob'
      })
    },
    bigFileDownload: (url, onDownloadProgress, headers, cancelToken) => {
      return request({
        url: `/download.php?path=${url}`,
        method: 'get',
        onDownloadProgress: onDownloadProgress,
        cancelToken: cancelToken,
        headers: headers,
        responseType: 'blob'
      })
    },
    typeOptions: _ => {
      return request({
        url: '/attachment/type-options',
        method: 'get'
      })
    },
    moveGroup: params => {
      return request({
        url: '/attachment/move-group',
        method: 'post',
        data: params
      })
    },
    delete: id => {
      return request({
        url: `/attachment/${id}`,
        method: 'delete'
      })
    },
    deletes: ids => {
      return request({
        url: '/attachment/deletes',
        method: 'post',
        data: { ids: ids }
      })
    }
  }
}
