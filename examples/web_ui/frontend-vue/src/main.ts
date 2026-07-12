import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import { createPinia } from 'pinia';
import { createI18nInstance } from './i18n';
import App from './App.vue';
import router from './router';
import './index.css';
import './assets/styles/genui.css';

const app = createApp(App);

// Register all Element Plus icons globally
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
	app.component(key, component);
}

const pinia = createPinia();
const i18n = createI18nInstance();

app.use(pinia);
app.use(router);
app.use(i18n);
app.use(ElementPlus, { size: 'default' });

app.mount('#app');
