import js from '@eslint/js';
import globals from 'globals';
import pluginVue from 'eslint-plugin-vue';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
	globalIgnores(['dist']),
	{
		files: ['**/*.{ts,tsx,vue}'],
		extends: [
			js.configs.recommended,
			...pluginVue.configs['flat/recommended'],
		],
		languageOptions: {
			globals: globals.browser,
		},
		rules: {
			'@typescript-eslint/no-unused-vars': 'off',
			'@typescript-eslint/no-unused-expressions': 'off',
			'vue/multi-word-component-names': 'off',
		},
	},
]);
