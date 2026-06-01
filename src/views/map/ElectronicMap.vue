<template>
  <div class="emap-page">
    <!-- 左侧面板 -->
    <div class="emap-sidebar">
      <div class="sidebar-header">
        <span class="sidebar-title">电子地图</span>
        <el-button :icon="Refresh" circle size="small" :loading="loading" @click="onRefresh" />
      </div>

      <!-- 模式切换 -->
      <div class="mode-switch">
        <el-radio-group v-model="mode" size="small" @change="onModeChange">
          <el-radio-button value="points">点位模式</el-radio-button>
          <el-radio-button value="tracks">轨迹模式</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 搜索 -->
      <div class="search-bar">
        <el-input
          v-model="keyword"
          placeholder="搜索设备"
          clearable
          size="small"
          :prefix-icon="Search"
        />
      </div>

      <!-- 轨迹模式：时间范围 -->
      <template v-if="mode === 'tracks'">
        <div class="track-time-section">
          <div class="section-label">时间范围</div>
          <el-date-picker
            v-model="trackTimeRange"
            type="datetimerange"
            size="small"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </div>
        <el-button
          type="primary"
          size="small"
          :loading="trackLoading"
          :disabled="selectedDeviceIds.size === 0 || !trackTimeRange"
          style="width: 100%; margin-bottom: 8px"
          @click="loadTracks"
        >
          查询轨迹（已选 {{ selectedDeviceIds.size }} 台）
        </el-button>
      </template>

      <!-- 设备列表头 -->
      <div class="device-list-header">
        <el-checkbox
          :model-value="isAllSelected"
          :indeterminate="isIndeterminate"
          @change="toggleSelectAll"
        >
          全选
        </el-checkbox>
        <span class="device-count">{{ filteredDevices.length }} 台</span>
      </div>

      <!-- 设备列表 -->
      <div class="device-list">
        <div
          v-for="dev in filteredDevices"
          :key="dev.device_id"
          class="device-item"
          :class="{ selected: selectedDeviceIds.has(dev.device_id) }"
          @click="toggleDevice(dev.device_id)"
        >
          <el-checkbox
            :model-value="selectedDeviceIds.has(dev.device_id)"
            @change="toggleDevice(dev.device_id)"
            @click.stop
          />
          <div class="device-info">
            <div class="device-name">{{ dev.device_name || dev.device_id }}</div>
            <div class="device-channel">{{ dev.channel_name }}</div>
          </div>
          <el-button
            v-if="mode === 'points'"
            type="primary"
            link
            size="small"
            @click.stop="locateDevice(dev)"
          >
            定位
          </el-button>
        </div>
        <div v-if="filteredDevices.length === 0 && !loading" class="empty-hint">
          暂无设备数据
        </div>
      </div>
    </div>

    <!-- 地图区域 -->
    <div class="emap-map">
      <div id="amap-container" v-loading="loading || trackLoading" />

      <!-- 图例 -->
      <div class="map-legend">
        <template v-if="mode === 'points'">
          <div class="legend-item">
            <span class="dot" style="background:#409EFF" />有坐标
          </div>
        </template>
        <template v-else>
          <div
            v-for="(color, idx) in visibleTrackColors"
            :key="idx"
            class="legend-item"
          >
            <span class="dot" :style="`background:${color}`" />{{ visibleTrackDevices[idx] }}
          </div>
        </template>
      </div>

      <!-- 地图未加载提示 -->
      <div v-if="mapError" class="map-error">
        <el-result icon="warning" title="地图加载失败" :sub-title="mapError" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
// @ts-ignore - useRouter is available via vue-router (TS cache false positive)
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import { mapApi } from '@/api/mapApi'
import type { MapPoint, DeviceTrack } from '@/api/mapApi'

declare global {
  interface Window { AMap: any }
}
// eslint-disable-next-line no-var
declare const AMap: any

const router = useRouter()

// ===================== state ======================

const mode = ref<'points' | 'tracks'>('points')
const loading = ref(false)
const trackLoading = ref(false)
const mapError = ref('')
const keyword = ref('')
const trackTimeRange = ref<[string, string] | null>(null)

// 地图实例
const mapInstance = ref<any>(null)
const infoWindow = ref<any>(null)

// 点位数据 & 标记
const points = ref<MapPoint[]>([])
const markers = ref<any[]>([])

// 轨迹数据 & 折线
const polylines = ref<any[]>([])
const arrowDecorators = ref<any[]>([])

// 设备列表（从点位数据去重）
const deviceList = ref<MapPoint[]>([])
const selectedDeviceIds = ref(new Set<string>())

