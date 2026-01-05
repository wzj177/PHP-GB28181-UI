# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a GB28181 video surveillance system frontend built with Vue 3, TypeScript, and Vite. It's designed to work with a PHP ExoSip extension backend implementation, providing a professional surveillance management interface with real-time monitoring, PTZ control, video playback, alarm management, and electronic map capabilities.

## Development Commands

```bash
# Install dependencies (uses pnpm)
pnpm install

# Start development server (runs on port 3230)
pnpm dev

# Type checking
pnpm type-check

# Build for production
pnpm build

# Preview production build
pnpm preview
```

Default login credentials: `admin` / `123456`

## Architecture

### Dual API System (Mock vs Real)

The project uses a unique adapter pattern that switches between mock data and real API calls based on environment:

- **Development mode**: Uses `src/api/adapter.ts` with built-in mock data (when `VITE_MOCK_ENABLED=true`)
- **Production mode**: Makes real HTTP requests via `src/utils/request.ts`

The adapter pattern is implemented in `src/api/adapter.ts:14-32` and routes requests to either mock functions or real axios calls. All mock data functions are defined directly in `adapter.ts` (lines 214-619).

**Important**: When adding new API endpoints:
1. Add mock function to `src/api/adapter.ts`
2. Add routing logic in `handleMockRequest()` function
3. Import and use via `apiAdapter.request()` in API modules

### API Layer Structure

- **`src/api/adapter.ts`**: Central request router with mock/real API switching
- **`src/api/gb28181Api.ts`**: GB28181 protocol operations (devices, channels, PTZ)
- **`src/api/authApi.ts`**: Authentication operations (login, logout, user info)
- **`src/api/alarmApi.ts`**: Alarm management
- **`src/api/mapApi.ts`**: Electronic map device data
- **`src/api/zlmApi.ts`**: ZLMediaService operations
- **`src/api/monitorApi.ts`**: Monitor-related operations
- **`src/api/dashboardApi.ts`**: Dashboard statistics

### HTTP Client Configuration (`src/utils/request.ts`)

Key features:
- JWT token management with automatic renewal from response headers
- Request cancellation system (`requestQueue`, `cancelAllRequest`)
- Automatic token injection via interceptors
- 401 redirect to login with auth cleanup
- Support for `X-Public` header to bypass token injection
- Response code handling: expects `code: 0` for success

**IMPORTANT - Response Handling**:
The response interceptor (lines 108-110) automatically unwraps the API response:
```typescript
if (res?.code === 0) {
  renewJwtToken(response)
  return res.data  // ← Directly returns data, not the full response
}
```

**Correct usage**:
```typescript
// ❌ WRONG - Don't check response.code or access response.data
const response = await api.getData()
if (response?.code === 0 && response.data) {
  const data = response.data
}

// ✅ CORRECT - API calls directly return the data
const data = await api.getData()
if (data) {
  // Use data directly
}
```

### Authentication Flow

Authentication utilities in `src/utils/authUtils.ts`:
- Dual storage: localStorage + cookies
- Token management with `getToken()`, `setToken()`, `clear()`
- Configurable token key (default: `Authorization`)

Route guards in `src/router/index.ts` check token presence and redirect unauthenticated users to `/login`.

### State Management

Pinia stores in `src/stores/`:
- **`tagsView.ts`**: Manages visited tags/pages for the breadcrumbs navigation

### Routing System

Routes are dynamically generated from menu data with lazy-loaded components. Key aspects:
- Authentication guard checks token before route access
- Layout-based routing (`NavigationLayout`)
- Dynamic route loading from API/menu data

### GB28181 PTZ Control System

PTZ operations support comprehensive camera control:
- **Directional**: up, down, left, right, and 4 diagonal directions
- **Zoom**: tele (zoom in), wide (zoom out)
- **Focus**: auto, far, near
- **Iris**: adjustment
- **Presets**: 255 preset positions (set/goto operations)
- **Cruise**: Configurable waypoints for automated patrolling
- **Voice talkback**: Two-way audio communication

### Video Management

Multi-screen playback with 1, 4, 6, or 9 screen layouts. Video features:
- Real-time streaming (RTSP)
- Recording control (start/stop)
- Snapshot capture
- Time-based recording retrieval from NVR/IPC
- Recording download with visual timeline
- Stream URL management (main/sub streams)

## Environment Variables

```bash
VITE_APP_TITLE=PHP-GB28181        # Application title
VITE_AMAP_KEY=xxxx                # AMap (高德地图) API key - required for map functionality
VITE_API_BASE_URL=/api            # API base URL
VITE_MOCK_ENABLED=true            # Enable mock data (true) or use real API (false)
```

## Technology Stack

- **Vue 3.5.12** with Composition API and `<script setup>` syntax
- **TypeScript 5.6.3** with strict mode
- **Vite 5.4.8** for build tooling
- **Element Plus 2.8.6** for UI components
- **Pinia 2.2.4** for state management
- **Vue Router 4.4.5** for routing
- **Axios 1.7.7** for HTTP client
- **Vue3-Amap 1.0.5** for map integration
- **VueUse 11.1.0** for composition utilities
- **Mock.js 1.1.0** for data simulation

## Component Organization

```
src/
├── components/
│   ├── layout/         # Layout components (ScrollPane, TagsView)
│   └── ptz/           # PTZ control panel component
├── views/
│   ├── alarms/        # Alarm management page
│   ├── device/        # Device management pages
│   ├── error/         # Error pages (403, etc.)
│   ├── map/           # Electronic map with device markers
│   ├── monitor/       # Monitor/dashboard pages
│   ├── ptz/           # PTZ control with device tree
│   └── video/         # Video playback and recording
└── styles/
    └── variables.scss  # SCSS theme variables
```

## Code Conventions

- Use `<script setup>` syntax for Vue 3 components
- Define TypeScript interfaces for props and data structures
- Use Composition API with `ref`, `computed`, `watch` from Vue
- SCSS with global variables from `@/styles/variables.scss`
- Path alias `@` maps to `src` directory

## Deployment Notes

- Build output can be deployed to any static file server
- History mode routing requires server-side fallback configuration
- Ensure AMap key is properly configured for production map functionality
