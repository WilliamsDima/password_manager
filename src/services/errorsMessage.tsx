const errorsRu = {
	"admin-restricted-operation": "Эта операция доступна только администраторам.",
	"argument-error": "",
	"app-not-authorized":
		"Это приложение, определяемое доменом, на котором оно размещено, не имеет права использовать аутентификацию Firebase с предоставленным ключом API. Проверьте конфигурацию ключа в консоли Google API.",
	"app-not-installed":
		"Запрашиваемое мобильное приложение, соответствующее предоставленному идентификатору (название пакета Android или идентификатор пакета iOS), не установлено на данном устройстве.",
	"captcha-check-failed":
		"Предоставленный токен ответа reCAPTCHA является либо недействительным, либо просроченным, либо уже использованным, либо домен, связанный с ним, не соответствует списку доменов из белого списка.",
	"code-expired":
		"Срок действия SMS-кода истек. Пожалуйста, повторно отправьте код подтверждения, чтобы повторить попытку.",
	"cordova-not-ready": "Фреймворк Cordova не готов.",
	"cors-unsupported": "Этот браузер не поддерживается.",
	"credential-already-in-use":
		"Эти учетные данные уже связаны с другой учетной записью пользователя.",
	"custom-token-mismatch":
		"Пользовательский токен соответствует другой аудитории.",
	"requires-recent-login":
		"Эта операция является конфиденциальной и требует недавней проверки подлинности. Выйдите и войдите в аккаунт еще раз, прежде чем повторить этот запрос.",
	"dynamic-link-not-activated":
		"Активируйте динамические ссылки в консоли Firebase и примите условия.",
	"email-change-needs-verification":
		"Многофакторные пользователи всегда должны иметь подтвержденный адрес электронной почты.",
	"email-already-in-use":
		"Адрес электронной почты уже используется другим аккаунтом.",
	"expired-action-code": "Срок действия кода действия истек.",
	"cancelled-popup-request":
		"Эта операция была отменена из-за открытия другого конфликтующего всплывающего окна.",
	"internal-error": "Произошла внутренняя ошибка.",
	"invalid-app-credential":
		"Запрос на проверку телефона содержит недопустимый верификатор приложения. Ответ токена reCAPTCHA либо недействителен, либо просрочен.",
	"invalid-app-id":
		"Идентификатор мобильного приложения не зарегистрирован для текущего проекта.",
	"invalid-user-token":
		"Учетные данные этого пользователя недействительны для этого проекта. Это может произойти, если токен пользователя был подделан или если пользователь не участвует в проекте, связанном с этим ключом API.",
	"invalid-auth-event": "Произошла внутренняя ошибка.",
	"invalid-verification-code":
		"Код подтверждения SMS, использованный для создания учетных данных для аутентификации телефона, недействителен. Пожалуйста, повторно отправьте смс с кодом подтверждения и обязательно используйте код подтверждения, предоставленный пользователем.",
	"invalid-continue-uri":
		"URL-адрес продолжения, указанный в запросе, недействителен.",
	"invalid-cordova-configuration":
		"Следующие плагины Cordova должны быть установлены для включения входа OAuth: cordova-plugin-buildinfo, cordova-universal-links-plugin, cordova-plugin-browsertab, cordova-plugin-inappbrowser и cordova-plugin-customurlscheme.",
	"invalid-custom-token":
		"Неверный формат пользовательского токена. Пожалуйста, проверьте документацию.",
	"invalid-dynamic-link-domain":
		"Предоставленный домен динамической ссылки не настроен или не авторизован для текущего проекта..",
	"invalid-email": "Адрес электронной почты имеет неправильный формат.",
	"invalid-api-key":
		"Ваш API-ключ недействителен, проверьте, правильно ли вы его скопировали.",
	"invalid-cert-hash": "Предоставленный хэш сертификата SHA-1 недействителен.",
	"invalid-credential":
		"Предоставленные учетные данные для аутентификации имеют неверный формат или срок их действия истек.",
	"invalid-message-payload":
		"Шаблон электронной почты, соответствующий этому действию, содержит недопустимые символы в своем сообщении. Пожалуйста, исправьте, перейдя в раздел шаблонов электронной почты Auth в консоли Firebase.",
	"invalid-multi-factor-session":
		"Запрос не содержит действительного доказательства успешного входа с использованием первого фактора.",
	"invalid-oauth-provider":
		"EmailAuthProvider не поддерживается для этой операции. Эта операция поддерживает только поставщиков OAuth.",
	"invalid-oauth-client-id":
		"Предоставленный идентификатор клиента OAuth либо недействителен, либо не соответствует указанному ключу API.",
	"unauthorized-domain":
		"Этот домен не авторизован для операций OAuth для вашего проекта Firebase. Отредактируйте список авторизованных доменов в консоли Firebase.",
	"invalid-action-code":
		"проект. Отредактируйте список авторизованных доменов в консоли Firebase.",
	"wrong-password": "Пароль недействителен или у пользователя нет пароля.",
	"invalid-persistence-type":
		"Указанный тип сохраняемости является недопустимым. Он может быть только локальным, сеансовым или никаким.",
	"invalid-phone-number":
		"Формат предоставленного номера телефона неверен. Введите номер телефона в формате, который можно преобразовать в формат E.164. Телефонные номера E.164 записываются в формате [+][код страны][номер абонента, включая код города].",
	"invalid-provider-id": "Указанный идентификатор поставщика недействителен.",
	"invalid-recipient-email":
		"Не удалось отправить электронное письмо, соответствующее этому действию, поскольку указанный адрес электронной почты получателя недействителен.",
	"invalid-sender":
		"Шаблон электронной почты, соответствующий этому действию, содержит недопустимый адрес электронной почты или имя отправителя. Пожалуйста, исправьте, перейдя в раздел шаблонов электронной почты Auth в консоли Firebase.",
	"invalid-verification-id":
		"Идентификатор подтверждения, использованный для создания учетных данных для проверки подлинности телефона, недействителен.",
	"invalid-tenant-id":
		"Идентификатор арендатора экземпляра Auth недействителен.",
	"multi-factor-info-not-found":
		"У пользователя нет второго фактора, соответствующего предоставленному идентификатору.",
	"multi-factor-auth-required":
		"Для завершения входа требуется подтверждение владения вторым фактором.",
	"missing-android-pkg-name":
		"Имя пакета Android должно быть указано, если требуется установить приложение Android.",
	"auth-domain-config-required":
		"Обязательно включите authDomain при вызове firebase.initializeApp(), следуя инструкциям в консоли Firebase.",
	"missing-app-credential":
		"В запросе на проверку телефона отсутствует утверждение верификатора приложения. Необходимо предоставить токен ответа reCAPTCHA.",
	"missing-verification-code":
		"Учетные данные для аутентификации телефона были созданы с пустым кодом подтверждения SMS.",
	"missing-continue-uri": "URL-адрес продолжения должен быть указан в запросе.",
	"missing-iframe-start": "Произошла внутренняя ошибка.",
	"missing-ios-bundle-id":
		"Идентификатор пакета iOS должен быть предоставлен, если предоставлен идентификатор магазина приложений.",
	"missing-multi-factor-info":
		"Идентификатор второго фактора не предоставляется.",
	"missing-multi-factor-session":
		"В запросе отсутствует подтверждение первого фактора успешного входа.",
	"missing-or-invalid-nonce":
		"Запрос не содержит допустимого одноразового номера. Это может произойти, если хэш SHA-256 предоставленного необработанного одноразового номера не соответствует хешированному одноразовому номеру в полезной нагрузке токена идентификатора.",
	"missing-phone-number":
		"Для отправки кодов подтверждения укажите номер телефона получателя.",
	"missing-verification-id":
		"Учетные данные для аутентификации телефона были созданы с пустым проверочным идентификатором.",
	"app-deleted": "Этот экземпляр FirebaseApp был удален.",
	"account-exists-with-different-credential":
		"Учетная запись уже существует с таким же адресом электронной почты, но другими учетными данными для входа. Войдите, используя провайдера, связанного с этим адресом электронной почты.",
	"network-request-failed":
		"Произошла сетевая ошибка (например, тайм-аут, прерванное соединение или недоступный хост).",
	"no-auth-event": "Произошла внутренняя ошибка.",
	"no-such-provider":
		"Пользователь не был привязан к учетной записи данного провайдера.",
	"null-user":
		"Нулевой пользовательский объект был предоставлен в качестве аргумента для операции, для которой требуется ненулевой пользовательский объект..",
	"operation-not-allowed":
		"Указанный поставщик услуг входа отключен для этого проекта Firebase. Включите его в консоли Firebase на вкладке «Метод входа» в разделе «Аутентификация».",
	"operation-not-supported-in-this-environment":
		"Эта операция не поддерживается в среде, в которой работает это приложение. «location.protocol» должен быть http, https или chrome-extension, а веб-хранилище должно быть включено.",
	"popup-blocked":
		"Не удалось установить соединение с всплывающим окном. Возможно, он был заблокирован браузером.",
	"popup-closed-by-user":
		"Всплывающее окно было закрыто пользователем до завершения операции.",
	"provider-already-linked":
		"Пользователь может быть связан только с одним идентификатором для данного провайдера.",
	"quota-exceeded": "Превышена квота проекта на эту операцию.",
	"redirect-cancelled-by-user":
		"Операция перенаправления была отменена пользователем до завершения.",
	"redirect-operation-pending":
		"Операция перенаправления входа уже ожидает выполнения.",
	"rejected-credential":
		"Запрос содержит неправильные или несоответствующие учетные данные.",
	"second-factor-already-in-use": "Второй фактор уже зачислен на этот счет.",
	"maximum-second-factor-count-exceeded":
		"Превышено максимально допустимое количество секундных факторов для пользователя.",
	"tenant-id-mismatch":
		"Предоставленный идентификатор клиента не соответствует идентификатору клиента экземпляра Auth.",
	timeout: "Время операции истекло.",
	"user-token-expired":
		"Учетные данные пользователя больше недействительны. Пользователь должен снова войти в систему.",
	"too-many-requests":
		"Мы заблокировали все запросы с этого устройства из-за необычной активности. Попробуйте позже.",
	"unauthorized-continue-uri":
		"Домен URL-адреса продолжения не внесен в белый список. Добавьте домен в белый список в консоли Firebase.",
	"unsupported-first-factor":
		"Для регистрации второго фактора или входа с помощью многофакторной учетной записи требуется вход с поддерживаемым первым фактором.",
	"unsupported-persistence-type":
		"Текущая среда не поддерживает указанный тип сохраняемости.",
	"unsupported-tenant-operation":
		"Эта операция не поддерживается в многопользовательском контексте.",
	"unverified-email":
		"Для операции требуется подтвержденный адрес электронной почты.",
	"user-cancelled":
		"Пользователь не предоставил вашему приложению запрошенные разрешения.",
	"user-not-found":
		"Нет записи пользователя, соответствующей этому идентификатору. Возможно, пользователь был удален.",
	"user-disabled": "Учетная запись пользователя отключена администратором.",
	"user-mismatch":
		"Предоставленные учетные данные не соответствуют ранее вошедшему в систему пользователю.",
	"user-signed-out": "",
	"weak-password": "Пароль должен состоять из 6 символов или более.",
	"web-storage-unsupported":
		"Этот браузер не поддерживается, или сторонние файлы cookie и данные могут быть отключены.",
}

