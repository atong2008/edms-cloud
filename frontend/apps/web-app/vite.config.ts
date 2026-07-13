import { defineConfig } from '@vben/vite-config';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      server: {
        proxy: {
          '/api': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
            // 开发环境代理到 edms-gateway
            target: 'http://localhost:9999',
            ws: true,
          },
        },
      },
    },
  };
});
