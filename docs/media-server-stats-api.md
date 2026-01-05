# 流媒体服务器统计数据 API 文档

## 概述

本文档描述流媒体服务器统计数据 API 的返回数据结构，该接口用于获取流媒体服务器的实时运行状态和性能指标，主要用于监控仪表盘和数据可视化展示。

---

## API 接口

### 获取流媒体服务器统计数据

**请求**
```
GET /admin/api/media-servers/:id/stats
```

**路径参数**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 流媒体服务器ID |

**响应格式**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    // 服务状态
    "running": true,
    "status": "running",
    "version": "master",
    "build_date": "2023-04-19T10:34:34",
    "git_hash": "f143898",

    // 当前快照数据
    "snapshot": {
      "cpu_usage": 25.5,
      "memory_usage": 0,
      "stream_count": 10,
      "total_connection_count": 25,
      "bytes_speed": 1024000,
      "network_thread_count": 4,
      "work_thread_count": 2
    },

    // 网络线程负载数据
    "thread_load": {
      "data": [...],
      "timestamp": 1704364800
    },

    // 工作线程负载数据
    "work_thread_load": {
      "data": [...],
      "timestamp": 1704364800
    },

    // 对象统计
    "statistics": {...}
  }
}
```

---

## 返回数据结构详解

### 1. 服务状态 (Service Status)

| 字段 | 类型 | 说明 |
|------|------|------|
| running | boolean | 服务器是否正在运行 |
| status | string | 运行状态：`running`（运行中）、`stopped`（已停止）、`unknown`（未知） |
| version | string | 版本分支名称（如：master） |
| build_date | string | 编译时间（ISO 8601 格式） |
| git_hash | string | Git 提交哈希值 |

### 2. 当前快照数据 (Snapshot)

用于仪表盘实时显示的单值指标。

| 字段 | 类型 | 说明 |
|------|------|------|
| cpu_usage | number | CPU 使用率（百分比），取网络线程和工作线程的最大负载值 |
| memory_usage | number | 内存使用率（百分比），ZLM 不直接提供，暂为 0 |
| stream_count | number | 当前流数量 |
| total_connection_count | number | 总连接数（观看者数量） |
| bytes_speed | number | 数据产生速度（字节/秒） |
| network_thread_count | number | 网络线程数量 |
| work_thread_count | number | 工作线程数量 |

### 3. 网络线程负载数据 (Thread Load)

用于 Echart 折线图展示的时间序列数据。

**数据结构**
```json
{
  "data": [
    {
      "timestamp": 1704364800,
      "thread_index": 0,
      "thread_name": "thread_0",
      "load": 25,
      "delay": 0,
      "fd_count": 128
    },
    {
      "timestamp": 1704364800,
      "thread_index": 1,
      "thread_name": "thread_1",
      "load": 30,
      "delay": 0,
      "fd_count": 96
    }
    // ... 更多线程数据
  ],
  "timestamp": 1704364800
}
```

**字段说明**
| 字段 | 类型 | 说明 |
|------|------|------|
| timestamp | number | Unix 时间戳（秒） |
| thread_index | number | 线程索引（从 0 开始） |
| thread_name | string | 线程名称 |
| load | number | 线程负载百分比（0-100） |
| delay | number | 线程延迟（毫秒） |
| fd_count | number | 文件描述符数量 |

### 4. 工作线程负载数据 (Work Thread Load)

格式与网络线程负载数据相同，用于后台工作线程的性能监控。

```json
{
  "data": [
    {
      "timestamp": 1704364800,
      "thread_index": 0,
      "thread_name": "work_thread_0",
      "load": 15,
      "delay": 0,
      "fd_count": 64
    }
    // ... 更多工作线程数据
  ],
  "timestamp": 1704364800
}
```

### 5. 对象统计 (Statistics)

用于内存性能分析的对象数量统计。

```json
{
  "Buffer": 2,
  "BufferLikeString": 1,
  "BufferList": 0,
  "BufferRaw": 1,
  "Frame": 0,
  "FrameImp": 0,
  "MediaSource": 5,
  "MultiMediaSourceMuxer": 0,
  "Socket": 66,
  "TcpClient": 0,
  "TcpServer": 64,
  "TcpSession": 1
}
```

---

## 前端使用示例

### 1. 基础请求

```typescript
import { mediaServerApi } from '@/api/mediaServerApi'

// 获取服务器统计数据
const response = await mediaServerApi.getStats(1)

if (response.code === 0) {
  const data = response.data

  // 显示服务器状态
  console.log('运行状态:', data.status)
  console.log('版本:', data.version)
}
```

### 2. 显示仪表盘快照

```vue
<template>
  <div class="dashboard">
    <el-card>
      <div class="stat-item">
        <span>CPU 使用率</span>
        <progress :value="data.snapshot.cpu_usage" max="100">
          {{ data.snapshot.cpu_usage }}%
        </progress>
      </div>
      <div class="stat-item">
        <span>流数量</span>
        <span>{{ data.snapshot.stream_count }}</span>
      </div>
      <div class="stat-item">
        <span>连接数</span>
        <span>{{ data.snapshot.total_connection_count }}</span>
      </div>
    </el-card>
  </div>
