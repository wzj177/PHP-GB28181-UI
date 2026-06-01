# Copilot Instructions - GB28181 Surveillance System

Vue3 + TypeScript + Vite frontend for GB28181 video surveillance with mock/real API switching.

## Architecture & Data Flow

### Dual API System (Critical Pattern)
```typescript
// ALL API calls must go through src/api/adapter.ts
import { apiAdapter } from '@/api/adapter'
apiAdapter.request({ url: '/devices', method: 'GET' })
```

- **Mock Mode** (`VITE_MOCK_ENABLED=true`): Returns mock data from `adapter.ts` lines 214-619
- **Real Mode**: Proxies to backend via `src/utils/request.ts` with JWT auto-renewal
- **Adding APIs**: 3 steps required:
  1. Add mock function in `adapter.ts` (e.g., `mockGetDevices()`)
  2. Route in `handleMockRequest()` switch (line 36+)
  3. Export from specific API module (`gb28181Api.ts`, `authApi.ts`, etc.)

### Dynamic Routing System (Vue2-Inspired Pattern)
Routes use **centralized component mapping** similar to Vue2's best practices:

```typescript
// 1. Component mapping table: src/views/pages.ts
export const pages = {
  'Dashboard': () => import('@/views/Dashboard.vue'),
  'PTZControl': () => import('@/views/ptz/PTZControl.vue'),
  // ... all components in one place
}

// 2. Menu config: src/config/menu.json (JSON-driven routes)
// 3. Route mapper: src/utils/routeUtils.ts (recursive conversion)
```

**When adding pages**: 
1. Add component to `src/views/pages.ts` mapping table
2. Reference in `menu.json` by component name
3. Router auto-generates routes via `convertMenuToRoutes()`

**Key files**:
- `src/views/pages.ts` - Single source of truth for all component imports
- `src/utils/routeUtils.ts` - Recursive route mapper (supports nested children)
- `src/router/index.ts` - Loads routes lazily after auth check
- `src/components/layout/TagsView.vue` - Handles route tab tracking (don't duplicate in Layout)

## Development Workflow

```bash
pnpm install          # Uses pnpm, not npm/yarn
pnpm dev              # Port 3230 (non-standard)
pnpm type-check       # Run before commits
```

Default credentials: `admin` / `123456`

## Code Conventions

### Vue Components
- **Always** use `<script setup>` with TypeScript
- Props with interfaces: `interface Props { deviceId: string }`
- Path alias `@/` maps to `src/`
- SCSS variables: `@use '@/styles/variables.scss'`

### Authentication Pattern
```typescript
// Token stored in BOTH localStorage + cookies
import { authUtils } from '@/utils/authUtils'
authUtils.getToken()  // Check auth
authUtils.setToken(newToken)  // Auto-renewed from response headers
```

### HTTP Client (`src/utils/request.ts`)
- Expects `{ code: 0, data: ... }` response format
- Auto-injects token UNLESS `X-Public: true` header present
- 401 → auto-redirects to `/login` with cleanup
- Request cancellation: `cancelAllRequest()` available globally

## GB28181-Specific Patterns

### PTZ Control API Structure
```typescript
// Direction: 8 directions (up/down/left/right/upleft/upright/downleft/downright)
// Zoom: tele (in), wide (out)
// Presets: 1-255 positions with set/goto
ptzControl(deviceId, channelId, command, speed, presetId?)
```

### Video Player Integration
- Multi-screen layouts: 1/4/6/9 screens in `PTZControl.vue`
- RTSP streams via `getStreamUrl()` API
- Recording timeline: `VideoTimeline.vue` with visual scrubbing

## Common Pitfalls

1. **Don't use axios directly** - Always import `apiAdapter` for environment switching
2. **New pages need pages.ts entry** - Add to component map BEFORE menu.json reference
3. **Route meta.title is required** - Tags view breaks without it
4. **TagsView handles route tracking** - Don't add duplicate watchers in Layout
5. **AMap key required** - Set `VITE_AMAP_KEY` or map pages error
6. **pnpm lockfile** - Don't commit `package-lock.json` or `yarn.lock`

## Project Context

Built for PHP ExoSip extension backend. GB28181 is a Chinese national standard for security surveillance. Key domain concepts:
- **PTZ**: Pan-Tilt-Zoom camera control
- **NVR/IPC**: Network Video Recorder / IP Camera
- **Channels**: Sub-devices under parent GB28181 device
- **ZLMediaKit**: Media streaming server status monitoring
