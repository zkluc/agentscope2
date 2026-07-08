import { defineStore } from 'pinia';
import { watch } from 'vue';
import { useDark, useToggle } from '@vueuse/core';

export const useThemeStore = defineStore('theme', () => {
	const isDark = useDark({
		selector: 'html',
		attribute: 'class',
		valueDark: 'dark',
		valueLight: '',
	});

	const toggle = useToggle(isDark);

	watch(isDark, (val) => {
		localStorage.setItem('theme', val ? 'dark' : 'light');
	});

	// Initialize from storage
	const saved = localStorage.getItem('theme');
	if (saved === 'dark') {
		isDark.value = true;
	} else if (saved === 'light') {
		isDark.value = false;
	}

	return { isDark, toggle };
});
