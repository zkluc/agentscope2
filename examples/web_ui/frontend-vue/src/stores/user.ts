import { defineStore } from 'pinia';
import { ref } from 'vue';

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
			const url = localStorage.getItem('server_url');
			if (url) {
				serverUrl.value = url;
			}
		}
	}

	return { username, serverUrl, setupComplete, setUsername, setServerUrl, setSetupComplete };
});
