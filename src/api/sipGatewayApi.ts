/**
 * SIP 网关集群管理 API 服务
 * Base URL: /api/admin/sip-gateways
 * 文档：docs/api-project/docs/2026/SIP-Gateway-Cluster-API.md
 */
import request from '@/utils/request'
import type {
  SipGateway,
  SipGatewayFormData,
  SipGatewayListParams,
  SipGatewayBindParams,
  SipGatewayUnbindParams
} from '@/types/sipGateway'
import type { PagedList } from '@/types/recording'

const BASE = '/admin/sip-gateways'

export const sipGatewayApi = {
  getGatewayList: (params?: SipGatewayListParams): Promise<PagedList<SipGateway>> => {
    return request.get(BASE, { params })
  },

  getGatewayDetail: (id: number): Promise<SipGateway> => {
    return request.get(`${BASE}/${id}`)
  },

  createGateway: (data: SipGatewayFormData): Promise<SipGateway> => {
    return request.post(BASE, data)
  },

  updateGateway: (id: number, data: Partial<SipGatewayFormData>): Promise<SipGateway> => {
    return request.put(`${BASE}/${id}`, data)
  },

  deleteGateway: (id: number): Promise<void> => {
    return request.delete(`${BASE}/${id}`)
  },

  toggleGateway: (id: number): Promise<SipGateway> => {
    return request.post(`${BASE}/${id}/toggle`)
  },

  bindDevices: (data: SipGatewayBindParams): Promise<{ success: number; failed: number }> => {
    return request.post(`${BASE}/bind`, data)
  },

  unbindDevices: (data: SipGatewayUnbindParams): Promise<{ success: number; failed: number }> => {
    return request.post(`${BASE}/unbind`, data)
  }
}

export default sipGatewayApi
