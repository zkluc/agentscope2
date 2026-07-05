import { ref, readonly } from 'vue';

export function useMobile() {
	const isMobile = ref(window.innerWidth < 768);

	function check() {
		isMobile.value = window.innerWidth < 768;
	}

	const mq = window.matchMedia('(max-width: 767px)');
	isMobile.value = mq.matches;

	mq.addEventListener('change', check, { passive: true });

	return { isMobile: readonly(isMobile) };
}
