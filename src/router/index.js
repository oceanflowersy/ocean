import { createRouter, createWebHashHistory } from 'vue-router';
import index from '@/views/index/index.vue';
import PackTool from '@/views/components/PackTool/PackTool.vue';
import RepairTool from '@/views/components/RepairTool/RepairTool.vue';
import SqlTool from '@/views/components/SqlTool/SqlTool.vue';

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
    path: '/repair',
    name: 'repair',
    component: RepairTool
  },
  {
    path: '/sqltool',
    name: 'sqltool',
    component: SqlTool
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
