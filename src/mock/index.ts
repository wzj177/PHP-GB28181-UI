import Mock from 'mockjs'


const realApiPrefixes = ['/admin/auth/captcha', 'admin/auth/login', '/admin/auth/logout', '/admin/auth/userinfo']


export const isRealApiUrl = (url: string): boolean => {
  if (!url) return false

  let path = url

  // 处理完整 URL 的情况
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      path = new URL(url).pathname
    } catch {
      return false
    }
  }

  return realApiPrefixes.some(prefix => path.startsWith(prefix))
}

Mock.XHR.prototype.send = (function (send) {
  return function () {
    if (isRealApiUrl(this.custom.url)) {
      console.log(`Bypassing mock for real API URL: ${this.custom.url}`)
      return send.apply(this, arguments as any)
    }
    send.apply(this, arguments as any)
  }
})(Mock.XHR.prototype.send)

// Mock device tree data
Mock.mock('/api/devices/tree', 'get', () => {
  return Mock.mock({
    code: 200,
    message: 'success',
    'data|3-6': [
      {
        id: '@guid',
        name: '@cname 设备组',
        'children|2-5': [
          {
            id: '@guid',
            name: '@cname IPC',
            online: '@boolean',
            type: 'ipc',
            'channels|1-4': [
              {
                id: '@guid',
                name: '通道 @natural(1,16)',
                status: '@pick(["online", "offline", "motion_detect"])',
                type: 'video-channel',
                rtspUrl: 'rtsp://example.com/stream'
              }
            ]
          }
        ]
      }
    ]
  })
})

// Mock PTZ control
Mock.mock(/\/api\/devices\/[\w]+\/ptz\/control/, 'post', (options: any) => {
  const body = JSON.parse(options.body)
  console.log('PTZ Control:', body)
  return {
    code: 200,
    message: 'PTZ command sent successfully',
    data: null
  }
})

// Mock preset positions
Mock.mock(/\/api\/devices\/[\w]+\/presets/, 'get', () => {
  return Mock.mock({
    code: 200,
    message: 'success',
    'data|0-8': [
      {
        id: '@guid',
        name: '预置位 @natural(1,8)',
        description: '@sentence'
      }
    ]
  })
})

// Mock set preset
Mock.mock(/\/api\/devices\/[\w]+\/presets\/[\w]+\/set/, 'post', () => {
  return {
    code: 200,
    message: 'Preset saved successfully',
    data: null
  }
})

// Mock go to preset
Mock.mock(/\/api\/devices\/[\w]+\/presets\/[\w]+\/go/, 'post', () => {
  return {
    code: 200,
    message: 'Moving to preset position...',
    data: null
  }
})

// Mock recordings
Mock.mock('/api/recordings', 'get', (options: any) => {
  // Parse query parameters
  const urlParams = new URLSearchParams(options.url.split('?')[1])
  const deviceId = urlParams.get('deviceId')
  const channelId = urlParams.get('channelId')
  const startTime = urlParams.get('startTime')
  const endTime = urlParams.get('endTime')

  // Generate mock recordings
  const recordings = []
  const count = Math.floor(Math.random() * 10) + 5
  
  for (let i = 0; i < count; i++) {
    const start = new Date()
    start.setDate(start.getDate() - Math.floor(Math.random() * 7)) // Random day in past week
    start.setHours(Math.floor(Math.random() * 24))
    start.setMinutes(Math.floor(Math.random() * 60))
    start.setSeconds(Math.floor(Math.random() * 60))
    
    const end = new Date(start.getTime())
    end.setMinutes(end.getMinutes() + Math.floor(Math.random() * 60) + 5) // Duration 5-65 minutes
    
    recordings.push({
      id: Mock.Random.guid(),
      deviceId,
      channelId,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      duration: Math.floor((end.getTime() - start.getTime()) / 1000 / 60), // in minutes
      fileSize: `${Math.floor(Math.random() * 500) + 50}MB`,
      type: Mock.Random.pick(['motion', 'manual', 'schedule'])
    })
  }

  return {
    code: 200,
    message: 'success',
    data: recordings
  }
})

// Mock download recording
Mock.mock(/\/api\/recordings\/[\w]+\/download/, 'get', () => {
  // Return a mock blob response (simulated)
  return {
    code: 200,
    message: 'Download started',
    data: null
  }
})

// Mock alarms
Mock.mock('/api/alarms', 'get', (options: any) => {
  // Parse query parameters
  const urlParams = new URLSearchParams(options.url.split('?')[1])
  const page = parseInt(urlParams.get('page') || '1')
  const pageSize = parseInt(urlParams.get('pageSize') || '10')
  const status = urlParams.get('status')
  
  // Generate mock alarms
  const total = 50
  const startIndex = (page - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, total)
  const alarms = []
  
  for (let i = startIndex; i < endIndex; i++) {
    alarms.push({
      id: Mock.Random.guid(),
      deviceId: Mock.Random.guid(),
      deviceName: `IPC-${Mock.Random.natural(1000, 9999)}`,
      channel: `通道 ${Mock.Random.natural(1, 16)}`,
      type: Mock.Random.pick(['motion', 'tamper', 'disconnect', 'storage_full']),
      status: Mock.Random.pick(['active', 'acknowledged', 'cleared']),
      description: Mock.Random.cparagraph(1, 3),
      timestamp: new Date(Date.now() - Mock.Random.natural(0, 3600000)).toISOString(),
      severity: Mock.Random.pick(['low', 'medium', 'high', 'critical'])
    })
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
  }
})

// Mock update alarm status
Mock.mock(/\/api\/alarms\/[\w]+\/status/, 'put', (options: any) => {
  const body = JSON.parse(options.body)
  return {
    code: 200,
    message: `Alarm status updated to ${body.status}`,
    data: null
  }
})

// Mock map devices
Mock.mock('/api/map/devices', 'get', () => {
  return Mock.mock({
    code: 200,
    message: 'success',
    'data|10-30': [
      {
        id: '@guid',
        name: '@cname IPC',
        lng: 116.3 + Math.random() * 0.2, // Beijing coordinates
        lat: 39.9 + Math.random() * 0.2,
        online: '@boolean',
        status: '@pick(["normal", "motion_detect", "alarm"])',
        address: '@county(true)'
      }
    ]
  })
})

// Mock login
Mock.mock('/api/auth/login', 'post', (options: any) => {
  const body = JSON.parse(options.body)
  const { username, password } = body

  // Mock authentication logic
  if (username === 'admin' && password === '123456') {
    return {
      code: 200,
      message: '登录成功',
      data: {
        token: `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        expiresIn: 3600 // 1 hour
      }
    }
  } else {
    return {
      code: 401,
      message: '用户名或密码错误',
      data: null
    }
  }
})

// Mock logout
Mock.mock('/api/auth/logout', 'post', () => {
  return {
    code: 200,
    message: '退出成功',
    data: null
  }
})

// Mock user info
Mock.mock('/api/auth/userinfo', 'get', () => {
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
  }
})

export default Mock