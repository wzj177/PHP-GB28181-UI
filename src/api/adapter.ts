import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import * as mockData from '@/mock/index'; // Import mock functions

// Create axios instance for real API
const realApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API adapter
export const apiAdapter = {
  // Make request using real API or mock based on environment
  async request<T>(config: AxiosRequestConfig): Promise<T> {
    // Check if we should use mock based on environment variables
    const shouldUseMock = import.meta.env.VITE_MOCK_ENABLED !== 'false';

    // In development with mock enabled, use mock data
    if (import.meta.env.DEV && shouldUseMock) {
      console.log(`Using mock for: ${config.url}`);
      const response = await handleMockRequest<T>(config);
      return response.data;
    } else {
      // Use real API
      console.log(`Making real API call to: ${config.url}`);
      const response = await realApi(config);
      return response.data;
    }
  }
};

// Handle mock requests
async function handleMockRequest<T>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  const { url = '', method = 'GET', params, data } = config;

  // Create a mock request options object similar to what Mock.js receives
  const mockOptions = {
    url: url,
    type: method.toUpperCase(),
    body: data ? JSON.stringify(data) : undefined,
    query: params,
    // Add other properties as needed
  };

  // Match URL patterns and return corresponding mock data
  // This simulates what Mock.js does internally
  if (url.includes('/devices/tree') && method.toLowerCase() === 'get') {
    return {
      data: getDeviceTreeMock(mockOptions) as T,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config,
    } as AxiosResponse<T>;
  } else if (url.includes('/devices') && /\/channels$/.test(url) && method.toLowerCase() === 'get') {
    return {
      data: getDeviceChannelsMock(mockOptions) as T,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config,
    } as AxiosResponse<T>;
  } else if (/\/devices\/[\w]+\/ptz\/control/.test(url) && method.toLowerCase() === 'post') {
    return {
      data: ptzControlMock(mockOptions) as T,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config,
    } as AxiosResponse<T>;
  } else if (/\/devices\/[\w]+\/presets/.test(url) && method.toLowerCase() === 'get') {
    return {
      data: getPresetPositionsMock(mockOptions) as T,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config,
    } as AxiosResponse<T>;
  } else if (/\/devices\/[\w]+\/presets\/[\w]+\/set/.test(url) && method.toLowerCase() === 'post') {
    return {
      data: setPresetPositionMock(mockOptions) as T,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config,
    } as AxiosResponse<T>;
  } else if (/\/devices\/[\w]+\/presets\/[\w]+\/go/.test(url) && method.toLowerCase() === 'post') {
    return {
      data: goToPresetPositionMock(mockOptions) as T,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config,
    } as AxiosResponse<T>;
  } else if (url.includes('/recordings') && method.toLowerCase() === 'get') {
    return {
      data: getRecordingsMock(mockOptions) as T,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config,
    } as AxiosResponse<T>;
  } else if (/\/recordings\/[\w]+\/download/.test(url) && method.toLowerCase() === 'get') {
    return {
      data: downloadRecordingMock(mockOptions) as T,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config,
    } as AxiosResponse<T>;
  } else if (url.includes('/alarms') && method.toLowerCase() === 'get') {
    return {
      data: getAlarmsMock(mockOptions) as T,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config,
    } as AxiosResponse<T>;
  } else if (/\/alarms\/[\w]+\/status/.test(url) && method.toLowerCase() === 'put') {
    return {
      data: updateAlarmStatusMock(mockOptions) as T,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config,
    } as AxiosResponse<T>;
  } else if (url.includes('/auth/login') && method.toLowerCase() === 'post') {
    return {
      data: loginMock(mockOptions) as T,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config,
    } as AxiosResponse<T>;
  } else if (url.includes('/auth/logout') && method.toLowerCase() === 'post') {
    return {
      data: logoutMock(mockOptions) as T,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config,
    } as AxiosResponse<T>;
  } else if (url.includes('/auth/userinfo') && method.toLowerCase() === 'get') {
    return {
      data: getUserInfoMock(mockOptions) as T,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config,
    } as AxiosResponse<T>;
  } else if (url.includes('/channels/start-record') && method.toLowerCase() === 'post') {
    return {
      data: startRecordMock(mockOptions) as T,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config,
    } as AxiosResponse<T>;
  } else if (url.includes('/channels/stop-record') && method.toLowerCase() === 'post') {
    return {
      data: stopRecordMock(mockOptions) as T,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config,
    } as AxiosResponse<T>;
  } else if (url.includes('/channels/snapshot') && method.toLowerCase() === 'post') {
    return {
      data: getSnapshotMock(mockOptions) as T,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config,
    } as AxiosResponse<T>;
  } else if (/\/devices\/[\w]+\/channels$/.test(url) && method.toLowerCase() === 'get') {
    return {
      data: getDeviceChannelsWithParamsMock(mockOptions) as T,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config,
    } as AxiosResponse<T>;
  } else if (url.includes('/recordings') && method.toLowerCase() === 'get' && !url.includes('/download')) {
    return {
      data: getRecordingsMock(mockOptions) as T,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config,
    } as AxiosResponse<T>;
  } else if (/\/recordings\/[\w]+\/download/.test(url) && method.toLowerCase() === 'get') {
    return {
      data: downloadRecordingMock(mockOptions) as T,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config,
    } as AxiosResponse<T>;
  } else if (url.includes('/system/stats') && method.toLowerCase() === 'get') {
    return {
      data: getSystemStatsMock(mockOptions) as T,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config,
    } as AxiosResponse<T>;
  } else if (url.includes('/system/device-stats') && method.toLowerCase() === 'get') {
    return {
      data: getDeviceStatsMock(mockOptions) as T,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config,
    } as AxiosResponse<T>;
  } else if (url.includes('/system/zlm-stats') && method.toLowerCase() === 'get') {
    return {
      data: getZLMediaKitStatsMock(mockOptions) as T,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config,
    } as AxiosResponse<T>;
  }

  // ==================== Permission API Mock ====================
  // Menu management
  else if (url.includes('/admin/menu/tree') && method.toLowerCase() === 'get') {
    return {
      data: getMenuTreeMock(mockOptions) as T,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config,
    } as AxiosResponse<T>;
  } else if (url.includes('/admin/menu/user/menu') && method.toLowerCase() === 'get') {
    return {
      data: getUserMenuTreeMock(mockOptions) as T,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config,
    } as AxiosResponse<T>;
  } else if (url.includes('/admin/menu') && method.toLowerCase() === 'get') {
    return {
      data: getMenusMock(mockOptions) as T,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config,
    } as AxiosResponse<T>;
  } else if (url.includes('/admin/menu') && method.toLowerCase() === 'post') {
    return {
      data: createMenuMock(mockOptions) as T,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config,
    } as AxiosResponse<T>;
  } else if (/\/admin\/menu\/\d+/.test(url) && method.toLowerCase() === 'put') {
    return {
      data: updateMenuMock(mockOptions) as T,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config,
    } as AxiosResponse<T>;
  } else if (/\/admin\/menu\/\d+/.test(url) && method.toLowerCase() === 'delete') {
    return {
      data: deleteMenuMock(mockOptions) as T,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config,
    } as AxiosResponse<T>;
  } else if (url.includes('/admin/menu/type-options') && method.toLowerCase() === 'get') {
    return {
      data: getMenuTypeOptionsMock(mockOptions) as T,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config,
    } as AxiosResponse<T>;
  }
  // Role management
  else if (url.includes('/admin/role/options') && method.toLowerCase() === 'get') {
    return {
      data: getRoleOptionsMock(mockOptions) as T,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config,
    } as AxiosResponse<T>;
  } else if (url.includes('/admin/role') && method.toLowerCase() === 'get' && !/\/\d+/.test(url)) {
    return {
      data: getRolesMock(mockOptions) as T,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config,
    } as AxiosResponse<T>;
  } else if (/\/admin\/role\/\d+/.test(url) && method.toLowerCase() === 'get') {
    return {
      data: getRoleDetailMock(mockOptions) as T,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config,
    } as AxiosResponse<T>;
  } else if (url.includes('/admin/role') && method.toLowerCase() === 'post') {
    return {
      data: createRoleMock(mockOptions) as T,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config,
    } as AxiosResponse<T>;
  } else if (/\/admin\/role\/\d+/.test(url) && method.toLowerCase() === 'put') {
    return {
      data: updateRoleMock(mockOptions) as T,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config,
    } as AxiosResponse<T>;
  } else if (/\/admin\/role\/\d+/.test(url) && method.toLowerCase() === 'delete') {
    return {
      data: deleteRoleMock(mockOptions) as T,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config,
    } as AxiosResponse<T>;
  } else if (/\/admin\/role\/\d+\/menus/.test(url) && method.toLowerCase() === 'get') {
    return {
      data: getRoleMenusMock(mockOptions) as T,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config,
    } as AxiosResponse<T>;
  } else if (/\/admin\/role\/\d+\/menus/.test(url) && method.toLowerCase() === 'post') {
    return {
      data: assignRoleMenusMock(mockOptions) as T,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config,
    } as AxiosResponse<T>;
  }
  // User management
  else if (url.includes('/admin/user/uuid') && method.toLowerCase() === 'get') {
    return {
      data: mockGetUserUuid(mockOptions) as T,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config,
    } as AxiosResponse<T>;
  } else if (url.includes('/admin/user/role-options') && method.toLowerCase() === 'get') {
    return {
      data: getUserRoleOptionsMock(mockOptions) as T,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config,
    } as AxiosResponse<T>;
  } else if (url.includes('/admin/user') && method.toLowerCase() === 'get' && !/\/\d+/.test(url)) {
    return {
      data: getUsersMock(mockOptions) as T,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config,
    } as AxiosResponse<T>;
  } else if (/\/admin\/user\/\d+/.test(url) && method.toLowerCase() === 'get') {
    return {
      data: getUserDetailMock(mockOptions) as T,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config,
    } as AxiosResponse<T>;
  } else if (url.includes('/admin/user') && method.toLowerCase() === 'post') {
    return {
      data: createUserMock(mockOptions) as T,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config,
    } as AxiosResponse<T>;
  } else if (/\/admin\/user\/\d+/.test(url) && method.toLowerCase() === 'put') {
    return {
      data: updateUserMock(mockOptions) as T,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config,
    } as AxiosResponse<T>;
  } else if (/\/admin\/user\/\d+/.test(url) && method.toLowerCase() === 'delete') {
    return {
      data: deleteUserMock(mockOptions) as T,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config,
    } as AxiosResponse<T>;
  }

  // Default response if no match
  return {
    data: { code: 200, message: 'success', data: {} } as T,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: config,
  } as AxiosResponse<T>;
}

