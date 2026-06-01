### layout.vue

```vue
<template>
  <div :class="classObj" class="app-wrapper">
    <nav-header v-if="sidebarView"></nav-header>
    <template v-if="!sidebarView">
      <div v-if="device==='mobile'&&sidebar.opened" class="drawer-bg" @click="handleClickOutside" />
    </template>
    <sidebar class="sidebar-container" v-if="isSidebar" />
    <div :class="{ hasTagsView: needTagsView }" class="main-container">
      <div :class="{ 'fixed-header': fixedHeader,'nav-container':sidebarView }">
        <navbar />
        <tags-view v-if="needTagsView" />
      </div>
      <div id="app-main">
        <app-main />
      </div>
      <!-- <right-panel v-if="showSettings">
        <settings />
      </right-panel> -->
    </div>
  </div>
</template>

<script>
import RightPanel from "@/components/RightPanel";
import {
  AppMain,
  Navbar,
  Settings,
  Sidebar,
  TagsView,
  NavHeader,
} from "./components";
import ResizeMixin from "./mixin/ResizeHandler";
import { mapState } from "vuex";

export default {
  name: "Layout",
  components: {
    AppMain,
    Navbar,
    RightPanel,
    Settings,
    Sidebar,
    TagsView,
    NavHeader: NavHeader,
  },
  mixins: [ResizeMixin],
  computed: {
    ...mapState({
      sidebar: (state) => state.app.sidebar,
      device: (state) => state.app.device,
      showSettings: (state) => state.settings.showSettings,
      needTagsView: (state) => state.settings.tagsView,
      fixedHeader: (state) => state.settings.fixedHeader,
      isSidebar: (state) => state.app.isSidebar,
      sidebarView:(state) => state.settings.sidebarView
    }),
    classObj() {
      return {
        hideSidebar: !this.sidebar.opened,
        openSidebar: this.sidebar.opened,
        withoutAnimation: this.sidebar.withoutAnimation,
        mobile: this.device === "mobile",
      };
    },
  },
  methods: {
    handleClickOutside() {
      this.$store.dispatch("app/closeSideBar", { withoutAnimation: false });
    },
  },
};
</script>

<style lang="scss" scoped>
@import "~@/styles/mixin.scss";
@import "~@/styles/variables.scss";
#app-main{
  padding: 10px;
  background: #f2f3f7;
}
.app-wrapper {
  @include clearfix;
  position: relative;
  height: 100%;
  width: 100%;

  &.mobile.openSidebar {
    position: fixed;
    top: 0;
  }
}

.drawer-bg {
  background: #000;
  opacity: 0.3;
  width: 100%;
  top: 0;
  height: 100%;
  position: absolute;
  z-index: 999;
}

.fixed-header {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 9;
  width: calc(100% - #{$sideBarWidth});
  transition: width 0.28s;
}

.hideSidebar .fixed-header {
  width: calc(100% - 54px);
}

.mobile .fixed-header {
  width: 100%;
}
.sidebar-container {
  /* margin-top: 50px; */
}
.nav-container{
  margin-top: 50px;
}
</style>
```


### route.js

