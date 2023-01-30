// import the original type declarations
import "react-i18next"
// import all namespaces (for the default language, only)
import ru from "./ru.json"
import en from "./en.json"
import uk from "./uk.json"

// react-i18next versions lower than 11.11.0
declare module "react-i18next" {
	// and extend them!
	interface Resources {
		uk_UA: typeof uk
		en_US: typeof en
		ru_RU: typeof ru
	}
}

// react-i18next versions higher than 11.11.0
declare module "react-i18next" {
	// and extend them!
	interface CustomTypeOptions {
		// custom namespace type if you changed it
		defaultNS: "ns1"
		// custom resources type
		resources: {
			uk_UA: typeof uk
			en_US: typeof en
			ru_RU: typeof ru
		}
	}
}
