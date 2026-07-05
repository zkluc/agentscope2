import { createI18n } from 'vue-i18n';
import en from '../i18n/locales/en.json';
import zh from '../i18n/locales/zh.json';

const messages = {
	en,
	zh,
};

export function createI18nInstance() {
	const detectedLocale = (() => {
		const stored = localStorage.getItem('locale');
		if (stored && (stored in messages)) return stored;
		const browser = navigator.language.slice(0, 2);
		if (browser in messages) return browser;
		return 'en';
	})();

	const i18n = createI18n({
		legacy: false,
		locale: detectedLocale,
		messages,
	});

	return i18n;
}

export function getLocale(): string {
	const i18n = createI18nInstance();
	return i18n.global.locale.value;
}