// 轨迹图例
const TRACK_COLORS = [
  '#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#9B59B6',
  '#1ABC9C', '#E67E22', '#2ECC71', '#E74C3C', '#3498DB'
]
const visibleTrackDevices = ref<string[]>([])
const visibleTrackColors = ref<string[]>([])

// ===================== computed =====================

const filteredDevices = computed(() => {
  if (!keyword.value) return deviceList.value
  const kw = keyword.value.toLowerCase()
  return deviceList.value.filter(d =>
    (d.device_name || '').toLowerCase().includes(kw) ||
    d.device_id.toLowerCase().includes(kw) ||
    (d.channel_name || '').toLowerCase().includes(kw)
  )
})

const isAllSelected = computed(() =>
  filteredDevices.value.length > 0 &&
  filteredDevices.value.every(d => selectedDeviceIds.value.has(d.device_id))
)

const isIndeterminate = computed(() => {
  const cnt = filteredDevices.value.filter(d => selectedDeviceIds.value.has(d.device_id)).length
  return cnt > 0 && cnt < filteredDevices.value.length
})

// ===================== map init =====================

const waitAMap = (): Promise<void> => new Promise(resolve => {
  if (window.AMap) { resolve(); return }
  const t = setInterval(() => {
    if (window.AMap) { clearInterval(t); resolve() }
  }, 200)
  // 10s timeout
  setTimeout(() => { clearInterval(t); resolve() }, 10000)
})

const initMap = async () => {
  await waitAMap()
  if (!window.AMap) {
    mapError.value = '高德地图 SDK 未加载，请检查 VITE_AMAP_KEY 配置'
    return
  }
  mapInstance.value = new AMap.Map('amap-container', {
    zoom: 12,
    center: [104.065735, 30.659462], // 默认成都
    viewMode: '2D'
  } as any)
  infoWindow.value = new AMap.InfoWindow({ offset: { x: 0, y: -36 } })
}

// ===================== points =====================

const loadPoints = async () => {
  loading.value = true
  try {
    const res = await mapApi.getMapPoints()
    points.value = res.points || []
    // 去重生成设备列表（每个 device_id 取第一个点）
    const seen = new Set<string>()
    deviceList.value = []
    for (const p of points.value) {
      if (!seen.has(p.device_id)) {
        seen.add(p.device_id)
        deviceList.value.push(p)
      }
    }
    renderPoints()
  } catch (e: any) {
    ElMessage.error(e.message || '获取点位失败')
  } finally {
    loading.value = false
  }
}

const clearMarkers = () => {
  if (mapInstance.value) {
    markers.value.forEach(m => mapInstance.value.remove(m))
  }
  markers.value = []
}

const renderPoints = () => {
  if (!mapInstance.value) return
  clearMarkers()
  const visible = selectedDeviceIds.value.size > 0
    ? points.value.filter(p => selectedDeviceIds.value.has(p.device_id))
    : points.value

  const lnglats: [number, number][] = []

  for (const p of visible) {
    if (!p.longitude || !p.latitude) continue
    const marker = createPointMarker(p)
    mapInstance.value.add(marker)
    markers.value.push(marker)
    lnglats.push([p.longitude, p.latitude])
  }

  if (lnglats.length > 0) fitBounds(lnglats)
}

const createPointMarker = (p: MapPoint) => {
  const content = `
    <div class="amap-device-marker" title="${p.channel_name || p.device_id}">
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
        <path d="M14 0C6.268 0 0 6.268 0 14 0 26.25 14 40 14 40S28 26.25 28 14C28 6.268 21.732 0 14 0Z"
          fill="#409EFF" stroke="#fff" stroke-width="2"/>
        <circle cx="14" cy="14" r="5" fill="#fff"/>
      </svg>
      <div class="amap-device-label">${p.channel_name || p.device_id}</div>
    </div>
  `
  const marker = new AMap.Marker({
    position: [p.longitude, p.latitude],
    content,
    extData: p
  } as any)
  marker.on('click', () => showInfoWindow(p, marker))
  return marker
}

const showInfoWindow = (p: MapPoint, marker: any) => {
  if (!infoWindow.value) return
  const html = `
    <div class="amap-info-panel">
      <div class="info-title">${p.channel_name || p.device_id}</div>
      <div class="info-row"><span>设备ID：</span>${p.device_id}</div>
      <div class="info-row"><span>通道ID：</span>${p.channel_id}</div>
      <div class="info-row"><span>设备名称：</span>${p.device_name || '-'}</div>
      <div class="info-row"><span>坐标：</span>${p.longitude.toFixed(6)}, ${p.latitude.toFixed(6)}</div>
      <div class="info-row"><span>自定义：</span>${p.is_custom ? '是' : '否'}</div>
      <div class="info-actions">
        <a href="javascript:void(0)" onclick="window.__mapGoRecordings('${p.device_id}','${p.channel_id}')">查看录像</a>
      </div>
    </div>
  `
  infoWindow.value.setContent(html)
  infoWindow.value.open(mapInstance.value, marker.getPosition())
}

