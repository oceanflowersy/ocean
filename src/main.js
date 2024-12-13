import { createApp } from 'vue';
import App from './App.vue';
import router from './router/index';
import '@/assets/styles/main.scss';
import 'normalize.css/normalize.css';

const app = createApp(App);

app.use(router);
app.mount('#app');
