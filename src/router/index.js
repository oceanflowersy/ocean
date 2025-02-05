import { createRouter, createWebHashHistory } from 'vue-router';
import index from '@/views/index/index.vue';

const routes = [
  {
    path: '/',
    name: 'index',
    component: index,
    children: []
  },
  {
    path: '/cmp',
    name: 'cmp',
    children: []
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes: routes
});
export default router;