// Mock functions - these would replicate the logic from mock/index.ts
export const getDeviceTreeMock = (options: any) => {
  // Simulate device tree data
  return {
    code: 200,
    message: 'success',
    data: [
      {
        id: 'group1',
        name: '监控区域A',
        children: [
          {
            id: 'device1',
            name: '大厅IPC',
            online: true,
            type: 'ipc',
            channels: [
              {
                id: 'ch1-1',
                name: '通道1',
                status: 'online',
                rtspUrl: 'rtsp://example.com/stream'
              }
            ]
          }
        ]
      }
    ]
  };
};

export const getAlarmsMock = (options: any) => {
  const page = parseInt(options.query?.page || '1');
  const pageSize = parseInt(options.query?.pageSize || '10');
  const total = 50;
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, total);
  
  const alarms = [];
  for (let i = startIndex; i < endIndex; i++) {
    alarms.push({
      id: `alarm-${i}`,
      deviceId: `device-${i}`,
      deviceName: `IPC-${1000 + i}`,
      channel: `通道 ${i % 16 + 1}`,
      type: ['motion', 'tamper', 'disconnect', 'storage_full'][i % 4],
      status: ['active', 'acknowledged', 'cleared'][i % 3],
      description: `模拟报警 ${i + 1}`,
      timestamp: new Date(Date.now() - (i * 3600000)).toISOString(),
      severity: ['low', 'medium', 'high', 'critical'][i % 4]
    });
  }

  return {
    code: 200,
    message: 'success',
    data: {
      list: alarms,
      pagination: {
        page,
        pageSize,
        total
      }
    }
  };
};