const errorsEn = {
	"admin-restricted-operation":
		"This operation is only available to administrators.",
	"argument-error": "",
	"app-not-authorized":
		"This app, defined by the domain it's hosted on, is not eligible to use Firebase authentication with the provided API key. Check the key configuration in the Google API Console.",
	"app-not-installed":
		"The requested mobile app matching the provided ID (Android package name or iOS package ID) is not installed on this device.",
	"captcha-check-failed":
		"The provided reCAPTCHA response token is either invalid, expired, already used, or the domain associated with it does not match the whitelisted domains.",
	"code-expired":
		"The SMS code has expired. Please resend the verification code to try again.",
	"cordova-not-ready": "The Cordova framework is not ready.",
	"cors-unsupported": "This browser is not supported.",
	"credential-already-in-use":
		"These credentials are already associated with another user account.",
	"custom-token-mismatch":
		"The custom token corresponds to a different audience.",
	"requires-recent-login":
		"This operation is confidential and requires recent authentication. Sign out and sign in again before repeating this request.",
	"dynamic-link-not-activated":
		"Activate dynamic links in the Firebase console and accept the terms.",
	"email-change-needs-verification":
		"Multi-factor users must always have a verified email address.",
	"email-already-in-use":
		"The email address is already in use by another account.",
	"expired-action-code": "The action code has expired.",
	"cancelled-popup-request":
		"This operation was canceled due to the opening of another conflicting popup window.",
	"internal-error": "An internal error has occurred.",
	"invalid-app-credential":
		"The phone verification request contained an invalid app verifier. The reCAPTCHA token response is either invalid or expired.",
	"invalid-app-id":
		"The mobile app ID is not registered for the current project.",
	"invalid-user-token":
		"This user's credentials are not valid for this project. This can happen if the user's token has been forged, or if the user is not part of the project associated with that API key.",
	"invalid-auth-event": "An internal error has occurred.",
	"invalid-verification-code":
		"The SMS verification code used to create the phone authentication credentials is not valid. Please resend the SMS with the verification code and be sure to use the verification code provided by the user.",
	"invalid-continue-uri":
		"The continuation URL specified in the request is not valid.",
	"invalid-cordova-configuration":
		"The following Cordova plugins must be installed to enable OAuth login: cordova-plugin-buildinfo, cordova-universal-links-plugin, cordova-plugin-browsertab, cordova-plugin-inappbrowser, and cordova-plugin-customurlscheme.",
	"invalid-custom-token":
		"Invalid custom token format. Please check the documentation.",
	"invalid-dynamic-link-domain":
		"The provided dynamic link domain is not configured or authorized for the current project.",
	"invalid-email": "The email address is not in the correct format.",
	"invalid-api-key":
		"Your API key is invalid, please check if you copied it correctly.",
	"invalid-cert-hash": "The SHA-1 certificate hash provided is not valid.",
	"invalid-credential":
		"The provided authentication credentials are not in the correct format or have expired.",
	"invalid-message-payload":
		"The email template corresponding to this action contains invalid characters in its message. Please fix it by going to the Auth email templates section in the Firebase console.",
	"invalid-multi-factor-session":
		"The request does not contain valid proof of a successful login using the first factor.",
	"invalid-oauth-provider":
		"EmailAuthProvider is not supported for this operation. This operation only supports OAuth providers.",
	"invalid-oauth-client-id":
		"The provided OAuth client ID is either invalid or does not match the specified API key.",
	"unauthorized-domain":
		"This domain is not authorized for OAuth operations for your Firebase project. Edit the list of authorized domains in the Firebase console.",
	"invalid-action-code":
		"project. Edit the list of authorized domains in the Firebase console.",
	"wrong-password":
		"The password is invalid or the user does not have a password.",
	"invalid-persistence-type":
		"The specified persistence type is invalid. It can only be local, session, or none.",
	"invalid-phone-number":
		"The phone number format provided is invalid. Please enter a phone number in a format that can be converted to E.164 format. E.164 phone numbers are written in the format [+][country code][subscriber number, including city ​​code].",
	"invalid-provider-id": "The specified provider ID is invalid.",
	"invalid-recipient-email":
		"The email corresponding to this action could not be sent because the specified recipient email address is invalid.",
	"invalid-sender":
		"The email template associated with this action contains an invalid email address or sender name. Please fix it by going to the Auth email templates section in the Firebase console.",
	"invalid-verification-id":
		"The verification ID used to generate the phone authentication credentials is invalid.",
	"invalid-tenant-id": "Auth instance tenant id is invalid.",
	"multi-factor-info-not-found":
		"The user does not have a second factor that matches the provided id.",
	"multi-factor-auth-required":
		"Proof of ownership of the second factor is required to complete the login.",
	"missing-android-pkg-name":
		"Android package name must be specified if an Android app is to be installed.",
	"auth-domain-config-required":
		"Be sure to enable authDomain when calling firebase.initializeApp() following the instructions in the Firebase console.",
	"missing-app-credential":
		"The phone verification request is missing an app verifier claim. ReCAPTCHA response token must be provided.",
	"missing-verification-code":
		"The phone authentication credentials were generated with an empty SMS verification code.",
	"missing-continue-uri":
		"A continuation URL must be specified in the request.",
	"missing-iframe-start": "An internal error has occurred.",
	"missing-ios-bundle-id":
		"An iOS bundle id must be provided if an app store id is provided.",
	"missing-multi-factor-info": "No second factor id provided.",
	"missing-multi-factor-session":
		"The request is missing confirmation of the first successful login factor.",
	"missing-or-invalid-nonce":
		"The request does not contain a valid nonce. This can happen if the SHA-256 hash of the supplied raw nonce does not match the hashed nonce in the ID token payload.",
	"missing-phone-number":
		"Please enter the recipient's phone number to send verification codes.",
	"missing-verification-id":
		"The phone authentication credentials were generated with an empty verification id.",
	"app-deleted": "This FirebaseApp instance has been deleted.",
	"account-exists-with-different-credential":
		"An account already exists with the same email address but different login credentials. Sign in using the provider associated with this email address.",
	"network-request-failed":
		"A network error has occurred (such as a timeout, a broken connection, or an unavailable host).",
	"no-auth-event": "An internal error has occurred.",
	"no-such-provider":
		"The user has not been linked to this provider's account.",
	"null-user":
		"A null user object was provided as an argument to an operation that requires a non-null user object..",
	"operation-not-allowed":
		"The specified login service provider is disabled for this Firebase project. Enable it in the Firebase console under the Login Method tab under Authentication.",
	"operation-not-supported-in-this-environment":
		"This operation is not supported in the environment this app is running in. 'location.protocol' must be http, https or chrome-extension and web storage must be enabled .",
	"popup-blocked":
		"Unable to connect to the popup. It may have been blocked by the browser.",
	"popup-closed-by-user":
		"The popup was closed by the user before the operation completed.",
	"provider-already-linked":
		"A user can only be linked to one identifier for a given provider.",
	"quota-exceeded": "The project's quota for this operation has been exceeded.",
	"redirect-cancelled-by-user":
		"The redirect operation was canceled by the user before completion.",
	"redirect-operation-pending":
		"A login redirect operation is already pending.",
	"rejected-credential": "Request contains invalid or mismatched credentials.",
	"second-factor-already-in-use":
		"The second factor is already in this account.",
	"maximum-second-factor-count-exceeded":
		"The maximum allowed number of second factors for the user has been exceeded.",
	"tenant-id-mismatch":
		"The provided tenant id does not match the tenant id of the Auth instance.",
	timeout: "Operation timed out.",
	"user-token-expired":
		"The user's credentials are no longer valid. The user must log in again.",
	"too-many-requests":
		"We have blocked all requests from this device due to unusual activity. Please try again later.",
	"unauthorized-continue-uri":
		"The continuation URL domain is not whitelisted. Whitelist the domain in the Firebase console.",
	"unsupported-first-factor":
		"Signing in with a supported first factor is required to register a second factor or sign in with a multi-factor account.",
	"unsupported-persistence-type":
		"The current environment does not support the specified persistence type.",
	"unsupported-tenant-operation":
		"This operation is not supported in a tenant context.",
	"unverified-email": "The operation requires a verified email address.",
	"user-cancelled":
		"The user did not grant the requested permissions to your app.",
	"user-not-found":
		"There is no user record matching this id. The user may have been deleted.",
	"user-disabled": "The user account has been disabled by the administrator.",
	"user-mismatch":
		"The provided credentials do not match a previously logged in user.",
	"user-signed-out": "",
	"weak-password": "Password must be 6 characters or more.",
	"web-storage-unsupported":
		"This browser is not supported or third party cookies and data may be disabled.",
}