```js

import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

/* Layout */
import Layout from '@/layout'

/* Router Modules */
// import exampleRoutes from './modules/example'
/**
 * Note: sub-menu only appear when route children.length >= 1
 * Detail see: https://panjiachen.github.io/vue-element-admin-site/guide/essentials/router-and-nav.html
 *
 * hidden: true                   if set true, item will not show in the sidebar(default is false)
 * alwaysShow: true               if set true, will always show the root menu
 *                                if not set alwaysShow, when item has more than one children route,
 *                                it will becomes nested mode, otherwise not show the root menu
 * redirect: noRedirect           if set noRedirect will no redirect in the breadcrumb
 * name:'router-name'             the name is used by <keep-alive> (must set!!!)
 * meta : {
    roles: ['admin','editor']    control the page roles (you can set multiple roles)
    title: 'title'               the name show in sidebar and breadcrumb (recommend set)
    icon: 'svg-name'/'el-icon-x' the icon show in the sidebar
    breadcrumb: false            if set false, the item will hidden in breadcrumb(default is true)
    activeMenu: '/example/list'  if set path, the sidebar will highlight the path you set
  }
 */

/**
 * constantRoutes
 * a base page that does not have permission requirements
 * all roles can be accessed
 */
export const constantRoutes = [
  {
    path: '/redirect',
    component: Layout,
    hidden: true,
    children: [
      {
        path: '/redirect/:path(.*)',
        component: () => import('@/views/redirect/index')
      }
    ]
  },
  {
    name: 'tenant-login',
    path: '/project/:project/login',
    component: () => import('@/views/login/index'),
    hidden: true
  },
  {
    path: '/login',
    component: () => import('@/views/login/index'),
    hidden: true
  },
  {
    path: '/help',
    name: 'help',
    component: () => import('@/views/help/index'),
    hidden: true
  },
  {
    path: '/auth-redirect',
    component: () => import('@/views/login/auth-redirect'),
    hidden: true
  },
  {
    path: '/404',
    component: () => import('@/views/error-page/404'),
    hidden: true
  },
  {
    path: '/401',
    component: () => import('@/views/error-page/401'),
    hidden: true
  },
  {
    path: '/403',
    component: () => import('@/views/error-page/403'),
    hidden: true
  },
  {
    path: '/500',
    component: () => import('@/views/error-page/500'),
    hidden: true
  },
  {
    path: '/profile',
    component: Layout,
    redirect: '/profile/index',
    hidden: true,
    children: [
      {
        path: 'index',
        component: () => import('@/views/profile/index'),
        name: 'Profile',
        meta: { title: '个人信息', icon: 'user', noCache: true }
      }
    ]
  }

export const asyncRoutes = []
const createRouter = () => new Router({
  // mode: 'history', // require service support
  scrollBehavior: () => ({ y: 0 }),
  routes: constantRoutes
})

const router = createRouter()

// Detail see: https://github.com/vuejs/vue-router/issues/1234#issuecomment-357941465
export function resetRouter() {
  const newRouter = createRouter()
  router.matcher = newRouter.matcher // reset router
}

export default router

```


### permission.js

utils 代码在：`docs/vue2-utils`