// Add other mock functions as needed...
// For brevity, I'll implement only the most critical ones
export const ptzControlMock = (options: any) => {
  return {
    code: 200,
    message: 'PTZ command sent successfully',
    data: null
  };
};

export const getPresetPositionsMock = (options: any) => {
  return {
    code: 200,
    message: 'success',
    data: [
      { id: 'preset1', name: '预置位 1', description: '大厅视角' },
      { id: 'preset2', name: '预置位 2', description: '门口视角' }
    ]
  };
};

export const getRecordingsMock = (options: any) => {
  // Parse query parameters
  const { deviceId, channelId, startTime, endTime } = options.query || {};

  // Generate mock recordings
  const recordings = [];
  const count = Math.floor(Math.random() * 10) + 5;

  for (let i = 0; i < count; i++) {
    const start = new Date();
    start.setDate(start.getDate() - Math.floor(Math.random() * 7)); // Random day in past week
    start.setHours(Math.floor(Math.random() * 24));
    start.setMinutes(Math.floor(Math.random() * 60));
    start.setSeconds(Math.floor(Math.random() * 60));

    const end = new Date(start.getTime());
    end.setMinutes(end.getMinutes() + Math.floor(Math.random() * 60) + 5); // Duration 5-65 minutes

    recordings.push({
      id: `rec-${Date.now()}-${i}`,
      deviceId: deviceId || 'device1',
      channelId: channelId || 'ch1-1',
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      duration: Math.floor((end.getTime() - start.getTime()) / 1000 / 60), // in minutes
      fileSize: `${Math.floor(Math.random() * 500) + 50}MB`,
      type: ['motion', 'manual', 'schedule'][Math.floor(Math.random() * 3)]
    });
  }

  return {
    code: 200,
    message: 'success',
    data: recordings
  };
};

export const updateAlarmStatusMock = (options: any) => {
  const body = options.body ? JSON.parse(options.body) : { status: 'active' };
  return {
    code: 200,
    message: `Alarm status updated to ${body.status}`,
    data: null
  };
};

export const getDeviceChannelsMock = (options: any) => {
  const deviceId = options.url?.match(/\/devices\/([^\/]+)\/channels/)?.[1] || 'device1';
  return {
    code: 200,
    message: 'success',
    data: [
      {
        id: `ch-${deviceId}-1`,
        name: '通道1',
        status: ['online', 'offline', 'motion_detect'][Math.floor(Math.random() * 3)],
        rtspUrl: 'rtsp://example.com/stream'
      },
      {
        id: `ch-${deviceId}-2`,
        name: '通道2',
        status: ['online', 'offline', 'motion_detect'][Math.floor(Math.random() * 3)],
        rtspUrl: 'rtsp://example.com/stream2'
      }
    ]
  };
};

