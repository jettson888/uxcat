import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { codeInspectorPlugin } from 'code-inspector-plugin'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/ai-prototype/' : '/',
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === 'font'
        }
      }
    }),
    AutoImport({
      imports: [
        'vue',
        'vue-router',
        'pinia'
      ],
      resolvers: [
        ElementPlusResolver()
      ],
      dts: false,
    }),
    Components({
      resolvers: [
        // 自动导入 Element Plus 组件
        ElementPlusResolver()
      ],
      dts: false
    }),
    codeInspectorPlugin({
      bundler: 'vite'
    })
  ],
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler'
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src',
      'stores': '/src/stores',
      'components': '/src/components',
      'meta': '/src/meta'
    }
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/aop-web': {
        target: 'http://work.lowcode.hzbtest:8900',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/aop-web/, '/aop-web')
      },
      '/hzux': {
        target: 'http://127.0.0.1:9369',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/hzux/, '')
      },
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'static',
    rollupOptions: {
      output: {
        chunkFileNames: 'static/js/[name]-[hash].js',
        entryFileNames: 'static/js/[name]-[hash].js',
        assetFileNames: 'static/[ext]/[name]-[hash].[ext]'
      }
    }
  }
}))
