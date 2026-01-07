// eslint-disable-next-line @typescript-eslint/ban-ts-comment
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { authUtils } from '@/utils/authUtils'
import { convertMenuToRoutes, loadMenuData, MenuItem, hasRoutePermission } from '@/utils/routeUtils'

// Store loaded menu IDs for permission checking
let loadedMenuIds: (string | number)[] = []

// Define static routes
const staticRoutes: Array<RouteRecordRaw> = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/play/player',
    name: 'PlayerView',
    component: () => import('../views/play/PlayerView.vue'),
    meta: { title: '播放器' }
  }
]

// Initialize the router with only static routes
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: staticRoutes
})

// Helper function to get the first route with a component
const getFirstValidRoute = (menus: MenuItem[]): MenuItem | null => {
  const allItems: MenuItem[] = []

  for (const menu of menus) {
    if (!menu.parentId || menu.parentId === 0) {
      if (menu.component) {
        return menu
      }
      if (menu.children && menu.children.length > 0) {
        for (const child of menu.children) {
          if (child.component) {
            return child
          }
        }
      }
    }
  }

  return null
}

// Collect all menu IDs for permission checking
const collectMenuIds = (menus: MenuItem[]): (string | number)[] => {
  const ids: (string | number)[] = []
  const collect = (items: MenuItem[]) => {
    for (const item of items) {
      ids.push(item.id)
      if (item.children) {
        collect(item.children)
      }
    }
  }
  collect(menus)
  return ids
}

// Navigation guard to check for authentication
router.beforeEach(async (to, from, next) => {
  const isLoginRoute = to.path === '/login'

  // If accessing login route, allow directly
  if (isLoginRoute) {
    if (authUtils.isAuthenticated()) {
      // Already logged in, will be redirected after loading routes
    } else {
      next()
      return
    }
  }

  // Check if token exists
  if (!authUtils.isAuthenticated()) {
    next('/login')
    return
  }

  // Load dynamic routes if not already loaded
  if (router.getRoutes().length <= staticRoutes.length) {
    try {
      const menuData = await loadMenuData()
      const dynamicRoutes = convertMenuToRoutes(menuData)

      // Store menu IDs for permission checking
      loadedMenuIds = collectMenuIds(menuData)

      // Find the first valid route for default redirect
      const firstRoute = getFirstValidRoute(menuData)
      const defaultPath = firstRoute?.path || '/dashboard'

      // Create a parent route with NavigationLayout
      const layoutRoute: RouteRecordRaw = {
        path: '/',
        component: () => import('../components/layout/NavigationLayout.vue'),
        children: [
          // Redirect root to first valid route
          {
            path: '',
            redirect: defaultPath
          },
          // Add all dynamic routes as children
          ...dynamicRoutes,
          // 404 page inside layout
          {
            path: ':pathMatch(.*)*',
            name: 'NotFound',
            component: () => import('../views/error/NotFound.vue'),
            meta: { title: '页面不存在' }
          }
        ]
      }

      // Add the layout route with all children
      router.addRoute(layoutRoute)

      // If trying to access root, redirect to first route
      if (to.path === '/' || to.path === '') {
        next(defaultPath)
      } else {
        // Check permission for the target route
        const targetRoute = router.resolve(to.path)
        if (targetRoute && hasRoutePermission(targetRoute, loadedMenuIds)) {
          next({ ...to, replace: true })
        } else {
          // No permission, redirect to first available route
          console.warn('No permission for route:', to.path)
          next(defaultPath)
        }
      }
    } catch (error) {
      console.error('Failed to load routes:', error)
      next('/login')
    }
  } else {
    // Routes already loaded, check permission for navigation
    const targetRoute = router.resolve(to.path)
    if (targetRoute && !hasRoutePermission(targetRoute, loadedMenuIds)) {
      console.warn('No permission for route:', to.path)
      // Find first accessible route
      const firstRoute = router.getRoutes().find(r =>
        r.path !== '/' && r.path !== '/login' &&
        hasRoutePermission(r, loadedMenuIds)
      )
      next(firstRoute?.path || '/dashboard')
    } else {
      next()
    }
  }
})

/**
 * Check if user has permission for a specific route
 * @param routePath The route path to check
 * @returns Whether the user has permission
 */
export const checkRoutePermission = (routePath: string): boolean => {
  const route = router.resolve(routePath)
  return hasRoutePermission(route, loadedMenuIds)
}

/**
 * Get user's accessible menu IDs
 * @returns Array of menu IDs the user has access to
 */
export const getUserMenuIds = (): (string | number)[] => {
  return [...loadedMenuIds]
}

/**
 * Reload user routes (call after login/logout/permission change)
 */
export const reloadUserRoutes = async () => {
  // Remove all dynamic routes
  const routes = router.getRoutes()
  routes.forEach(route => {
    if (route.name && !staticRoutes.find(r => r.name === route.name)) {
      router.removeRoute(route.name)
    }
  })

  // Reset loaded menu IDs
  loadedMenuIds = []

  // Reload will happen on next navigation
}

export default router
