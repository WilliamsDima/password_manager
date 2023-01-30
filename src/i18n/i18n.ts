import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import ru from "./ru.json"
import en from "./en.json"
import uk from "./uk.json"

const defaultNS = "ru_RU"
export const resources = {
	uk_UA: {
		translation: uk,
	},
	en_US: {
		translation: en,
	},
	ru_RU: {
		translation: ru,
	},
} as const

i18n.use(initReactI18next).init({
	lng: defaultNS,
	resources,
	// keySeparator: true, // we do not use keys in form messages.welcome
	fallbackLng: "",
	interpolation: {
		escapeValue: false, // react already safes from xss
	},
	react: {
		useSuspense: false,
	},
})
export default i18n
