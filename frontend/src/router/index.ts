import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import Upload from '../views/Upload.vue';
import History from '../views/History.vue';

const routes: RouteRecordRaw[] = [
  { path: '/', component: Upload },
  { path: '/history', component: History },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
