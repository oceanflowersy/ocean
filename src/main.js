import { createApp } from 'vue';
import App from './App.vue';
import router from './router/index';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import '@/assets/styles/main.scss';
import 'normalize.css/normalize.css';

const app = createApp(App);

app.use(router);
app.use(ElementPlus);
app.mount('#app');

if (window.electronAPI) {
  router.push('/packtool');
  window.electronAPI.onNavigatePage?.((path) => {
    router.push(path);
  });
}
