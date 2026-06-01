import pages from '@/views/pages'

export function mapRoutes(routes, level = 0) {
  routes.forEach((route) => {
    if ('component' in route && typeof route.component === 'string') {
      // eslint-disable-next-line no-prototype-builtins
      // if (!pages.hasOwnProperty(route.component)) {
      //   console.log('no:', route)
      // }
      route['component'] = pages[route.component] || pages['404-page']
    }

    if ('children' in route && route.children.length > 0) {
      route['children'] = mapRoutes(route.children, level + 1)
    }
  })
  return routes
}
