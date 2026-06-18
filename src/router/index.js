import { createRouter, createWebHashHistory } from 'vue-router';
import index from '@/views/index/index.vue';
import PackTool from '@/views/components/PackTool/PackTool.vue';

const routes = [
  {
    path: '/',
    name: 'index',
    component: index,
    children: []
  },
  {
    path: '/packtool',
    name: 'packtool',
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
