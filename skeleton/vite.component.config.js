
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  },
  plugins: [vue()],
  build: {
    outDir: './libs',
    emptyOutDir: true, // 显式启用清空
    lib: {
      entry: './src/components/index.js',
      name: 'MyComponentLib',
      fileName: 'my-lib',
      formats: ['iife']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'components': path.resolve(__dirname, 'src/components'),
      'utils': path.resolve(__dirname, 'src/utils'),
      'stores': path.resolve(__dirname, 'src/stores'),
      'meta': path.resolve(__dirname, 'src/meta')
    }
  },
})
