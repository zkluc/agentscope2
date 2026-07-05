import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
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

export const useUserStore = defineStore('user', () => {
	const username = ref(localStorage.getItem('username') ?? '');
	const serverUrl = ref(localStorage.getItem('server_url') ?? '');
	const setupComplete = ref(!!localStorage.getItem('server_url'));

	function setUsername(val: string) {
		username.value = val;
		localStorage.setItem('username', val);
	}

	function setServerUrl(val: string) {
		serverUrl.value = val;
		localStorage.setItem('server_url', val);
	}

	function setSetupComplete(val: boolean) {
		setupComplete.value = val;
		if (val) {
			localStorage.setItem('server_url', serverUrl.value);
		}
	}

	return { username, serverUrl, setupComplete, setUsername, setServerUrl, setSetupComplete };
});
