/**
 * 行政区域 API 服务
 * 对应后端路由：
 * GET /admin/regions/provinces - 获取省份列表
 * GET /admin/regions/cities/:provinceId - 获取城市列表
 * GET /admin/regions/counties/:cityId - 获取区县列表
 */
import request from '@/utils/request';
import type { ProvinceInfo, CityInfo, CountyInfo } from '@/types/media-server';

/**
 * API响应格式
 */
interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export const regionApi = {
  /**
   * 获取省份列表
   * GET /admin/regions/provinces
   */
  getProvinces: (): Promise<ApiResponse<ProvinceInfo[]>> => {
    return request.get('/admin/regions/provinces');
  },

  /**
   * 获取城市列表
   * GET /admin/regions/cities/:provinceId
   */
  getCities: (provinceId: string): Promise<ApiResponse<CityInfo[]>> => {
    return request.get(`/admin/regions/cities/${provinceId}`);
  },

  /**
   * 获取区县列表
   * GET /admin/regions/counties/:cityId
   */
  getCounties: (cityId: string): Promise<ApiResponse<CountyInfo[]>> => {
    return request.get(`/admin/regions/counties/${cityId}`);
  }
};

export default regionApi;
