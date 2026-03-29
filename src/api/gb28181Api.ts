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
    page_size?: number;
    keyword?: string;
    device_category?: number | string;
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
    device_category?: number | string;
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

  /**
   * 发送设备命令（通用接口）
   * POST /admin/gb28181/devices/{id}/cmd
   * @param params 命令参数
   * @param params.device_id 设备ID
   * @param params.cmd 命令类型 (query_record, device_info, etc.)
   * @param params.params 命令参数
   */
  sendDeviceCommand: (params: {
    device_id: string;
    cmd: string;
    params?: Record<string, any>;
  }) => {
    return request.post(`/admin/gb28181/devices/${params.device_id}/cmd`, {
      cmd: params.cmd,
      params: params.params || {}
    });
  },

  /**
   * 查询录像（新接口）
   * POST /admin/gb28181/channels/{id}/playback/query
   * @param id 通道主键 ID
   */
  queryPlayback: (id: string | number, params: {
    start_time: string;
    end_time: string;
  }) => {
    return request.post(`/admin/gb28181/channels/${id}/playback/query`, params, {
      headers: { 'X-Silent': '1' }  // 关闭全局 loading
    });
  },

  /**
   * 获取录像查询结果（轮询接口）
   * GET /admin/gb28181/channels/{id}/record-info-result
   */
  getRecordInfoResult: (channelId: string, params?: {
    start_time?: string;
    end_time?: string;
  }) => {
    return request.get(`/admin/gb28181/channels/${channelId}/record-info-result`, {
      params,
      headers: { 'X-Silent': '1' }  // 关闭全局 loading
    });
  },

  // ================= 通道管理 =================

  /**
   * 获取设备通道列表
   * GET /admin/gb28181/channels/{id}
   */
  getChannelList: (id: string, params?: {
    status?: string;
    page?: number;
    page_size?: number;
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
    page_size?: number;
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
   * 获取设备分类选项
   * GET /admin/gb28181/device-categories/options
   */
  getDeviceCategoryOptions: () => {
    return request.get('/admin/gb28181/device-categories/options');
  },

  /**
   * 获取通道类型选项
   * GET /admin/gb28181/channels/type/options
   */
  getChannelTypeOptions: () => {
    return request.get('/admin/gb28181/channels/type/options');
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

  /**
   * 删除通道
   * DELETE /admin/gb28181/channels/{id}
   * @param id 通道主键ID
   */
  deleteChannel: (id: number) => {
    return request.delete(`/admin/gb28181/channels/${id}`);
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
   * POST /admin/gb28181/streams/playback/start
   */
  startPlayback: (params: {
    device_id: string;
    channel_id: string;
    start_time: string; // ISO format: 2024-01-01T00:00:00
    end_time: string;
  }) => {
    return request.post('/admin/gb28181/streams/playback/start', params, {
      headers: { 'X-Silent': '1' }  // 关闭全局 loading
    });
  },

  /**
   * 停止录像回放
   * POST /admin/gb28181/streams/playback/stop
   */
  stopPlayback: (params: {
    device_id: string;
    channel_id: string;
    stream_id?: string;
  }) => {
    return request.post('/admin/gb28181/streams/playback/stop', params, {
      headers: { 'X-Silent': '1' }  // 关闭全局 loading
    });
  },

  /**
   * 录像回放控制
   * POST /admin/gb28181/channels/{id}/playback/control
   * @param id 通道主键 ID
   */
  playbackControl: (id: string | number, params: {
    action: 'fast_forward' | 'play' | 'pause' | 'slow_forward' | 'seek' | 'scale';
    speed?: string;  // 倍速（1-4）
    seek_time?: string;  // 拖动时间（2024-01-01T10:30:00）
    stream_id?: string;  // 回放流 ID
    scale?: string;  // 缩放比例
  }) => {
    return request.post(`/admin/gb28181/channels/${id}/playback/control`, params, {
      headers: { 'X-Silent': '1' }  // 关闭全局 loading
    });
  },

  /**
   * 录像回放下载
   * POST /admin/gb28181/channels/{id}/playback/download
   * @param id 通道主键 ID
   */
  playbackDownload: (id: string | number, params: {
    start_time: string;  // ISO format: 2024-01-01T00:00:00
    end_time: string;
    stream_id?: string;  // 回放流 ID
  }) => {
    return request.post(`/admin/gb28181/channels/${id}/playback/download`, params, {
      headers: { 'X-Silent': '1' }  // 关闭全局 loading
    });
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
  },

  /**
   * 获取流编码信息
   * POST /admin/gb28181/channels/codec-info
   */
  getCodecInfo: (params: {
    url: string;
    stream_id?: string;
  }) => {
    return request.post('/admin/gb28181/channels/codec-info', params);
  },

  // ================= 回放下载任务管理 =================

  /**
   * 获取回放下载任务列表
   * GET /admin/gb28181/record-tasks
   */
  getRecordTasks: (params?: {
    device_id?: string;
    channel_id?: string;
    task_type?: string;
    status?: string;
    page?: number;
    page_size?: number;
  }) => {
    return request.get('/admin/gb28181/record-tasks', { params });
  },

  /**
   * 删除回放下载任务
   * DELETE /admin/gb28181/record-tasks/{id}
   */
  deleteRecordTask: (id: number) => {
    return request.delete(`/admin/gb28181/record-tasks/${id}`);
  },

  // ================= 语音对讲 =================

  /**
   * 开始语音对讲（获取推流地址）
   * POST /admin/gb28181/broadcast/start
   */
  broadcastStart: (deviceId: string, channelId: string) => {
    return request.post('/admin/gb28181/broadcast/start', {
      device_id: deviceId,
      channel_id: channelId
    });
  },

  /**
   * 停止语音对讲
   * POST /admin/gb28181/broadcast/stop
   */
  broadcastStop: (sessionId: string) => {
    return request.post('/admin/gb28181/broadcast/stop', { session_id: sessionId });
  },

  // ================= 设备控制 (Device Control) =================

  /**
   * 远程重启
   * POST /admin/gb28181/device-control/reboot
   */
  deviceReboot: (params: {
    device_id: string;
    channel_id: string;
  }) => {
    return request.post('/admin/gb28181/device-control/reboot', params);
  },

  /**
   * 录像控制
   * POST /admin/gb28181/device-control/record
   */
  deviceRecord: (params: {
    device_id: string;
    channel_id: string;
    action?: 'Record' | 'StopRecord';
  }) => {
    return request.post('/admin/gb28181/device-control/record', params);
  },

  /**
   * 布防/撤防
   * POST /admin/gb28181/device-control/guard
   */
  deviceGuard: (params: {
    device_id: string;
    channel_id: string;
    action?: 'SetGuard' | 'ResetGuard';
  }) => {
    return request.post('/admin/gb28181/device-control/guard', params);
  },

  /**
   * 报警复位
   * POST /admin/gb28181/device-control/alarm-reset
   */
  deviceAlarmReset: (params: {
    device_id: string;
    channel_id: string;
    alarm_method?: number;
    alarm_type?: number;
  }) => {
    return request.post('/admin/gb28181/device-control/alarm-reset', params);
  },

  /**
   * 强制关键帧（I 帧）
   * POST /admin/gb28181/device-control/iframe
   */
  deviceIframe: (params: {
    device_id: string;
    channel_id: string;
  }) => {
    return request.post('/admin/gb28181/device-control/iframe', params);
  },

  /**
   * 看守位控制
   * POST /admin/gb28181/device-control/home-position
   */
  deviceHomePosition: (params: {
    device_id: string;
    channel_id: string;
    enabled?: number;
    reset_time?: number;
    preset_index?: number;
  }) => {
    return request.post('/admin/gb28181/device-control/home-position', params);
  },

  /**
   * 拖拽变倍
   * POST /admin/gb28181/device-control/drag-zoom
   */
  deviceDragZoom: (params: {
    device_id: string;
    channel_id: string;
    type?: 'in' | 'out';
    length: number;
    width: number;
    mid_point_x: number;
    mid_point_y: number;
    length_x: number;
    length_y: number;
  }) => {
    return request.post('/admin/gb28181/device-control/drag-zoom', params);
  },

  /**
   * 设备基础配置
   * POST /admin/gb28181/device-control/config
   */
  deviceConfig: (params: {
    device_id: string;
    channel_id: string;
    name?: string;
    expiration?: number;
    heartbeat_interval?: number;
    heartbeat_count?: number;
  }) => {
    return request.post('/admin/gb28181/device-control/config', params);
  },

  /**
   * 设备配置查询
   * POST /admin/gb28181/device-control/config-query
   */
  deviceConfigQuery: (params: {
    device_id: string;
    channel_id: string;
    config_type?: 'BasicParam' | 'VideoParamOpt' | 'SVACEncodeConfig' | 'SVACDecodeConfig';
  }) => {
    return request.post('/admin/gb28181/device-control/config-query', params);
  },

  /**
   * 雨刷控制
   * POST /admin/gb28181/device-control/wiper
   */
  deviceWiper: (params: {
    device_id: string;
    channel_id: string;
    on?: boolean;
  }) => {
    return request.post('/admin/gb28181/device-control/wiper', params);
  },

  /**
   * 辅助开关控制
   * POST /admin/gb28181/device-control/aux-switch
   */
  deviceAuxSwitch: (params: {
    device_id: string;
    channel_id: string;
    switch_id?: number;
    on?: boolean;
  }) => {
    return request.post('/admin/gb28181/device-control/aux-switch', params);
  },

  /**
   * 自动扫描控制
   * POST /admin/gb28181/devices/scan
   */
  scanControl: (params: {
    device_id: string;
    channel_id: string;
    action: 'scan_start' | 'scan_stop' | 'scan_set_left' | 'scan_set_right' | 'scan_set_speed';
    group_id?: number;
    speed?: number;
  }) => {
    return request.post('/admin/gb28181/devices/scan', params);
  },

  /**
   * 从设备查询预置位（异步，结果通过 Hook 写回 DB）
   * POST /admin/gb28181/presets/query-from-device
   */
  queryPresetsFromDevice: (params: {
    device_id: string;
    channel_id: string;
  }) => {
    return request.post('/admin/gb28181/presets/query-from-device', params);
  },
};

export default gb28181Api;
