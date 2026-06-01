// @ts-ignore
import { RouteRecordRaw } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getComponent } from '@/views/pages'
import { permissionApi, type MenuItem as ApiMenuItem } from '@/api/permissionApi'

// Define the menu item type
export interface MenuItem {
  id: string | number
  menuId?: string
  name: string
  icon?: string
  path: string
  component?: string
  title?: string
  parentId: number
  parentMenuId?: string
  sort: number
  type?: 'menu' | 'directory' | 'path' | 'api'
  status?: number
  children?: MenuItem[]
  meta?: Record<string, any>
}

// Load menu data from API or fallback to static JSON
export const loadMenuData = async (): Promise<MenuItem[]> => {
  try {
    // Try to load from API first (dynamic permission-based menu)
    const response = await permissionApi.getUserMenus()

    if (response && response.length > 0) {
      console.log('Loaded menu from API (dynamic permissions):', response)
      return convertApiMenuItems(response)
    }

    // Fallback to static menu data if API returns empty
    console.log('API returned empty, loading static menu from JSON')
    const menuData = await import('@/config/menu.json')
    return menuData.default.menus as MenuItem[]
  } catch (error) {
    console.error('Failed to load menu data from API, falling back to static JSON:', error)

    try {
      // Fallback to static import
      const menuData = await import('@/config/menu.json')
      return menuData.default.menus as MenuItem[]
    } catch (fallbackError) {
      console.error('Failed to load static menu data:', fallbackError)
      ElMessage.error('加载菜单数据失败')
      return []
    }
  }
}

// Convert API menu items to internal format
function convertApiMenuItems(apiMenus: ApiMenuItem[]): MenuItem[] {
  return apiMenus.map(menu => ({
    id: menu.id,
    menuId: menu.menuId,
    name: menu.name,
    icon: menu.icon,
    path: menu.path,
    component: menu.component,
    title: menu.title || menu.name,
    parentId: menu.parentId,
    parentMenuId: menu.parentMenuId,
    sort: menu.sort,
    type: menu.type,
    status: menu.status,
    children: menu.children ? convertApiMenuItems(menu.children) : undefined,
    meta: {
      title: menu.title || menu.name,
      icon: menu.icon
    }
  }))
}

/**
 * 将菜单项转换为路由记录（递归处理，参考 Vue2 mapRoutes）
 * @param menus 菜单项数组
 * @returns 路由记录数组
 */
export const convertMenuToRoutes = (menus: MenuItem[]): RouteRecordRaw[] => {
  return mapMenuToRoutes(menus)
}

/**
 * 递归映射菜单到路由（参考 Vue2 的 mapRoutes 模式）
 * @param menus 菜单项数组
 * @param skipParentCheck 是否跳过 parentId 检查（用于递归子菜单）
 * @param level 层级深度（用于调试）
 * @returns 路由记录数组
 */
function mapMenuToRoutes(menus: MenuItem[], skipParentCheck: boolean = false, level: number = 0): RouteRecordRaw[] {
  const routes: RouteRecordRaw[] = []

  menus.forEach((menu) => {
    // Skip api type - these are for RBAC only, not for routing
    if (menu.type === 'api') {
      console.log(`Skipping API type menu item (RBAC only):`, menu)
      return
    }

    // Skip disabled menus
    if (menu.status === 0) {
      console.log(`Skipping disabled menu item:`, menu)
      return
    }

    // Only skip non-top-level menu items at the top level
    if (!skipParentCheck && menu.parentId && menu.parentId !== 0) {
      console.log(`Skipping non-top-level menu item at level ${level}:`, menu)
      return
    }

    const route: RouteRecordRaw = {
      path: menu.path,
      name: String(menu.id),
      meta: {
        title: menu.title || menu.name,
        icon: menu.icon,
        menuId: menu.menuId,
        ...menu.meta
      }
    }

    // If has component configuration, get from pages mapping
    if (menu.component) {
      route.component = getComponent(menu.component)
    }

    // Recursively process children
    if (menu.children && menu.children.length > 0) {
      // Filter out api type and disabled menus
      const validChildren = menu.children.filter(child =>
        child.type !== 'api' && child.status !== 0
      )

      const childRoutes = validChildren.map(child => {
        const childPath = child.path.startsWith('/') ? child.path : child.path.replace(/^\//, '')

        const childRoute: RouteRecordRaw = {
          path: childPath,
          name: String(child.id),
          meta: {
            title: child.title || child.name,
            icon: child.icon,
            menuId: child.menuId,
            ...child.meta
          }
        }

        if (child.component) {
          childRoute.component = getComponent(child.component)
        }

        // Support nested children
        if (child.children && child.children.length > 0) {
          const validGrandchildren = child.children.filter(grandchild =>
            grandchild.type !== 'api' && grandchild.status !== 0
          )

          childRoute.children = validGrandchildren.map(grandchild => {
            const grandchildPath = grandchild.path.startsWith('/') ? grandchild.path : grandchild.path.replace(/^\//, '')
            return {
              path: grandchildPath,
              name: String(grandchild.id),
              meta: {
                title: grandchild.title || grandchild.name,
                icon: grandchild.icon,
                menuId: grandchild.menuId,
                ...grandchild.meta
              },
              component: grandchild.component ? getComponent(grandchild.component) : undefined
            }
          })
        }

        return childRoute
      })

      // Separate absolute and relative path child routes
      const absoluteChildRoutes = childRoutes.filter(r => r.path.startsWith('/'))
      const relativeChildRoutes = childRoutes.filter(r => !r.path.startsWith('/'))

      if (route.component) {
        route.children = relativeChildRoutes.length > 0 ? relativeChildRoutes : undefined
      } else {
        if (relativeChildRoutes.length > 0) {
          route.redirect = relativeChildRoutes[0].path
        }
      }

      routes.push(route, ...absoluteChildRoutes)
      return
    }

    routes.push(route)
  })

  return routes
}

/**
 * 过滤路由（基于用户权限）
 * 简化版本，实际项目中根据用户权限过滤
 */
export const filterRoutesByPermissions = (routes: RouteRecordRaw[], permissions: string[]): RouteRecordRaw[] => {
  // In a real application, check user permissions here
  // For now, return all routes as permissions are handled by the API
  return routes
}

/**
 * 获取子路由
 */
export const getChildrenRoutes = (parentRoute: RouteRecordRaw): RouteRecordRaw[] => {
  return parentRoute.children || []
}

/**
 * 检查用户是否有访问某个路由的权限
 * @param route 要检查的路由
 * @param userMenuIds 用户拥有的菜单ID列表
 * @returns 是否有权限
 */
export const hasRoutePermission = (route: RouteRecordRaw, userMenuIds: (string | number)[]): boolean => {
  const routeMenuId = route.meta?.menuId

  // If no menuId is set, allow access (for public routes)
  if (!routeMenuId) {
    return true
  }

  // Check if user has access to this menu
  return userMenuIds.some(id => String(id) === String(routeMenuId) || String(id) === String(route.name))
}
