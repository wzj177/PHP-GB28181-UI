// Axios 响应类型扩展
declare module 'axios' {
  export interface AxiosRequestConfig {
    startTime?: number
  }

  interface AxiosResponse<T = any> {
    code: number
    message: string
    data: T
  }
}

// mockjs 类型声明
declare module 'mockjs' {
  interface MockjsRequestOptions {
    url: string
    type: string
    body: string
  }

  interface Mockjs {
    mock(template: Record<string, any>): void
    mock(rurl: string, template: Record<string, any>): void
    mock(rurl: string, rtype: string, template: Record<string, any>): void
    Random: {
      cname(): string
      guid(): string
      ip(): string
      datetime(pattern?: string): string
      now(format?: string): string
      image(size?: string, background?: string, foreground?: string, format?: string, text?: string): string
      pick<T>(arr: T[]): T
    }
  }

  const Mock: Mockjs
  export default Mock
}

// AMap 类型声明
declare namespace AMap {
  class Map {
    constructor(container: string | HTMLElement, options: MapOptions)
    destroy(): void
    setZoom(zoom: number): void
    getZoom(): number
    setCenter(center: [number, number]): void
    getCenter(): LngLat
    add(control: any): void
    remove(control: any): void
    addOverlay(overlay: any): void
    removeOverlay(overlay: any): void
    setFitView(): void
    on(event: string, callback: (...args: any[]) => void): void
    off(event: string, callback?: (...args: any[]) => void): void
  }

  class LngLat {
    constructor(lng: number, lat: number)
    getLng(): number
    getLat(): number
  }

  class Marker {
    constructor(options: MarkerOptions)
    setPosition(position: [number, number]): void
    getPosition(): LngLat
    setMap(map: Map | null): void
    on(event: string, callback: (...args: any[]) => void): void
  }

  class InfoWindow {
    constructor(options: InfoWindowOptions)
    setContent(content: string | HTMLElement): void
    open(map: Map, position: LngLat): void
    close(): void
    setPosition(position: LngLat): void
  }

  class ControlBar {
    constructor(options?: ControlBarOptions)
  }

  class ToolBar {
    constructor(options?: ToolBarOptions)
  }

  interface MapOptions {
    zoom?: number
    center?: [number, number]
    viewMode?: '2D' | '3D'
    showLabel?: boolean
  }

  interface MarkerOptions {
    position: [number, number]
    title?: string
    content?: string | HTMLElement
    icon?: any
    extData?: any
  }

  interface InfoWindowOptions {
    content?: string | HTMLElement
    offset?: any
    closeWhenClickMap?: boolean
  }

  interface ControlBarOptions {
    showZoomBar?: boolean
    showControlButton?: boolean
    position?: {
      top?: string
      right?: string
      bottom?: string
      left?: string
    }
  }

  interface ToolBarOptions {
    position?: {
      top?: string
      right?: string
      bottom?: string
      left?: string
    }
  }
}

declare const AMap: typeof AMap

// Element Plus 类型扩展
declare module '@element-plus/icons-vue' {
  import { App } from 'vue'
  export const VideoCamera: any
  export const Download: any
  export const Monitor: any
  export const Play: any
  export const Bell: any
  export const MapLocation: any
  export const House: any
  export const Fold: any
  export const Expand: any
  export const ArrowDown: any
  export const User: any
  export const Setting: any
  export const SwitchButton: any
  export const DataAnalysis: any
  export const VideoPlay: any
  export const Film: any
  export const Sunny: any
  export const Moon: any
  export const Clock: any
  export const Close: any
  export const Refresh: any
  export const Location: any
  export const Plus: any
  export const Delete: any
  export const Edit: any
  export const Search: any
  export const RefreshRight: any
  export const Unlock: any
}

// 全局变量
declare const isMockEnabled: boolean

// gb28181Api 自动导入声明（Vite 自动导入插件）
declare const gb28181Api: any
declare const deviceApi: any

// WheelEvent 扩展
interface WheelEvent {
  wheelDelta?: number
}

// Vue Router 扩展
declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    icon?: string
    hidden?: boolean
    affix?: boolean
    noCache?: boolean
  }
}

// 设备树节点类型
interface DeviceTreeNode {
  id: string
  name: string
  online?: boolean
  type?: string
  status?: 'online' | 'offline' | 'motion_detect'
  children?: DeviceTreeNode[]
  channels?: DeviceTreeNode[]
  rtspUrl?: string
  device_id?: string
}

// Element Plus prop 类型覆盖
type EpPropType = 'primary' | 'success' | 'warning' | 'info' | 'danger' | string

// Vite ?raw 导入类型声明
declare module '*.svg?raw' {
  const content: string
  export default content
}

declare module '*.svg' {
  const content: string
  export default content
}
