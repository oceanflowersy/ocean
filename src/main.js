import { createApp } from 'vue';
import App from './App.vue';
import router from './router/index';
import '@/assets/styles/main.scss';
import 'normalize.css/normalize.css';

const app = createApp(App);

app.use(router);
app.mount('#app');

// 如果在 Electron 环境中，默认导航到打包工具页面
if (window.electronAPI) {
  router.push('/packtool');
}