</template>
```

### 3. 绘制网络线程负载折线图 (Echart)

```typescript
import * as echarts from 'echarts'

// 准备数据
const threadLoadData = response.data.thread_load.data

// 按线程分组
const threadMap = new Map()
threadLoadData.forEach(item => {
  if (!threadMap.has(item.thread_index)) {
    threadMap.set(item.thread_index, {
      name: item.thread_name,
      data: []
    })
  }
  threadMap.get(item.thread_index).data.push([
    item.timestamp * 1000, // Echart 需要毫秒时间戳
    item.load
  ])
})

// 构建系列数据
const series = Array.from(threadMap.values()).map(thread => ({
  name: thread.name,
  type: 'line',
  data: thread.data
}))

// 配置图表
const option = {
  title: { text: '网络线程负载' },
  tooltip: { trigger: 'axis' },
  legend: { data: series.map(s => s.name) },
  xAxis: {
    type: 'time',
    axisLabel: { formatter: '{HH}:{mm}:{ss}' }
  },
  yAxis: {
    type: 'value',
    max: 100,
    axisLabel: { formatter: '{value}%' }
  },
  series
}

const chart = echarts.init(document.getElementById('thread-load-chart'))
chart.setOption(option)
```

### 4. 绘制工作线程负载折线图

```typescript
// 工作线程负载图表
const workThreadLoadData = response.data.work_thread_load.data

// 使用与网络线程相同的处理逻辑
const workThreadSeries = processThreadData(workThreadLoadData)

const option = {
  title: { text: '工作线程负载' },
  xAxis: { type: 'time' },
  yAxis: { type: 'value', max: 100 },
  series: workThreadSeries
}
```

### 5. 实时轮询更新

```typescript
import { ref, onMounted, onUnmounted } from 'vue'

const statsData = ref(null)
let timer = null

const fetchStats = async () => {
  const response = await mediaServerApi.getStats(serverId.value)
  if (response.code === 0) {
    statsData.value = response.data
  }
}

onMounted(() => {
  fetchStats()
  // 每 5 秒更新一次
  timer = setInterval(fetchStats, 5000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
```

### 6. 多线程对比图表

```typescript
// 同时显示网络线程和工作线程
const option = {
  title: { text: '线程负载对比' },
  tooltip: { trigger: 'axis' },
  legend: { data: ['网络线程平均', '工作线程平均'] },
  xAxis: { type: 'time' },
  yAxis: {
    type: 'value',
    max: 100,
    axisLabel: { formatter: '{value}%' }
  },
  series: [
    {
      name: '网络线程平均',
      type: 'line',
      data: networkThreadAverageData
    },
    {
      name: '工作线程平均',
      type: 'line',
      data: workThreadAverageData
    }
  ]
}
```

### 7. 对象统计柱状图

```typescript
const statistics = response.data.statistics

const option = {
  title: { text: '对象统计' },
  tooltip: { trigger: 'axis' },
  xAxis: {
    type: 'category',
    data: Object.keys(statistics)
  },
  yAxis: { type: 'value' },
  series: [{
    type: 'bar',
    data: Object.values(statistics)
  }]
}
```

---

## 数据存储与历史查询说明

### 当前实现

- `getStats` 接口返回的是**实时数据快照**
- 每次请求都会获取最新的服务器状态
- 线程负载数据包含时间戳，可用于前端累积历史数据

### 历史数据支持（待扩展）

如需支持历史数据查询和持久化存储，需要：

1. **创建历史数据表**
   ```sql
   CREATE TABLE `gv_media_server_stats_history` (
     `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
     `server_id` bigint(20) unsigned NOT NULL,
     `timestamp` int(11) NOT NULL,
     `cpu_usage` decimal(5,2) DEFAULT 0,
     `stream_count` int(11) DEFAULT 0,
     `connection_count` int(11) DEFAULT 0,
     `thread_load_data` json,
     `work_thread_load_data` json,
     PRIMARY KEY (`id`),
     KEY `idx_server_timestamp` (`server_id`, `timestamp`)
   );
   ```

2. **定时任务采集数据**
   - 每隔 N 秒调用 `getStats` 接口
   - 将数据存储到历史表

3. **新增历史查询接口**
   ```
   GET /admin/api/media-servers/:id/stats/history
   ?start_time=1704360000
   &end_time=1704450000
   &interval=60  // 数据聚合间隔（秒）
   ```

---

## 错误处理

### 服务器离线/无法连接

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "running": false,
    "status": "unknown",
    "error": "Connection refused"
  }
}
```

前端应根据 `running` 字段判断服务器是否在线，并展示相应的错误状态。

---

## 注意事项

1. **线程负载范围**：`load` 值范围是 0-100，表示百分比
2. **时间戳格式**：返回的是 Unix 时间戳（秒），前端需要转换为毫秒用于 Echart
3. **内存使用率**：ZLMediaKit 不直接提供内存使用率，该字段目前为 0
4. **性能建议**：建议轮询间隔不低于 5 秒，避免频繁请求影响服务器性能
5. **数据缓存**：后端会缓存统计数据到 `gv_media_servers` 表，`last_sync_at` 字段记录最后同步时间