export const setPresetPositionMock = (options: any) => {
  const match = options.url?.match(/\/devices\/([^\/]+)\/presets\/([^\/]+)\/set/);
  const deviceId = match?.[1] || 'device1';
  const presetId = match?.[2] || 'preset1';

  return {
    code: 200,
    message: 'Preset saved successfully',
    data: { deviceId, presetId }
  };
};

export const goToPresetPositionMock = (options: any) => {
  const match = options.url?.match(/\/devices\/([^\/]+)\/presets\/([^\/]+)\/go/);
  const deviceId = match?.[1] || 'device1';
  const presetId = match?.[2] || 'preset1';

  return {
    code: 200,
    message: 'Moving to preset position...',
    data: { deviceId, presetId }
  };
};

export const downloadRecordingMock = (options: any) => {
  const recordingId = options.url?.match(/\/recordings\/([^\/]+)\/download/)?.[1] || 'rec1';

  return {
    code: 200,
    message: 'Download started',
    data: { recordingId }
  };
};

export const getMapDevicesMock = (options: any) => {
  return {
    code: 200,
    message: 'success',
    data: [
      {
        id: 'device1',
        name: '大厅IPC',
        lng: 116.397428,
        lat: 39.90923,
        online: true,
        status: ['normal', 'motion_detect', 'alarm'][Math.floor(Math.random() * 3)],
        address: '北京市东城区天安门广场'
      },
      {
        id: 'device2',
        name: '门口IPC',
        lng: 116.407428,
        lat: 39.91923,
        online: true,
        status: ['normal', 'motion_detect', 'alarm'][Math.floor(Math.random() * 3)],
        address: '北京市东城区王府井大街'
      }
    ]
  };
};

// Authentication mock functions
export const loginMock = (options: any) => {
  const body = options.body ? JSON.parse(options.body) : { username: '', password: '' };
  const { username, password } = body;

  // Mock authentication logic
  if (username === 'admin' && password === '123456') {
    return {
      code: 200,
      message: '登录成功',
      data: {
        token: `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        expiresIn: 3600 // 1 hour
      }
    };
  } else {
    return {
      code: 401,
      message: '用户名或密码错误',
      data: null
    };
  }
};

export const logoutMock = (options: any) => {
  return {
    code: 200,
    message: '退出成功',
    data: null
  };
};

export const getUserInfoMock = (options: any) => {
  return {
    code: 200,
    message: '获取用户信息成功',
    data: {
      id: 1,
      username: 'admin',
      nickname: '管理员',
      email: 'admin@example.com',
      roles: ['admin'],
      permissions: ['*:*:*']
    }
  };
};

// Recording and snapshot mock functions
export const startRecordMock = (options: any) => {
  return {
    code: 200,
    message: '录像已开始',
    data: null
  };
};

export const stopRecordMock = (options: any) => {
  return {
    code: 200,
    message: '录像已停止',
    data: null
  };
};

export const getSnapshotMock = (options: any) => {
  const body = options.body ? JSON.parse(options.body) : { device_id: '', channel_id: '' };
  return {
    code: 200,
    message: '抓拍成功',
    data: {
      device_id: body.device_id,
      channel_id: body.channel_id,
      snapshot_url: `https://example.com/snapshots/${body.device_id}_${body.channel_id}_${Date.now()}.jpg`
    }
  };
};

export const getDeviceChannelsWithParamsMock = (options: any) => {
  const deviceId = options.url?.match(/\/devices\/([^\/]+)\/channels/)?.[1] || 'device1';
  const { status, page = 1, limit = 10, keyword } = options.query || {};

  // Generate mock channels
  const allChannels = [
    {
      id: 1,
      channel_id: `ch-${deviceId}-1`,
      channel_name: '通道1',
      device_id: deviceId,
      manufacturer: '厂商A',
      model: '型号X',
      status: ['online', 'offline', 'motion_detect'][Math.floor(Math.random() * 3)],
      stream_id: `stream-${deviceId}-1`,
      main_video: 'rtsp://example.com/main1',
      sub_video: 'rtsp://example.com/sub1',
      last_update_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 2,
      channel_id: `ch-${deviceId}-2`,
      channel_name: '通道2',
      device_id: deviceId,
      manufacturer: '厂商B',
      model: '型号Y',
      status: ['online', 'offline', 'motion_detect'][Math.floor(Math.random() * 3)] as any,
      stream_id: `stream-${deviceId}-2`,
      main_video: 'rtsp://example.com/main2',
      sub_video: 'rtsp://example.com/sub2',
      last_update_at: new Date(Date.now() - 1800000).toISOString()
    },
    {
      id: 3,
      channel_id: `ch-${deviceId}-3`,
      channel_name: '通道3',
      device_id: deviceId,
      manufacturer: '厂商C',
      model: '型号Z',
      status: ['online', 'offline', 'motion_detect'][Math.floor(Math.random() * 3)] as any,
      stream_id: `stream-${deviceId}-3`,
      main_video: 'rtsp://example.com/main3',
      sub_video: 'rtsp://example.com/sub3',
      last_update_at: new Date(Date.now() - 900000).toISOString()
    }
  ];

  // Filter based on params
  let filteredChannels = allChannels;
  if (status) {
    filteredChannels = filteredChannels.filter(ch => ch.status === status);
  }
  if (keyword) {
    filteredChannels = filteredChannels.filter(ch =>
      ch.channel_name.includes(keyword) || ch.channel_id.includes(keyword)
    );
  }

  // Pagination
  const total = filteredChannels.length;
  const startIndex = (Number(page) - 1) * Number(limit);
  const endIndex = Math.min(startIndex + Number(limit), total);
  const paginatedChannels = filteredChannels.slice(startIndex, endIndex);

  return {
    code: 200,
    message: 'success',
    data: {
      list: paginatedChannels,
      paginator: {
        total: total,
        page: Number(page),
        limit: Number(limit),
        page_count: Math.ceil(total / Number(limit))
      }
    }
  };
};

// ==================== System Stats Mock ====================
export const getSystemStatsMock = (options: any) => {
  return {
    code: 200,
    message: 'success',
    data: {
      cpu_usage: Math.floor(Math.random() * 60) + 10,
      cpu_cores: 8,
      cpu_frequency: '2.4 GHz',
      cpu_load: '1.25, 1.18, 1.05',
      memory_usage: Math.floor(Math.random() * 50) + 30,
      memory_total: 16 * 1024 * 1024 * 1024, // 16GB
      memory_used: 6 * 1024 * 1024 * 1024,  // 6GB
      memory_free: 10 * 1024 * 1024 * 1024,  // 10GB
      disk_usage: Math.floor(Math.random() * 40) + 35,
      disk_total: 500 * 1024 * 1024 * 1024, // 500GB
      disk_used: 180 * 1024 * 1024 * 1024,  // 180GB
      disk_free: 320 * 1024 * 1024 * 1024,  // 320GB
      network_upload: Math.floor(Math.random() * 10 * 1024 * 1024),
      network_download: Math.floor(Math.random() * 50 * 1024 * 1024),
      os_name: 'Linux',
      os_version: 'Ubuntu 22.04 LTS',
      uptime: Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60), // 30 days ago
      server_time: new Date().toISOString()
    }
  };
};

