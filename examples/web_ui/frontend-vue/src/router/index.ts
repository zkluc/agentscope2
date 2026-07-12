import AppLayout from '@/components/layout/AppLayout.vue';
import type { RouteRecordRaw } from 'vue-router';
import { createRouter, createWebHistory } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: AppLayout,
    children: [
      {
        path: '',
        redirect: '/chat',
      },
      {
        path: 'chat/:agentId?/:sessionId?/:memberId?',
        component: () => import('@/views/chat/index.vue'),
      },
      {
        path: 'credential',
        component: () => import('@/views/credential/index.vue'),
      },
      {
        path: 'knowledge/:kbId?',
        component: () => import('@/views/knowledge/index.vue'),
      },
      {
        path: 'schedule',
        component: () => import('@/views/schedule/index.vue'),
      },
      {
        path: 'genui-example',
        component: () => import('@/views/GenUIExample.vue'),
      },
    ],
  },
  {
    path: '/setup',
    component: () => import('@/views/setup/SetupPageRoute.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Install error handling hook
router.onError((err) => {
  console.error('Router error:', err);
});

export default router;
