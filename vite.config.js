import { fileURLToPath, URL } from 'node:url';

import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

import AutoImport from 'unplugin-auto-import/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const { VITE_APP_ENV } = env;
  const BASE_URL = env.VITE_APP_BASE_URL;

  return {
    plugins: [
      vue(),
      AutoImport({
        include: [/\.[tj]sx?$/, /\.vue$/, /\.vue\?vue/, /\.md$/],
        imports: ['vue', '@vueuse/core', 'vue-router'],
        resolvers: [],
        vueTemplate: true,
        eslintrc: {
          enabled: true
        }
      })
    ],
    css: {
      preprocessorOptions: {
        scss: {
          javascriptEnabled: true
        }
      }
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)) // Node.js的内置函数，它将文件URL转换为本地文件系统路径
      }
    },
    server: {
      host: '0.0.0.0',
      cors: true,
      port: Number(env.VITE_APP_PORT),
      open: true,
      proxy: {
        [BASE_URL]: {
          target: `http://192.168.0.108:12346${BASE_URL}`,
          changeOrigin: true, // 表示请求头中的 Origin 字段将被修改为目标服务器的地址
          secure: false, // 表示代理会允许不安全的 https 请求
          rewrite: (path) => path.replace(new RegExp(`^${BASE_URL}`), '')
        }
      }
    }
  };
});