// ==================== ZLMediaKit Stats Mock ====================
export const getZLMediaKitStatsMock = (options: any) => {
  return {
    code: 200,
    message: 'success',
    data: {
      running: true,
      version: 'v2023-12-25',
      build_date: '2023-12-25 10:30:00',
      git_hash: 'abc123def456',
      uptime: Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60), // 7 days ago
      stream_count: 68,
      record_stream_count: 12,
      other_stream_count: 8,
      session_count: 156,
      tcp_connection_count: 142,
      udp_connection_count: 89,
      total_connection_count: 231,
      total_bandwidth: 125 * 1024 * 1024, // 125 MB/s
      rtsp_bandwidth: 45 * 1024 * 1024,
      http_flv_bandwidth: 35 * 1024 * 1024,
      ws_flv_bandwidth: 18 * 1024 * 1024,
      hls_bandwidth: 12 * 1024 * 1024,
      rtmp_bandwidth: 8 * 1024 * 1024,
      websocket_bandwidth: 7 * 1024 * 1024,
      cpu_usage: Math.floor(Math.random() * 40) + 15,
      memory_usage: Math.floor(Math.random() * 50) + 25,
      thread_count: 16,
      data_buffer_size: 256 * 1024 * 1024, // 256MB
      video_codecs: ['H264', 'H265', 'MJPEG'],
      audio_codecs: ['AAC', 'PCMU', 'PCMA', 'G711', 'Opus']
    }
  };
};

