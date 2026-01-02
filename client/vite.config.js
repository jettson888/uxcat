import {
  defineConfig
} from 'vite'
import vue from '@vitejs/plugin-vue2'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { codeInspectorPlugin } from 'code-inspector-plugin'
import path from 'path'

export default defineConfig({
  base: './',
  plugins: [
    vue(), 
    viteSingleFile(),
    !/build/i.test(process.env.npm_lifecycle_event)
      ? codeInspectorPlugin({ bundler: 'vite' })
      : ''
  ],
  server: {
    host: '0.0.0.0',
    port: 9370,
    watch: {
      usePolling: true,
      interval: 1000,
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/coverage/**',
        '**/test/**',
        '**/tmp/**'
      ]
    }
  },
  build: {
    outDir: 'dist'
  },
  resolve: {
    // 
    alias: {
      "@": path.resolve(__dirname, "src"),
      views: path.resolve(__dirname, "src/views"),
      components: path.resolve(__dirname, "src/components"),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // SCSS预处理器选项
      }
    }
  }
})
