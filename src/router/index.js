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
    children: [
      {
        path: '/SvgModel',
        name: 'SvgModel',
        meta: { title: 'Svg模型', isMenu: true },
        component: () => import('@/views/components/SvgModel/index.vue')
      }
    ]
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes: routes
});
export default router;