// ==================== Device Stats Mock ====================
export const getDeviceStatsMock = (options: any) => {
  const totalDevices = 68;
  const onlineDevices = 58;
  const offlineDevices = totalDevices - onlineDevices;

  // Generate hourly stats for the last 24 hours
  const hourlyStats = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const hour = (now.getHours() - i + 24) % 24;
    const total = totalDevices - Math.floor(Math.random() * 5);
    const online = Math.floor(total * (0.75 + Math.random() * 0.2));
    hourlyStats.push({
      hour,
      online_count: online,
      total_count: total,
      online_rate: Math.round((online / total) * 100)
    });
  }

  return {
    code: 200,
    message: 'success',
    data: {
      total_count: totalDevices,
      online_count: onlineDevices,
      offline_count: offlineDevices,
      total_channels: 256,
      online_channels: 238,
      offline_channels: 18,
      type_distribution: [
        { type: 'ipc', type_name: 'IPC', count: 45 },
        { type: 'nvr', type_name: 'NVR', count: 12 },
        { type: 'dvr', type_name: 'DVR', count: 8 },
        { type: 'platform', type_name: '平台', count: 3 }
      ],
      manufacturer_distribution: [
        {
          manufacturer: '海康威视',
          count: 28,
          models: ['DS-2CD3xxx', 'DS-2CD2xxx', 'DS-2CD4xxx', 'DS-2CD5xxx']
        },
        {
          manufacturer: '大华',
          count: 18,
          models: ['DH-IPCxxx', 'DH-NVRxxx', 'DH-SDxxx']
        },
        {
          manufacturer: '宇视',
          count: 12,
          models: ['IPC-xxx', 'NVR-xxx']
        },
        {
          manufacturer: '其他',
          count: 10,
          models: ['Generic IPC', 'Generic NVR']
        }
      ],
      recent_activities: [
        {
          device_name: '大厅摄像头01',
          device_id: '34020000001310000001',
          status: 'online',
          last_seen: new Date(Date.now() - 5 * 60 * 1000).toLocaleString('zh-CN')
        },
        {
          device_name: '停车场入口',
          device_id: '34020000001310000002',
          status: 'online',
          last_seen: new Date(Date.now() - 2 * 60 * 1000).toLocaleString('zh-CN')
        },
        {
          device_name: '办公区走廊',
          device_id: '34020000001310000003',
          status: 'offline',
          last_seen: new Date(Date.now() - 4 * 60 * 60 * 1000).toLocaleString('zh-CN')
        },
        {
          device_name: '后门入口',
          device_id: '34020000001310000004',
          status: 'online',
          last_seen: new Date(Date.now() - 10 * 60 * 1000).toLocaleString('zh-CN')
        }
      ],
      hourly_stats: hourlyStats
    }
  };
};

// ==================== Permission API Mock Functions ====================

