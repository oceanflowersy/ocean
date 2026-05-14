import { createRouter, createWebHashHistory } from 'vue-router';
import index from '@/views/index/index.vue';
import PackTool from '@/views/components/Pack/PackTool.vue';

const routes = [
  {
    path: '/',
    name: 'index',
    component: index,
    children: []
  },
  {
    path: '/pack',
    name: 'pack',
    component: PackTool
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
