import request from '@/utils/request';

/**
 * GB28181 API 服务
 * 对应后端路由：
 * 设备管理：/admin/gb28181/devices
 * 通道管理：/admin/gb28181/channels
 * 云台控制：/admin/gb28181/ptz
 * 流媒体：/admin/gb28181/streams
 * 录像：/admin/gb28181/recordings
 */
export const gb28181Api = {
  // ================= 设备管理 =================

  /**
   * 获取 GB28181 设备列表
   * GET /admin/gb28181/devices
   */
  getDeviceList: (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    return request.get('/admin/gb28181/devices', { params });
  },

  /**
   * 获取设备详情
   * GET /admin/gb28181/devices/{id}
   */
  getDeviceDetail: (id: string) => {
    return request.get(`/admin/gb28181/devices/${id}`);
  },

  /**
   * 删除设备
   * DELETE /admin/gb28181/devices/{id}
   */
  deleteDevice: (id: string) => {
    return request.delete(`/admin/gb28181/devices/${id}`);
  },

  /**
   * 查询设备目录（发送命令到信令网关获取通道列表）
   * POST /admin/gb28181/devices/{id}/catalog
   */
  queryDeviceCatalog: (id: string) => {
    return request.post(`/admin/gb28181/devices/${id}/catalog`);
  },

  /**
   * 获取设备和通道树形结构
   * GET /admin/gb28181/devices/tree
   * 返回完整的设备树，包含所有设备及其通道
   */
  getDeviceTree: () => {
    return request.get('/admin/gb28181/devices/tree');
  },

  /**
   * 更新设备信息
   * PUT /admin/gb28181/devices/{id}
   */
  updateDevice: (id: string, data: {
    show_name?: string;
    rtp_trans_mode?: number;
    enabled?: number;
    province_id?: string;
    city_id?: string;
    county_id?: string;
    custom_lat?: string;
    custom_lng?: string;
    filter_channel_types?: number[];
  }) => {
    return request.put(`/admin/gb28181/devices/${id}`, data);
  },

  /**
   * 批量删除设备
   * DELETE /admin/gb28181/devices/batch
   */
  batchDeleteDevices: (ids: number[]) => {
    return request.delete('/admin/gb28181/devices/batch', { data: { ids } });
  },

  /**
   * 批量更新设备行政区域
   * PUT /admin/gb28181/devices/batch/area
   */
  batchUpdateDeviceArea: (ids: number[], area: {
    province_id: string;
    city_id: string;
    county_id: string;
  }) => {
    return request.put('/admin/gb28181/devices/batch/area', { ids, ...area });
  },

  /**
   * 获取设备类型统计数据
   * GET /admin/gb28181/device-stats
   */
  getDeviceStats: () => {
    return request.get('/admin/gb28181/device-stats');
  },

  /**
   * 更新设备信息（发送命令）
   * POST /admin/gb28181/{id}/cmd
   */
  updateDeviceInfo: (id: string, cmd: string) => {
    return request.post(`/admin/gb28181/devices/${id}/cmd`, { cmd });
  },

  // ================= 通道管理 =================

  /**
   * 获取设备通道列表
   * GET /admin/gb28181/channels/{id}
   */
  getChannelList: (id: string, params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    return request.get(`/admin/gb28181/channels/${id}`, { params });
  },

  /**
   * 获取所有通道列表（用于批量绑定）
   * GET /admin/gb28181/channels
   */
  getAllChannels: (params?: {
    device_id?: string;
    status?: string;
    keyword?: string;
    page?: number;
    limit?: number;
  }) => {
    return request.get('/admin/gb28181/channels', { params });
  },

  /**
   * 获取通道详情
   * GET /admin/gb28181/channels/{id}/channel/{channelId}
   */
  getChannelDetail: (id: string, channelId: string) => {
    return request.get(`/admin/gb28181/channels/${id}/channel/${channelId}`);
  },

  getChannelFilterTypes: () => {
    return request.get('/admin/gb28181/channels/type/filters');
  },

  /**
   * 更新通道信息
   * PUT /admin/gb28181/channels/{id}
   * @param id 通道主键ID
   */
  updateChannel: (id: string, data: {
    show_name?: string;
    origin_code?: string;
    custom_lat?: string;
    custom_lng?: string;
  }) => {
    return request.put(`/admin/gb28181/channels/${id}`, data);
  },

  /**
   * 批量绑定通道到流媒体服务器
   * PUT /admin/gb28181/channels/batch/bind-media
   */
  batchBindChannelsToMedia: (ids: number[], server_id: string) => {
    return request.put('/admin/gb28181/channels/batch/bind-media', { ids, server_id });
  },

  // ================= 云台控制 (PTZ) =================

  /**
   * PTZ 云台控制
   * POST /api/admin/gb28181/devices/ptz
   */
  ptzControl: (params: {
    device_id: string;
    channel_id: string;
    command: string; // up, down, left, right, zoom_in, zoom_out, stop
    speed: number; // 1-255
  }) => {
    return request.post('/admin/gb28181/devices/ptz', params, {
      headers: {
        'X-Silent': 1
      }
    });
  },

  // ================= 流媒体控制 =================

  /**
   * 开始实时视频（拉流）
   * POST /admin/gb28181/streams/start-live
   */
  startLive: (params: {
    device_id: string;
    channel_id: string;
    stream_type?: 'main' | 'sub'; // 主码流/子码流
  }) => {
    return request.post('/admin/gb28181/streams/start-live', params);
  },

  /**
   * 停止实时视频
   * POST /admin/gb28181/streams/stop-live
   */
  stopLive: (params: {
    device_id: string;
    channel_id: string;
  }) => {
    return request.post('/admin/gb28181/streams/stop-live', params);
  },

  /**
   * 获取播放地址
   * GET /admin/gb28181/streams/play-urls
   */
  getPlayUrls: (params: {
    device_id: string;
    channel_id: string;
    stream_type?: 'main' | 'sub';
  }) => {
    return request.get('/admin/gb28181/streams/play-urls', { params });
  },

  /**
   * 开始录像回放
   * POST /admin/gb28181/streams/playback
   */
  startPlayback: (params: {
    device_id: string;
    channel_id: string;
    start_time: string; // ISO format: 2024-01-01T00:00:00
    end_time: string;
  }) => {
    return request.post('/admin/gb28181/streams/playback', params);
  },

  // ================= 录像管理 =================

  /**
   * 获取录像列表
   * GET /admin/gb28181/recordings
   */
  getRecordings: (params: {
    device_id: string;
    channel_id?: string;
    start_time: string; // ISO format
    end_time: string;
  }) => {
    return request.get('/admin/gb28181/recordings', { params });
  },

  /**
   * 开始录像
   * POST /admin/gb28181/recordings/start-record
   */
  startRecord: (params: {
    device_id: string;
    channel_id: string;
  }) => {
    return request.post('/admin/gb28181/recordings/start-record', params);
  },

  /**
   * 停止录像
   * POST /admin/gb28181/recordings/stop-record
   */
  stopRecord: (params: {
    device_id: string;
    channel_id: string;
  }) => {
    return request.post('/admin/gb28181/recordings/stop-record', params);
  },

  /**
   * 抓拍快照
   * POST /admin/gb28181/recordings/snapshot
   */
  snapshot: (params: {
    device_id: string;
    channel_id: string;
  }) => {
    return request.post('/admin/gb28181/recordings/snapshot', params);
  },

  // ================= 预置位管理 =================

  /**
   * 获取预置位列表
   * GET /admin/gb28181/presets
   */
  getPresetList: (params: {
    device_id: string;
    channel_id: string;
  }) => {
    return request.get('/admin/gb28181/presets', { params });
  },

  /**
   * 设置预置位
   * POST /admin/gb28181/presets
   */
  setPreset: (params: {
    device_id: string;
    channel_id: string;
    value: number;
    name: string;
  }) => {
    return request.post('/admin/gb28181/presets', params);
  },

  /**
   * 调用预置位
   * POST /admin/gb28181/presets/call
   */
  callPreset: (params: {
    device_id: string;
    channel_id: string;
    value: number;
  }) => {
    return request.post('/admin/gb28181/presets/call', params);
  },

  /**
   * 删除预置位
   * POST /admin/gb28181/presets/delete
   */
  deletePreset: (params: {
    device_id: string;
    channel_id: string;
    value: number;
  }) => {
    return request.post('/admin/gb28181/presets/delete', params);
  }
};

export default gb28181Api;