// Mock menu data
const mockMenus = [
  {
    id: 1,
    menuId: 'dashboard',
    name: '仪表盘',
    icon: 'House',
    path: '/dashboard',
    component: 'Dashboard',
    title: '仪表盘',
    parentId: 0,
    parentMenuId: '',
    sort: 1,
    type: 'menu',
    status: 1,
    createdTime: 1234567890,
    updatedTime: 1234567890
  },
  {
    id: 2,
    menuId: 'monitoring',
    name: '系统监控',
    icon: 'Monitor',
    path: '/monitoring',
    title: '系统监控',
    parentId: 0,
    parentMenuId: '',
    sort: 2,
    type: 'directory',
    status: 1,
    createdTime: 1234567890,
    updatedTime: 1234567890,
    children: [
      {
        id: 3,
        menuId: 'system-stats',
        name: '系统统计',
        path: '/monitoring/system-stats',
        component: 'SystemStats',
        title: '系统统计',
        parentId: 2,
        parentMenuId: 'monitoring',
        sort: 1,
        type: 'menu',
        status: 1
      },
      {
        id: 4,
        menuId: 'device-stats',
        name: '设备统计',
        path: '/monitoring/device-stats',
        component: 'DeviceStats',
        title: '设备统计',
        parentId: 2,
        parentMenuId: 'monitoring',
        sort: 2,
        type: 'menu',
        status: 1
      },
      {
        id: 5,
        menuId: 'zlm-stats',
        name: 'ZLM统计',
        path: '/monitoring/zlm-stats',
        component: 'ZLMStats',
        title: 'ZLM统计',
        parentId: 2,
        parentMenuId: 'monitoring',
        sort: 3,
        type: 'menu',
        status: 1
      }
    ]
  },
  {
    id: 6,
    menuId: 'device',
    name: '设备管理',
    icon: 'VideoCamera',
    path: '/device',
    title: '设备管理',
    parentId: 0,
    parentMenuId: '',
    sort: 3,
    type: 'directory',
    status: 1,
    children: [
      {
        id: 7,
        menuId: 'device-list',
        name: '设备列表',
        path: '/device/list',
        component: 'DeviceList',
        title: '设备列表',
        parentId: 6,
        parentMenuId: 'device',
        sort: 1,
        type: 'menu',
        status: 1
      },
      {
        id: 8,
        menuId: 'channel-list',
        name: '通道列表',
        path: '/device/channels',
        component: 'ChannelList',
        title: '通道列表',
        parentId: 6,
        parentMenuId: 'device',
        sort: 2,
        type: 'menu',
        status: 1
      }
    ]
  },
  {
    id: 9,
    menuId: 'video',
    name: '视频管理',
    icon: 'VideoPlay',
    path: '/video',
    title: '视频管理',
    parentId: 0,
    parentMenuId: '',
    sort: 4,
    type: 'directory',
    status: 1,
    children: [
      {
        id: 10,
        menuId: 'video-management',
        name: '视频管理',
        path: '/video/management',
        component: 'VideoManagement',
        title: '视频管理',
        parentId: 9,
        parentMenuId: 'video',
        sort: 1,
        type: 'menu',
        status: 1
      },
      {
        id: 11,
        menuId: 'video-playback',
        name: '视频回放',
        path: '/video/playback',
        component: 'VideoPlayback',
        title: '视频回放',
        parentId: 9,
        parentMenuId: 'video',
        sort: 2,
        type: 'menu',
        status: 1
      },
      {
        id: 12,
        menuId: 'record-plan',
        name: '录像计划',
        path: '/video/record-plan',
        component: 'RecordPlanList',
        title: '录像计划',
        parentId: 9,
        parentMenuId: 'video',
        sort: 3,
        type: 'menu',
        status: 1
      }
    ]
  },
  {
    id: 13,
    menuId: 'ptz',
    name: '云台控制',
    icon: 'Setting',
    path: '/ptz',
    component: 'PTZControl',
    title: '云台控制',
    parentId: 0,
    parentMenuId: '',
    sort: 5,
    type: 'menu',
    status: 1
  },
  {
    id: 14,
    menuId: 'alarm',
    name: '报警管理',
    icon: 'Bell',
    path: '/alarm',
    component: 'AlarmManagement',
    title: '报警管理',
    parentId: 0,
    parentMenuId: '',
    sort: 6,
    type: 'menu',
    status: 1
  },
  {
    id: 15,
    menuId: 'map',
    name: '电子地图',
    icon: 'MapLocation',
    path: '/map',
    component: 'ElectronicMap',
    title: '电子地图',
    parentId: 0,
    parentMenuId: '',
    sort: 7,
    type: 'menu',
    status: 1
  },
  {
    id: 16,
    menuId: 'permission',
    name: '权限管理',
    icon: 'User',
    path: '/permission',
    title: '权限管理',
    parentId: 0,
    parentMenuId: '',
    sort: 8,
    type: 'directory',
    status: 1,
    children: [
      {
        id: 17,
        menuId: 'user-management',
        name: '用户管理',
        path: '/permission/users',
        component: 'UserManagement',
        title: '用户管理',
        parentId: 16,
        parentMenuId: 'permission',
        sort: 1,
        type: 'menu',
        status: 1
      },
      {
        id: 18,
        menuId: 'role-management',
        name: '角色管理',
        path: '/permission/roles',
        component: 'RoleManagement',
        title: '角色管理',
        parentId: 16,
        parentMenuId: 'permission',
        sort: 2,
        type: 'menu',
        status: 1
      },
      {
        id: 19,
        menuId: 'menu-management',
        name: '菜单管理',
        path: '/permission/menus',
        component: 'MenuManagement',
        title: '菜单管理',
        parentId: 16,
        parentMenuId: 'permission',
        sort: 3,
        type: 'menu',
        status: 1
      }
    ]
  },
  {
    id: 20,
    menuId: 'system',
    name: '系统管理',
    icon: 'Setting',
    path: '/system',
    title: '系统管理',
    parentId: 0,
    parentMenuId: '',
    sort: 9,
    type: 'directory',
    status: 1,
    children: [
      {
        id: 21,
        menuId: 'system-settings',
        name: '系统设置',
        path: '/system/settings',
        component: 'SystemSettings',
        title: '系统设置',
        parentId: 20,
        parentMenuId: 'system',
        sort: 1,
        type: 'menu',
        status: 1
      },
      {
        id: 22,
        menuId: 'system-logs',
        name: '系统日志',
        path: '/system/logs',
        component: 'SystemLogs',
        title: '系统日志',
        parentId: 20,
        parentMenuId: 'system',
        sort: 2,
        type: 'menu',
        status: 1
      }
    ]
  }
]

// Mock roles data
const mockRoles = [
  { id: 1, name: '超级管理员', code: 'ROLE_SUPER_ADMIN', createdTime: 1234567890, updatedTime: 1234567890 },
  { id: 2, name: '管理员', code: 'ROLE_ADMIN', createdTime: 1234567890, updatedTime: 1234567890 },
  { id: 3, name: '操作员', code: 'ROLE_OPERATOR', createdTime: 1234567890, updatedTime: 1234567890 },
  { id: 4, name: '访客', code: 'ROLE_GUEST', createdTime: 1234567890, updatedTime: 1234567890 }
]

// Mock users data
const mockUsers = Array.from({ length: 25 }, (_, i) => ({
  id: i + 1,
  email: `user${i + 1}@example.com`,
  nickname: `用户${i + 1}`,
  avatar: '',
  verifiedMobile: '',
  emailVerified: 1,
  roles: i === 0
    ? [{ name: '超级管理员', code: 'ROLE_SUPER_ADMIN' }]
    : i < 5
      ? [{ name: '管理员', code: 'ROLE_ADMIN' }]
      : [{ name: '操作员', code: 'ROLE_OPERATOR' }],
  locked: 0,
  lockDeadline: 0,
  consecutivePasswordErrorTimes: 0,
  lastPasswordFailTime: 0,
  loginTime: Date.now() / 1000 - Math.random() * 86400,
  loginIp: `192.168.1.${100 + i}`,
  approvalTime: 0,
  approvalStatus: 'unapprove',
  createdIp: '127.0.0.1',
  createdTime: 1234567890 + i,
  updatedTime: 1234567890 + i,
  orgId: 1,
  orgCode: '1.',
  registeredWay: '',
  uuid: `uuid-${i + 1}`,
  passwordInit: 1,
  registerVisitId: '',
  destroyed: 0,
  type: 'default',
  setup: 1
}))