```js

import router, { resetRouter } from './router'
// import router from './router'
import store from './store'
import { Message } from 'element-ui'
import NProgress from 'nprogress' // progress bar
import 'nprogress/nprogress.css' // progress bar style
import { getToken } from '@/utils/auth' // get token from cookie
import getPageTitle from '@/utils/get-page-title'
import { mapRoutes } from '@/utils/route'
import { addMeta } from '@/utils/index'
NProgress.configure({ showSpinner: false }) // NProgress Configuration

const whiteList = ['/login', '/auth-redirect'] // no redirect whitelist

router.beforeEach(async(to, from, next) => {
  // start progress bar
  NProgress.start()

  // set page title
  document.title = getPageTitle(to.meta.title)
  // 获取系统基础配置
  const hasBasicSettings =
    store.getters.basicSettings &&
    Object.keys(store.getters.basicSettings).length > 0
  if (to.params.project) {
    store.commit('user/SET_USER_TYPE', 'corp')
    store.commit('user/SET_PROJECT_CODE', to.params.project)
  }
  if (!hasBasicSettings) {
    if (store.getters.user.code) {
      to.params.project = store.getters.user.code
    }
    const res = await store.dispatch('settings/getBasicSettings', to.params)
    const { site_name, site_seo_keywords, site_seo_description } = res

    store.dispatch('app/setSiteConf', res)
    document.title = getPageTitle(to.meta.title, site_name)
    addMeta('keywords', site_seo_keywords)
    addMeta('description', site_seo_description)
  }
  // 获取系统安全配置
  // determine whether the user has logged in
  const hasToken = getToken()

  if (hasToken) {
    if (to.path === '/login' || to.name === 'tenant-login') {
      // if is logged in, redirect to the home page
      next({ path: '/' })
      NProgress.done() // hack: https://github.com/PanJiaChen/vue-element-admin/pull/2939
    } else {
      // determine whether the user has obtained his permission roles through getInfo
      const hasRoles = store.getters.roles && store.getters.roles.length > 0
      if (hasRoles) {
        next()
      } else {
        try {
          // get user info
          // note: roles must be a object array! such as: ['admin'] or ,['developer','editor']
          const { roles, routes } = await store.dispatch('user/getInfo')
          const remoteRoutes = mapRoutes(routes)
          // 路由末尾增加404页
          remoteRoutes.push({ path: '*', redirect: '/404', hidden: true })
          // generate accessible routes map based on roles
          const accessRoutes = await store.dispatch(
            'permission/generateRoutes',
            { roles, remoteRoutes }
          )
          resetRouter()
          // console.log('accessRoutes:', accessRoutes)
          // dynamically add accessible routes
          router.addRoutes(accessRoutes)
          // hack method to ensure that addRoutes is complete
          // set the replace: true, so the navigation will not leave a history record
          next({ ...to, replace: true })
        } catch (error) {
          // remove token and go to login page to re-login
          await store.dispatch('user/resetToken')
          Message.error(error || 'Has Error')
          const code = store.getters.user.code || to.params.project
          if (code) {
            next(`/project/${code}/login?redirect=${to.path}`)
          } else {
            next(`/login?redirect=${to.path}`)
          }

          NProgress.done()
        }
      }
    }
  } else {
    /* has no token*/

    if (whiteList.indexOf(to.path) !== -1 || to.name === 'tenant-login' || to.name === 'help') {
      // in the free login whitelist, go directly
      next()
    } else {
      const code = store.getters.user.code || to.params.project
      // other pages that do not have permission to access are redirected to the login page.
      if (code) {
        next(`/project/${code}/login?redirect=${to.path}`)
      } else {
        next(`/login?redirect=${to.path}`)
      }
      NProgress.done()
    }
  }
})

router.afterEach(() => {
  // finish progress bar
  NProgress.done()
})

```


### utils/route.js

```js
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

```

### views/pages.js

```js

/* Layout */
import Layout from '@/layout'
import page404 from '@/views/error-page/404'

/**
 *  视图映射表
 */
export default {
  'layout/Layout': Layout,
  'views/help/index': () => import('@/views/help/index'),
  // 二级菜单
  'layout/subLayout': () => import('@/layout/sub-layout/index'),
  'views/dashboard/index': () => import('@/views/dashboard/index'),
  'views/dashboard/statistical-analysis/index': () => import('@/views/statistical-analysis/index'),
  'views/settings/index': () => import('@/views/settings/index'),
  'views/settings/app': () => import('@/views/settings/app.vue'),
  'views/settings/storage': () => import('@/views/settings/storage.vue'),
  'views/settings/wechat': () => import('@/views/settings/wechat.vue'),
  'views/settings/sms': () => import('@/views/settings/sms.vue'),
  'views/settings/secure': () => import('@/views/settings/secure.vue'),
  'views/settings/mail': () => import('@/views/settings/mail.vue'),
  'views/settings/gateway': () => import('@/views/settings/gateway.vue'),
  'views/settings/login-log': () => import('@/views/logs/login-log'),
  'views/settings/operation-log': () => import('@/views/logs/operation-log'),
  'views/permission/user/index': () => import('@/views/permission/user/index'),
  'views/permission/role/index': () => import('@/views/permission/role/index'),
  'views/permission/menu/index': () => import('@/views/permission/menu/index'),
  'views/permission/post/index': () => import('@/views/permission/post/index'),
  'views/permission/user-group/index': () => import('@/views/permission/user-group/index'),
  'views/base-info/index': () => import('@/views/base-info/index'),
  'views/base-info/land/index': () => import('@/views/base-info/land/index'),
  'views/base-info/block/index': () => import('@/views/base-info/block/index'),
  'views/table/index': () => import('@/views/table/index'),
  'views/tree/index': () => import('@/views/tree/index'),
  'views/form/index': () => import('@/views/form/index'),
  '404-page': page404
}
```