// 挂载全局跳转函数
const setupGlobalHandlers = () => {
  ;(window as any).__mapGoRecordings = (device_id: string, channel_id: string) => {
    infoWindow.value?.close()
    router.push({ path: '/cloud-recordings', query: { device_id, channel_id } })
  }
}

// ===================== tracks =====================

const clearTracks = () => {
  if (mapInstance.value) {
    polylines.value.forEach(l => mapInstance.value.remove(l))
    arrowDecorators.value.forEach(d => mapInstance.value.remove(d))
  }
  polylines.value = []
  arrowDecorators.value = []
  visibleTrackDevices.value = []
  visibleTrackColors.value = []
}

const loadTracks = async () => {
  if (!trackTimeRange.value || selectedDeviceIds.value.size === 0) {
    ElMessage.warning('请选择设备和时间范围')
    return
  }
  const device_ids = Array.from(selectedDeviceIds.value).join(',')
  const [start_time, end_time] = trackTimeRange.value
  trackLoading.value = true
  try {
    const res = await mapApi.getMapTracks({ device_ids, start_time, end_time })
    clearTracks()
    renderTracks(res.tracks || [])
  } catch (e: any) {
    ElMessage.error(e.message || '获取轨迹失败')
  } finally {
    trackLoading.value = false
  }
}

const renderTracks = (tracks: DeviceTrack[]) => {
  if (!mapInstance.value) return
  if (tracks.length === 0) { ElMessage.info('该时间段内暂无轨迹数据'); return }

  const allLnglats: [number, number][] = []

  tracks.forEach((track, idx) => {
    if (!track.track || track.track.length === 0) return
    const color = TRACK_COLORS[idx % TRACK_COLORS.length]
    const path: [number, number][] = track.track.map(t => [t.longitude, t.latitude])
    allLnglats.push(...path)

    // 折线
    const polyline = new (AMap as any).Polyline({
      path,
      strokeColor: color,
      strokeWeight: 4,
      strokeOpacity: 0.9,
      lineJoin: 'round',
      lineCap: 'round'
    })
    mapInstance.value.add(polyline)
    polylines.value.push(polyline)

    // 箭头装饰
    try {
      const AMapAny = AMap as any
      if (AMapAny.PolylineDecorator) {
        const arrow = new AMapAny.PolylineDecorator(polyline, {
          symbol: new AMapAny.Symbol({
            symbolType: 'arrow',
            strokeColor: color,
            size: 8,
            lineWeight: 2
          }),
          interval: 60
        })
        mapInstance.value.add(arrow)
        arrowDecorators.value.push(arrow)
      }
    } catch {}

    // 起点/终点标记
    const startPt = path[0]
    const endPt = path[path.length - 1]
    addTrackEndpoint(startPt, '起', color)
    addTrackEndpoint(endPt, '终', color)

    // 图例
    const devName = deviceList.value.find(d => d.device_id === track.device_id)
    visibleTrackDevices.value.push(devName?.channel_name || track.device_id)
    visibleTrackColors.value.push(color)
  })

  if (allLnglats.length > 0) fitBounds(allLnglats)
}

const addTrackEndpoint = (pos: [number, number], label: string, color: string) => {
  const content = `<div style="background:${color};color:#fff;border-radius:50%;width:20px;height:20px;line-height:20px;text-align:center;font-size:11px;font-weight:bold;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)">${label}</div>`
    const m = new AMap.Marker({ position: pos, content } as any)
  mapInstance.value.add(m)
  markers.value.push(m)
}

// ===================== helpers =====================

const fitBounds = (lnglats: [number, number][]) => {
  if (!mapInstance.value || lnglats.length === 0) return
  if (lnglats.length === 1) {
    mapInstance.value.setCenter(lnglats[0])
    mapInstance.value.setZoom(15)
    return
  }
  mapInstance.value.setFitView()
}

const locateDevice = (dev: MapPoint) => {
  if (!mapInstance.value || !dev.longitude || !dev.latitude) {
    ElMessage.warning('该设备暂无坐标信息')
    return
  }
  mapInstance.value.setCenter([dev.longitude, dev.latitude])
  mapInstance.value.setZoom(16)
  const marker = markers.value.find(m => {
    const data = m.getExtData?.()
    return data?.device_id === dev.device_id
  })
  if (marker) showInfoWindow(dev, marker)
}