const errorsUk = {
	"admin-restricted-operation": "Ця операція доступна лише адміністраторам.",
	"argument-error": "",
	"app-not-authorized":
		"Ця програма, що визначається доменом, на якому вона розміщена, не має права використовувати автентифікацію Firebase з наданим ключем API. Перевірте конфігурацію ключа в консолі Google API.",
	"app-not-installed":
		"Запитувана мобільна програма, що відповідає наданому ідентифікатору (назва пакета Android або ідентифікатор пакету iOS), не встановлена на цьому пристрої.",
	"captcha-check-failed":
		"Наданий токен відповіді reCAPTCHA є або недійсним, або простроченим, або вже використаним, або домен, пов'язаний з ним, не відповідає списку доменів із білого списку.",
	"code-expired":
		"Термін дії SMS-коду минув. Будь ласка, повторно надішліть код підтвердження, щоб повторити спробу.",
	"cordova-not-ready": "Фреймворк Cordova не готовий.",
	"cors-unsupported": "Цей браузер не підтримується.",
	"credential-already-in-use":
		"Ці облікові дані вже пов'язані з іншим обліковим записом користувача.",
	"custom-token-mismatch": "Токен користувача відповідає іншій аудиторії.",
	"requires-recent-login":
		"Ця операція є конфіденційною і вимагає нещодавньої автентифікації. Вийдіть і увійдіть в обліковий запис ще раз, перш ніж повторити цей запит.",
	"dynamic-link-not-activated":
		"Активуйте динамічні посилання в консолі Firebase і прийміть умови.",
	"email-change-needs-verification":
		"Багатофакторні користувачі завжди повинні мати підтверджену адресу електронної пошти.",
	"email-already-in-use":
		"Адреса електронної пошти вже використовується іншим обліковим записом.",
	"expired-action-code": "Термін дії коду дії минув.",
	"cancelled-popup-request":
		"Ця операція була скасована через відкриття іншого конфліктуючого спливаючого вікна.",
	"internal-error": "Відбулася внутрішня помилка.",
	"invalid-app-credential":
		"Запит на перевірку телефону містить неприпустимий верифікатор програми. Відповідь токена reCAPTCHA або недійсна, або прострочена.",
	"invalid-app-id":
		"Ідентифікатор мобільного додатку не зареєстрований для поточного проекту.",
	"invalid-user-token":
		"Облікові дані цього користувача є недійсними для цього проекту. Це може статися, якщо токен користувача був підроблений або якщо користувач не бере участі в проекті, пов'язаному з цим ключем API.",
	"invalid-auth-event": "Відбулася внутрішня помилка.",
	"invalid-verification-code":
		"Код підтвердження SMS, використаний для створення облікових даних для аутентифікації телефону, недійсний. Будь ласка, повторно надішліть смс із кодом підтвердження та обов'язково використовуйте код підтвердження, наданий користувачем.",
	"invalid-continue-uri":
		"URL-адреса продовження, зазначена у запиті, недійсна.",
	"invalid-cordova-configuration":
		"Наступні плагіни Cordova повинні бути встановлені для включення входу OAuth: cordova-plugin-buildinfo, cordova-universal-links-plugin, cordova-plugin-browsertab, cordova-plugin-inappbrowser та cordova-plugin customurlscheme.",
	"invalid-custom-token":
		"Неправильний формат токена користувача. Будь ласка, перевірте документацію.",
	"invalid-dynamic-link-domain":
		"Наданий домен динамічного посилання не налаштований або не авторизований для поточного проекту..",
	"invalid-email": "Адреса електронної пошти має неправильний формат.",
	"invalid-api-key":
		"Ваш API-ключ недійсний, перевірте, чи правильно ви його скопіювали.",
	"invalid-cert-hash": "Наданий хеш сертифіката SHA-1 недійсний.",
	"invalid-credential":
		"Надані облікові дані для автентифікації мають неправильний формат або термін їх дії минув.",
	"invalid-message-payload":
		"Шаблон електронної пошти, що відповідає цій дії, містить неприпустимі символи у своєму повідомленні. Будь ласка, виправте, перейшовши до розділу шаблонів електронної пошти Auth у консолі Firebase.",
	"invalid-multi-factor-session":
		"Запит не містить дійсного доказу успішного входу з використанням першого фактора.",
	"invalid-oauth-provider":
		"EmailAuthProvider не підтримується для цієї операції. Ця операція підтримує лише постачальників OAuth.",
	"invalid-oauth-client-id":
		"Наданий ідентифікатор клієнта OAuth або недійсний, або не відповідає зазначеному ключу API.",
	"unauthorized-domain":
		"Цей домен не є авторизованим для операцій OAuth для вашого проекту Firebase. Відредагуйте список авторизованих доменів у консолі Firebase.",
	"invalid-action-code":
		"проект. Відредагуйте список авторизованих доменів у консолі Firebase.",
	"wrong-password": "Пароль недійсний або користувач не має пароля.",
	"invalid-persistence-type":
		"Вказаний тип збереження є неприпустимим. Він може бути лише локальним, сеансовим або ніяким.",
	"invalid-phone-number":
		"Формат наданого телефонного номера неправильний. Введіть номер телефону у форматі, який можна перетворити на формат E.164. Телефонні номери E.164 записуються у форматі [+][код країни][номер абонента, включаючи код міста].",
	"invalid-provider-id": "Вказаний ідентифікатор постачальника недійсний.",
	"invalid-recipient-email":
		"Не вдалося надіслати електронного листа, який відповідає цій дії, оскільки вказана адреса електронної пошти одержувача недійсна.",
	"invalid-sender":
		"Шаблон електронної пошти, що відповідає цій дії, містить неприпустиму адресу електронної пошти або ім'я відправника. Будь ласка, виправте, перейшовши до розділу шаблонів електронної пошти Auth у консолі Firebase.",
	"invalid-verification-id":
		"Ідентифікатор підтвердження, використаний для створення облікових даних для автентифікації телефону, недійсний.",
	"invalid-tenant-id": "Ідентифікатор орендаря екземпляра Auth недійсний.",
	"multi-factor-info-not-found":
		"У користувача немає другого фактора, що відповідає наданому ідентифікатору.",
	"multi-factor-auth-required":
		"Для завершення входу потрібне підтвердження володіння другим фактором.",
	"missing-android-pkg-name":
		"Ім'я пакета Android має бути вказано, якщо потрібно встановити програму Android.",
	"auth-domain-config-required":
		"Обов'язково увімкніть authDomain під час виклику firebase.initializeApp(), дотримуючись інструкцій у консолі Firebase.",
	"missing-app-credential":
		"У запиті на перевірку телефону немає затвердження верифікатора програми. Необхідно надати токен відповіді reCAPTCHA.",
	"missing-verification-code":
		"Облікові дані для автентифікації телефону були створені з порожнім кодом підтвердження SMS.",
	"missing-continue-uri":
		"URL-адреса продовження повинна бути вказана у запиті.",
	"missing-iframe-start": "Відбулася внутрішня помилка.",
	"missing-ios-bundle-id":
		"Ідентифікатор пакета iOS повинен бути наданий, якщо наданий ідентифікатор магазину додатків.",
	"missing-multi-factor-info": "Ідентифікатор другого фактора не надається.",
	"missing-multi-factor-session":
		"У запиті відсутнє підтвердження першого фактора успішного входу.",
	"missing-or-invalid-nonce":
		"Запит не містить допустимого одноразового номера. Це може статися, якщо хеш SHA-256 наданого необробленого одноразового номера не відповідає хешованому одноразовому номеру в корисному навантаженні токена ідентифікатора.",
	"missing-phone-number":
		"Для надсилання кодів підтвердження вкажіть номер телефону одержувача.",
	"missing-verification-id":
		"Облікові дані для автентифікації телефону були створені з порожнім ідентифікатором перевірки.",
	"app-deleted": "Цей екземпляр FirebaseApp було видалено.",
	"account-exists-with-different-credential":
		"Обліковий запис вже існує з тією ж адресою електронної пошти, але іншими обліковими даними для входу. Увійдіть за допомогою провайдера, пов'язаного з цією адресою електронної пошти.",
	"network-request-failed":
		"Відбулася мережна помилка (наприклад, тайм-аут, перерване з'єднання або недоступний хост).",
	"no-auth-event": "Відбулася внутрішня помилка.",
	"no-such-provider":
		"Користувач не був прив'язаний до облікового запису цього провайдера.",
	"null-user":
		"Нульовий об'єкт користувача був наданий як аргумент для операції, для якої потрібно ненульовий об'єкт користувача..",
	"operation-not-allowed":
		"Вказаний постачальник послуг входу вимкнено для цього проекту Firebase. Увімкніть його в консолі Firebase на вкладці «Метод входу» в розділі «Автентифікація».",
	"operation-not-supported-in-this-environment":
		"Ця операція не підтримується в середовищі, в якому працює ця програма. «location.protocol» повинен бути http, https або chrome-extension, а веб-сховище має бути включене .",
	"popup-blocked":
		"Не вдалося встановити з'єднання зі спливаючою вікном. Можливо, він був заблокований браузером.",
	"popup-closed-by-user":
		"Спливне вікно було закрито користувачем до завершення операції.",
	"provider-already-linked":
		"Користувач може бути пов'язаний лише з одним ідентифікатором для цього провайдера.",
	"quota-exceeded": "Перевищено квоту проекту на цю операцію.",
	"redirect-cancelled-by-user":
		"Операцію перенаправлення було скасовано користувачем до завершення.",
	"redirect-operation-pending":
		"Операція перенаправлення входу вже чекає на виконання.",
	"rejected-credential":
		"Запит містить неправильні або невідповідні облікові дані.",
	"second-factor-already-in-use":
		"Другий фактор вже зарахований з цього приводу.",
	"maximum-second-factor-count-exceeded":
		"Перевищено максимально допустиму кількість секундних факторів для користувача.",
	"tenant-id-mismatch":
		"Наданий ідентифікатор клієнта не відповідає ідентифікатору клієнта екземпляра Auth.",
	timeout: "Час операції закінчився.",
	"user-token-expired":
		"Облікові дані користувача більше не дійсні. Користувач повинен знову увійти до системи.",
	"too-many-requests":
		"Ми заблокували всі запити з цього пристрою через незвичайну активність. Спробуйте пізніше.",
	"unauthorized-continue-uri":
		"Домен URL-адреси продовження не внесений до білого списку. Додайте домен до білого списку в консолі Firebase.",
	"unsupported-first-factor":
		"Для реєстрації другого фактора або входу за допомогою багатофакторного облікового запису потрібен вхід з підтримуваним першим фактором.",
	"unsupported-persistence-type":
		"Поточне середовище не підтримує зазначений тип збереження.",
	"unsupported-tenant-operation":
		"Ця операція не підтримується в розрахованому на багато користувачів контексті.",
	"unverified-email":
		"Для операції потрібна підтверджена адреса електронної пошти.",
	"user-cancelled": "Користувач не надав вашій програмі запитаних дозволів.",
	"user-not-found":
		"Немає запису користувача, який відповідає цьому ідентифікатору. Можливо, користувач був видалений.",
	"user-disabled": "Обліковий запис користувача вимкнено адміністратором.",
	"user-mismatch":
		"Надані облікові дані не відповідають користувачеві, що раніше увійшов до системи.",
	"user-signed-out": "",
	"weak-password": "Пароль повинен складатися з шести або більше символів.",
	"web-storage-unsupported":
		"Цей браузер не підтримується, або сторонні файли cookie та дані можуть бути вимкнені.",
}

export const getErrorMessage = (error: string, lang) => {
	if (lang === "ru_RU") {
		for (const key in errorsRu) {
			if (error.toLocaleLowerCase().includes(key.toLocaleLowerCase()))
				return errorsRu[key]
		}
	} else if (lang === "en_US") {
		for (const key in errorsEn) {
			if (error.toLocaleLowerCase().includes(key.toLocaleLowerCase()))
				return errorsEn[key]
		}
	} else if (lang === "uk_UA") {
		for (const key in errorsUk) {
			if (error.toLocaleLowerCase().includes(key.toLocaleLowerCase()))
				return errorsUk[key]
		}
	}
}