// Menu management mocks
export const getMenuTreeMock = (options: any) => {
  return { code: 0, msg: 'success', data: mockMenus }
}

export const getUserMenuTreeMock = (options: any) => {
  // Return all menus for admin (mock)
  return { code: 0, msg: 'success', data: mockMenus }
}

export const getMenusMock = (options: any) => {
  const start = Number(options.query?.start || 0)
  const limit = Number(options.query?.limit || 10)
  const flatMenus = mockMenus.map(m => ({
    ...m,
    children: undefined
  }))
  return {
    code: 0,
    msg: 'success',
    data: {
      total: flatMenus.length,
      list: flatMenus.slice(start, start + limit)
    }
  }
}

export const createMenuMock = (options: any) => {
  const body = options.body ? JSON.parse(options.body) : {}
  return {
    code: 0,
    msg: 'success',
    data: {
      id: Date.now(),
      ...body,
      createdTime: Math.floor(Date.now() / 1000)
    }
  }
}

export const updateMenuMock = (options: any) => {
  return { code: 0, msg: 'success', data: null }
}

export const deleteMenuMock = (options: any) => {
  return { code: 0, msg: 'success', data: null }
}

export const getMenuTypeOptionsMock = (options: any) => {
  return {
    code: 0,
    msg: 'success',
    data: [
      { value: 'directory', label: '目录' },
      { value: 'menu', label: '菜单页' },
      { value: 'path', label: '路径页' },
      { value: 'api', label: 'API' }
    ]
  }
}

// Role management mocks
export const getRoleOptionsMock = (options: any) => {
  return {
    code: 0,
    msg: 'success',
    data: mockRoles.map(r => ({ value: r.id, label: r.name, code: r.code }))
  }
}

export const getRolesMock = (options: any) => {
  const start = Number(options.query?.start || 0)
  const limit = Number(options.query?.limit || 10)
  return {
    code: 0,
    msg: 'success',
    data: {
      total: mockRoles.length,
      list: mockRoles.slice(start, start + limit)
    }
  }
}

export const getRoleDetailMock = (options: any) => {
  const id = Number(options.url?.match(/\/admin\/role\/(\d+)/)?.[1] || 1)
  const role = mockRoles.find(r => r.id === id)
  return {
    code: 0,
    msg: 'success',
    data: {
      ...role,
      menuIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]
    }
  }
}

export const createRoleMock = (options: any) => {
  const body = options.body ? JSON.parse(options.body) : {}
  return {
    code: 0,
    msg: 'success',
    data: {
      id: Date.now(),
      ...body,
      createdTime: Math.floor(Date.now() / 1000)
    }
  }
}

export const updateRoleMock = (options: any) => {
  return { code: 0, msg: 'success', data: null }
}

export const deleteRoleMock = (options: any) => {
  return { code: 0, msg: 'success', data: null }
}

export const getRoleMenusMock = (options: any) => {
  return {
    code: 0,
    msg: 'success',
    data: mockMenus
  }
}

export const assignRoleMenusMock = (options: any) => {
  return { code: 0, msg: 'success', data: null }
}

// User management mocks
export const getUserRoleOptionsMock = (options: any) => {
  return {
    code: 0,
    msg: 'success',
    data: [
      { value: 'ROLE_SUPER_ADMIN', label: '超级管理员' },
      { value: 'ROLE_ADMIN', label: '管理员' },
      { value: 'ROLE_OPERATOR', label: '操作员' },
      { value: 'ROLE_GUEST', label: '访客' }
    ]
  }
}

export const getUsersMock = (options: any) => {
  const start = Number(options.query?.start || 0)
  const limit = Number(options.query?.limit || 10)
  return {
    code: 0,
    msg: 'success',
    data: {
      total: mockUsers.length,
      list: mockUsers.slice(start, start + limit)
    }
  }
}

export const getUserDetailMock = (options: any) => {
  const id = Number(options.url?.match(/\/admin\/user\/(\d+)/)?.[1] || 1)
  const user = mockUsers.find(u => u.id === id)
  return {
    code: 0,
    msg: 'success',
    data: user
  }
}

export const createUserMock = (options: any) => {
  const body = options.body ? JSON.parse(options.body) : {}
  return {
    code: 0,
    msg: 'success',
    data: {
      id: Date.now(),
      ...body,
      createdTime: Math.floor(Date.now() / 1000)
    }
  }
}

export const updateUserMock = (options: any) => {
  return { code: 0, msg: 'success', data: null }
}

export const deleteUserMock = (options: any) => {
  return { code: 0, msg: 'success', data: null }
}

export const mockGetUserUuid = (options: any) => {
  return {
    code: 0,
    msg: 'success',
    data: {
      uuid: 'mock-uuid-12345678-abcd-1234-abcd-1234567890ab'
    }
  }
}