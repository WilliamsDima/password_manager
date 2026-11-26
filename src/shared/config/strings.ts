/** All user-visible text (the app is Russian-only, docs/ARCHITECTURE.md §5). */
export const strings = {
	common: {
		loading: "Загрузка…",
	},
	signIn: {
		title: "Вход",
		registerTitle: "Регистрация",
		email: "Email",
		password: "Пароль",
		submit: "Войти",
		registerSubmit: "Создать аккаунт",
		switchToRegister: "Нет аккаунта? Зарегистрироваться",
		switchToSignIn: "Уже есть аккаунт? Войти",
	},
	vault: {
		title: "Хранилище",
		placeholder: "Список записей появится в следующих задачах",
		signOut: "Выйти",
	},
	authErrors: {
		"invalid-credentials": "Неверный email или пароль",
		"invalid-email": "Некорректный email",
		"email-in-use": "Этот email уже зарегистрирован",
		"weak-password": "Слишком простой пароль (минимум 6 символов)",
		"too-many-requests": "Слишком много попыток. Попробуйте позже",
		"user-disabled": "Аккаунт отключён",
		"reauth-required": "Для этого действия войдите заново",
		network: "Нет соединения с сетью",
		fallback: "Не удалось выполнить операцию. Попробуйте ещё раз",
	},
} as const
