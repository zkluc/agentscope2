import { useI18n as useI18nCore } from 'vue-i18n';

export function useTranslation() {
	const { t, locale } = useI18nCore();
	return { t, locale };
}
