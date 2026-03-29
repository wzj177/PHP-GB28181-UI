import request from '@/utils/request'

const BASE = '/admin/gb28181'

// ===================== 类型定义 =====================

export interface MapPoint {
  device_id: string
  channel_id: string
  channel_name: string
  device_name: string
  longitude: number
  latitude: number
  is_custom: boolean
}

export interface MapPointsResponse {
  count: number
  points: MapPoint[]
}

export interface TrackPoint {
  longitude: number
  latitude: number
  speed: number
  direction: number
  time: number
  time_formatted: string
}

export interface DeviceTrack {
  device_id: string
  count: number
  track: TrackPoint[]
}

export interface MapTracksResponse {
  start_time: string
  end_time: string
  device_count: number
  tracks: DeviceTrack[]
}

// ===================== API =====================

export const mapApi = {
  /**
   * 获取电子地图点位（所有设备或指定设备）
   * GET /admin/gb28181/device-positions/map/points
   * @param device_ids 设备ID列表，逗号分隔，不传则返回所有
   */
  getMapPoints: (device_ids?: string): Promise<MapPointsResponse> => {
    const params: Record<string, string> = {}
    if (device_ids) params.device_ids = device_ids
    return request.get(`${BASE}/device-positions/map/points`, { params })
  },

  /**
   * 获取设备轨迹
   * GET /admin/gb28181/device-positions/map/tracks
   * @param device_ids 设备ID列表，逗号分隔（必填）
   * @param start_time 开始时间 yyyy-MM-dd HH:mm:ss
   * @param end_time   结束时间 yyyy-MM-dd HH:mm:ss
   */
  getMapTracks: (params: {
    device_ids: string
    start_time: string
    end_time: string
  }): Promise<MapTracksResponse> => {
    return request.get(`${BASE}/device-positions/map/tracks`, { params })
  }
}

export default mapApi

