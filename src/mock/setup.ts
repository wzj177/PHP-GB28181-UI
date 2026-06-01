// src/mock/setup.ts
import Mock from './index'

// Determine if we need to mock based on environment

if (isMockEnabled && import.meta.env.DEV) {
  Mock.setup({
    timeout: '200-600' // Simulate network delay
  })
  console.log('Mock enabled')
} else {
  Mock.setup({
    timeout: 0
  }) // Disable mock in production
  console.log('Mock disabled')
}

export {}