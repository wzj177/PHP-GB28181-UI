import request from '@/utils/request'

/**
 * 系统api接口集合
 * @method getSetting 获取系统配置项
 * @method setBasic 系统基础配置
 * @method setAttachment 系统附件配置
 * @method setAuth 系统安全配置
 * @method setStorage 系统存储配置
 * @method setCDN 系统CDN配置
 * @method setMail 系统邮件配置
 * @method setVIP 系统会员配置
 * @method setIpCheckList 系统IP黑白名单配置
 * @method getAttachmentOptions 获取附件类型选项
 * @method checkMail 验证邮箱配置
 * @method logList 获取系统操作日志列表
 * @method logView 获取系统操作日志详情
 * @method logBatchDelete 批量删除系统操作日志
 * @method logModuleOptions 获取系统操作日志模块列表
 * @method logModuleActionOptions 获取系统操作日志模块对应操作列表
 */
export function useSystemApi() {
  return {
    getSetting: key => {
      return request({
        url: `/setting/view/${key}`,
        method: 'get'
      })
    },
    setBasic: params => {
      return request({
        url: '/setting/basic',
        method: 'post',
        data: params
      })
    },
    setAttachment: params => {
      return request({
        url: '/setting/attachment',
        method: 'post',
        data: params
      })
    },
    setAuth: params => {
      return request({
        url: '/setting/auth',
        method: 'post',
        data: params
      })
    },
    setStorage: params => {
      return request({
        url: '/setting/storage',
        method: 'post',
        data: params
      })
    },
    setCDN: params => {
      return request({
        url: '/setting/cdn',
        method: 'post',
        data: params
      })
    },
    setMail: params => {
      return request({
        url: '/setting/mail',
        method: 'post',
        data: params
      })
    },
    setVIP: params => {
      return request({
        url: '/setting/vip',
        method: 'post',
        data: params
      })
    },
    setIpCheckList: params => {
      return request({
        url: '/setting/ip-check-list',
        method: 'post',
        data: params
      })
    },
    getAttachmentOptions: () => {
      return request({
        url: `/setting/attachment/options`,
        method: 'get'
      })
    },
    checkMail: to => {
      return request({
        url: `/system/test-mail`,
        method: 'post',
        data: { to: to }
      })
    },
    logList: params => {
      return request({
        url: `/system/log`,
        method: 'get',
        params
      })
    },
    logView: id => {
      return request({
        url: `/system/log/${id}`,
        method: 'get'
      })
    },
    logBatchDelete: ids => {
      return request({
        url: '/system/log/btch-dlt',
        method: 'post',
        data: { ids: ids }
      })
    },
    logModuleOptions: _ => {
      return request({
        url: '/system/log/modules',
        method: 'get'
      })
    },
    logModuleActionOptions: module => {
      return request({
        url: `/system/log/actions/${module}`,
        method: 'get'
      })
    }
  }
}