const toggleDevice = (device_id: string) => {
  const s = new Set(selectedDeviceIds.value)
  s.has(device_id) ? s.delete(device_id) : s.add(device_id)
  selectedDeviceIds.value = s
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    const s = new Set(selectedDeviceIds.value)
    filteredDevices.value.forEach(d => s.delete(d.device_id))
    selectedDeviceIds.value = s
  } else {
    const s = new Set(selectedDeviceIds.value)
    filteredDevices.value.forEach(d => s.add(d.device_id))
    selectedDeviceIds.value = s
  }
}

const onModeChange = () => {
  clearMarkers()
  clearTracks()
  infoWindow.value?.close()
  if (mode.value === 'points') renderPoints()
}

const onRefresh = () => {
  clearMarkers()
  clearTracks()
  infoWindow.value?.close()
  loadPoints()
}

// 点位模式下，选中变化时重新渲染
watch(selectedDeviceIds, () => {
  if (mode.value === 'points') renderPoints()
}, { deep: true })

// ===================== lifecycle =====================

onMounted(async () => {
  setupGlobalHandlers()
  await initMap()
  await loadPoints()
})

onUnmounted(() => {
  mapInstance.value?.destroy()
  mapInstance.value = null
  delete (window as any).__mapGoRecordings
})
</script>

<style scoped lang="scss">
.emap-page {
  display: flex;
  height: 100%;
  overflow: hidden;
  background: var(--el-bg-color-page, #f0f2f5);
}

/* ===== 左侧面板 ===== */
.emap-sidebar {
  width: 268px;
  flex-shrink: 0;
  background: var(--el-bg-color, #fff);
  border-right: 1px solid var(--el-border-color-light);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px 8px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    .sidebar-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }

  .mode-switch {
    padding: 10px 14px 4px;
    :deep(.el-radio-button__inner) { padding: 5px 14px; }
  }

  .search-bar {
    padding: 6px 14px;
  }

  .track-time-section {
    padding: 0 14px 6px;

    .section-label {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      margin-bottom: 4px;
    }
  }

  .device-list-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 14px 4px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    border-bottom: 1px solid var(--el-border-color-lighter);

    .device-count {
      font-size: 12px;
    }
  }

  .device-list {
    flex: 1;
    overflow-y: auto;
    padding: 4px 0;

    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-thumb { background: var(--el-border-color); border-radius: 2px; }

    .device-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      cursor: pointer;
      transition: background .15s;

      &:hover { background: var(--el-fill-color-light); }
      &.selected { background: var(--el-color-primary-light-9); }

      .device-info {
        flex: 1;
        min-width: 0;

        .device-name {
          font-size: 13px;
          color: var(--el-text-color-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .device-channel {
          font-size: 11px;
          color: var(--el-text-color-placeholder);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }

    .empty-hint {
      text-align: center;
      color: var(--el-text-color-placeholder);
      font-size: 13px;
      padding: 40px 0;
    }
  }
}

/* ===== 地图区域 ===== */
.emap-map {
  flex: 1;
  position: relative;
  overflow: hidden;

  #amap-container {
    width: 100%;
    height: 100%;
  }

  .map-legend {
    position: absolute;
    bottom: 30px;
    right: 10px;
    background: rgba(255, 255, 255, 0.92);
    border: 1px solid var(--el-border-color-light);
    border-radius: 6px;
    padding: 8px 12px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    font-size: 12px;
    max-height: 240px;
    overflow-y: auto;

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--el-text-color-regular);

      .dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        flex-shrink: 0;
      }
    }
  }

  .map-error {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--el-bg-color);
  }
}
</style>

<!-- 非 scoped：AMap 标注和信息窗口全局样式 -->
<style lang="scss">
.amap-device-marker {
  position: relative;
  cursor: pointer;

  .amap-device-label {
    position: absolute;
    bottom: 42px;
    left: 50%;
    transform: translateX(-50%);
    white-space: nowrap;
    background: rgba(0,0,0,.65);
    color: #fff;
    font-size: 11px;
    padding: 2px 5px;
    border-radius: 3px;
    pointer-events: none;
    opacity: 0;
    transition: opacity .15s;
  }

  &:hover .amap-device-label { opacity: 1; }
}

.amap-info-panel {
  padding: 10px 14px;
  min-width: 220px;
  font-size: 13px;

  .info-title {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 8px;
    color: #303133;
    border-bottom: 1px solid #eee;
    padding-bottom: 6px;
  }

  .info-row {
    margin-bottom: 4px;
    color: #606266;

    span { color: #909399; margin-right: 4px; }
  }

  .info-actions {
    margin-top: 8px;
    padding-top: 6px;
    border-top: 1px solid #eee;

    a {
      color: #409EFF;
      text-decoration: none;
      font-size: 12px;

      &:hover { text-decoration: underline; }
    }
  }
}
</style>