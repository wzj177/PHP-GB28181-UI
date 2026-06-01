import request from '@/utils/request'

/**
 *
 * @method tagAdd 添加标签
 * @method tagList 标签列表
 * @method tagOptions 标签下拉列表
 * @method tagDelete 删除标签
 * @method tagBatchDelete 批量删除标签
 * @method catalogTree 分类树
 * @method catalogAdd 添加分类
 * @method catalogEdit 更新分类
 * @method catalogDelete 删除分类
 * @method catalogShow 分类详情
 * @method catalogUpdSort 修改分类排序
 * @method catalogUpdStatus 修改分类状态
 * @returns
 */
export function useProductApi() {
  return {
    tagAdd: data => {
      return request({
        url: '/product/tag/add',
        method: 'post',
        data: data
      })
    },
    tagList: params => {
      return request({
        url: '/product/tags',
        method: 'get',
        params
      })
    },
    tagDelete: id => {
      return request({
        url: `/product/tag/${id}`,
        method: 'delete'
      })
    },
    tagBatchDelete: ids => {
      return request({
        url: '/product/tag/batch-delete',
        method: 'post',
        data: { ids: ids }
      })
    },
    catalogTree: params => {
      return request({
        url: '/product/catalog/tree',
        method: 'get',
        params
      })
    },
    catalogAdd: params => {
      return request({
        url: '/product/catalog',
        method: 'post',
        data: params
      })
    },
    catalogEdit: (id, params) => {
      return request({
        url: `/product/catalog/${id}`,
        method: 'put',
        data: params
      })
    },
    catalogDelete: id => {
      return request({
        url: `/product/catalog/${id}`,
        method: 'delete'
      })
    },
    catalogShow: id => {
      return request({
        url: `/product/catalog/${id}`,
        method: 'get'
      })
    },
    tagOptions: params => {
      return request({
        url: '/product/tag/options',
        method: 'get',
        params
      })
    },
    catalogUpdSort: (id, sort) => {
      return request({
        url: `/product/catalog/upd-sort/${id}`,
        method: 'POST',
        data: { sort: sort }
      })
    },
    catalogUpdStatus: (id, status) => {
      return request({
        url: `/product/catalog/upd-status/${id}`,
        method: 'POST',
        data: { status: status }
      })
    }
  }
}
