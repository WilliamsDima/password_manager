# Архитектура v2

Статус: **принято** (2026-11-25). Обязательно для всего нового кода.

## 1. Выбор: FSD + DI-сервисы на классах

- **Структура кода: Feature-Sliced Design.** Он отвечает на вопрос «где лежит код экрана/фичи».
- **Данные и инфраструктура: классы за интерфейсами (порты и адаптеры) + внедрение зависимостей
  через конструктор.** Это отвечает на вопрос «как заменить библиотеку, не трогая остальной код».
- Полную Clean Architecture (use cases, отдельные domain-модели, мапперы на каждом слое) не берём:
  для одной сущности «запись» это шаблонный код без пользы. Берём из неё главное: зависимость от
  абстракций и единую точку сборки.

## 2. Слои FSD

```
src/
  app/        точка входа: провайдеры, навигация, store, тема, DI-контейнер (composition root)
  pages/      экраны: sign-in, unlock, vault-setup, vault, entry-details, entry-edit, settings
  widgets/    крупные блоки экрана: entry-list (список с поиском), onboarding (первая настройка)
  features/   действия пользователя: copy-secret, edit-entry (форма и генератор паролей),
              delete-entry, toggle-favorite, open-url, lock-mode, switch-theme,
              vault-backup, vault-migration
  entities/   бизнес-сущности: entry (запись), session (пользователь/сессия/ключ)
  shared/     без бизнес-логики: ui-kit, theme, lib, config, services (интерфейсы + реализации)
```

Правила:
- Импорт только **вниз**: `app → pages → widgets → features → entities → shared`.
- Слайсы одного слоя не импортируют друг друга.
- Наружу слайс отдаёт только то, что есть в его `index.ts` (public API). Глубокие импорты
  `entities/entry/model/...` извне запрещены.
- Сегменты внутри слайса: `ui/`, `model/`, `api/`, `lib/`, `config/`.
- Правила проверяются линтером (`eslint-plugin-boundaries` или `@feature-sliced/eslint-config`).

## 3. Сервисы и DI

### 3.1 Уровни

```
UI (React)  →  RTK Query endpoints  →  Repository (класс)  →  Сервисы-адаптеры (классы)  →  библиотеки
                (кэш, loading)          (бизнес-логика)         (только вызовы I/O)
```

1. **Адаптер** (`shared/services/<name>/`). Тонкий класс, реализующий интерфейс. Делает **только**
   вызовы библиотеки, без бизнес-логики. Примеры:
   - `IRemoteStore` → `FirestoreSdkStore` (firebase SDK) | `FirestoreRestStore` (fetch/REST)
   - `IAuthService` → `FirebaseAuthService`
   - `ICryptoService` → `NobleCryptoService` (AES-GCM, HKDF); `IKdf` → `NobleScryptKdf`;
     `IRandom` → `ExpoRandom`; для миграции `ILegacyDecryptor` → `CryptoJsLegacyDecryptor`
   - `ISecureStorage` → `ExpoSecureStorage` (биометрия тоже через него, CRYPTO.md §8.1); выбор темы хранится тем же `ISecureStorage` без биометрии (ключ `pm.theme.mode`, 6.1); отдельный `IKeyValueStorage` (MMKV) добавим, только если понадобится
   - `IHaptics`, `IClipboard`; отдельный `IBiometrics` — только если понадобится проверка без SecureStore
2. **Репозиторий** (`entities/<entity>/api/`). Класс, который получает адаптеры через конструктор
   и реализует операции сущности: `EntryRepository(remoteStore, crypto, session)` →
   `list()`, `create()`, `update()`, `remove()`. Здесь шифрование, валидация, маппинг.
3. **RTK Query** (`entities/<entity>/api/<entity>Api.ts`). Endpoints через `queryFn`, без
   `baseQuery`-HTTP. Репозиторий берётся из `api.extra` (это `extraArgument` store):

```ts
export const entryApi = baseApi.injectEndpoints({
  endpoints: build => ({
    getEntries: build.query<readonly Entry[], void>({
      queryFn: async (_arg, { extra }) => {
        const { entryRepository } = extra as AppDependencies
        return toQueryResult(() => entryRepository.list())
      },
      providesTags: ['Entry'],
    }),
  }),
})
```

4. **Composition root** (`app/di/container.ts`). **Единственное** место, где создаются реализации
   и связываются друг с другом. Передаётся в store как `extraArgument` и, при необходимости, через
   React Context для не-RTK сервисов (haptics, clipboard).

```ts
export const createContainer = (): AppDependencies => {
  const remoteStore: IRemoteStore = new FirestoreSdkStore(firebaseApp)
  const random: IRandom = new ExpoRandom()
  const crypto: ICryptoService = new NobleCryptoService(random)
  const session = new VaultLockService(new ExpoSecureStorage(), crypto, new NobleScryptKdf(), random)
  return {
    entryRepository: new EntryRepository(remoteStore, crypto, session),
    haptics: new HapticsService(),
    clipboard: new ClipboardService(),
  }
}
```

**Замена библиотеки = новый класс-адаптер + одна строка в `createContainer`.** Остальной код
зависит только от интерфейса.

### 3.2 Правила
- DI вручную, через конструктор. Без `inversify`/`tsyringe`: не нужны декораторы и
  `reflect-metadata`, и типы проверяются компилятором.
- Классы не создают свои зависимости сами (`new` внутри класса запрещён, кроме value-объектов).
- Интерфейсы называются `IName`. Зависимости хранятся в `private readonly` полях.
- Тесты подменяют адаптеры фейковыми классами через тот же интерфейс.
- React-компоненты **не** импортируют адаптеры и библиотеки I/O напрямую. Только хуки RTK Query или
  хуки `useHaptics()`/`useClipboard()` из контекста.

Модель шифрования, ключи и миграция: [CRYPTO.md](CRYPTO.md).

## 4. Стандарты кода

- TypeScript `strict: true`, плюс `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.
- **Запрещено:** `let` (только `const`), `var`, `any` (явный и неявный), `as any`, `@ts-ignore`
  (допустим `@ts-expect-error` с комментарием), `console.log` в коммитах, мутация state/props.
- Только функциональные компоненты и хуки. Классы используются для сервисов и репозиториев, не для UI.
- Неизменяемость: `readonly`, `as const`, методы массивов без мутаций.
- Ошибки типизированы (`Result`/свои классы ошибок), без проглоченных `catch`.
- ESLint (flat config) + `@typescript-eslint` strict + Prettier. Правила запрета `let`/`any` в линтере
  как `error`.
- Именование: компоненты `PascalCase`, хуки `useX`, файлы слайсов в `kebab-case`.

## 5. UI/UX

- Тема: **светлая / тёмная / системная**. Токены темы (цвета, отступы, радиусы, типографика) в
  `shared/theme`, выбор сохраняется. Никаких захардкоженных цветов в компонентах.
- Анимации: `react-native-reanimated` (переходы экранов, появление элементов списка, раскрытие
  карточки, shake при неверном PIN, layout-анимации), `react-native-gesture-handler` (свайпы).
- Вибро-отклик через `IHaptics`: лёгкий при нажатиях и копировании, success/error при
  разблокировке и сохранении, selection при переключателях.
- Один язык интерфейса (русский). Строки лежат в одном модуле констант, не разбросаны по коду.
