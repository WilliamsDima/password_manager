# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

React Native 0.68 (React 17, TypeScript) password manager for Android (package `com.eclipse.account_manager`; formerly on Google Play, now distributed only as an APK to the owner and possibly friends; registration stays open, so per-user isolation relies on Firestore rules). Users store login/password entries that are encrypted on-device before being saved to Firebase Firestore. UI languages: ru (default `ru_RU`), en, uk.

## Commands

```bash
npm install
npm start            # Metro bundler
npm run android      # build & run on device/emulator
npm run ios          # iOS project is still the template's "MoneyManager" and largely unmaintained
npm run lint         # eslint (@react-native-community config)
npm test             # jest, preset react-native
npx jest __tests__/App-test.js   # single test (only a default smoke test exists)
```

### Required untracked files

The app will not build without these (both are gitignored):
- `src/config/firebase.ts` — Firebase init. Must export `auth`, `db` (Firestore **lite**), and helpers `login`, `logout`, `register`, `recovery`, `getUserData`, `deleteProfile` (imported by [src/hooks/useAuth.tsx](src/hooks/useAuth.tsx)).
- `google-services.json` for Android.

Note: the native folder is `Android/` (capital A), and `.gitignore` lists `Android/` even though its files are tracked.

## Encryption model (the core of the app)

There is **one symmetric key per user**, not two keys. It is held only by the user/device and never sent to Firebase:

1. **Key generation** ([src/components/templates/KeyGen/index.tsx](src/components/templates/KeyGen/index.tsx)): after registration, the key is generated as `CryptoJS.AES.encrypt(uid + timestamp, accessToken)` — effectively a random string. It is shown as text and a QR code; the user is told to save it (screenshot). Pressing "saved" dispatches `setKey`.
2. **Storage of the key**: the `setKey` reducer writes it to `react-native-encrypted-storage` (Android Keystore) under `KEY`. On startup [src/navigation/routes.tsx](src/navigation/routes.tsx) loads `KEY`, `USER_PIN` (encrypted storage) and `USER`, `LANG` (plain AsyncStorage) into Redux.
3. **Login on a new device**: the user enters email + password (Firebase Auth) **plus** the key, typed in or scanned from the QR via `react-native-camera` ([src/components/templates/Camera/index.tsx](src/components/templates/Camera/index.tsx)).
4. **Encrypt/decrypt** ([src/hooks/helpers.ts](src/hooks/helpers.ts)): `EncryptData`/`DecryptData` use CryptoJS AES with the key as a passphrase (CryptoJS derives the actual key and salt itself, OpenSSL-compatible format) on `JSON.stringify`'d values. Both `title` and `message` (JSON of `{login, password, description}`) of each item are encrypted in [src/components/molecules/FormItem/index.tsx](src/components/molecules/FormItem/index.tsx); decryption happens on display in `ListItem`.
5. **Firestore** holds only ciphertext: document `users/{uid}` = `{id, email, displayName, dateCreate, items: IItem[]}`, where `IItem = {id: timestamp, title: cipher, message: cipher}`. The whole `items` array is rewritten on every change (`updateItemAPI`).

Consequences: if the key is lost, the data cannot be recovered (password recovery only resets Firebase Auth). A wrong key makes `DecryptData` throw/return garbage → `keyError` shows the `key_message` alert. Logout and account deletion clear both local storages, including the key.

The PIN screen ([src/components/templates/Pin/index.tsx](src/components/templates/Pin/index.tsx)) is only a local lock; the PIN is compared in plain form against the encrypted-storage value and plays no part in encryption.

## Architecture notes

- **State**: a single Redux Toolkit slice `main` ([src/store/redusers/main/main.ts](src/store/redusers/main/main.ts)), with reducers defined separately in [src/store/actions/main/mainAC.ts](src/store/actions/main/mainAC.ts). **Reducers have side effects**: they persist to AsyncStorage/EncryptedStorage and call Firestore (`addItem`/`editItem`/`deleteItem` → `updateItemAPI`, `updateProfile` → `updateProfileAPI`). Components dispatch via `useActions()` (bound action creators) and read via `useAppSelector`.
- **Auth**: `AuthProvider` in [src/hooks/useAuth.tsx](src/hooks/useAuth.tsx) wraps the app, listens to `onAuthStateChanged` and exposes login/register/logout/recovery/delete handlers. Firebase errors are mapped to localized text by [src/services/errorsMessage.tsx](src/services/errorsMessage.tsx).
- **Navigation**: `Routes` shows `AuthRoutes` (stack) when there is no Redux `user`, otherwise `TabNavigation`. Route names are in `navigation/routes-names.ts`.
- **Components** follow Atomic Design (`atoms` → `molecules` → `organisms` → `templates`); `src/screens/*` are thin wrappers around templates. Folder names keep their original typos (`redusers`, `ListAccaunts`, `Empty/inxdex.tsx`) — don't "fix" them without updating imports.
- **i18n**: i18next with `src/i18n/{ru,en,uk}.json`; keys are typed via `ITranslate.ts` / `react-i18next.d.ts`, so new keys must go into all three JSON files and the type. Some validation messages in `FormItem` are still hardcoded in Russian.
- The README describes `models`/`repositories`/`services`/`modules` DI layers from the original template; apart from `services`, they are **not** present in this app.

## Work process (rework in progress)

- The plan lives in [docs/ROADMAP.md](docs/ROADMAP.md): read it at the start of a session, keep "Текущий статус" and the checkboxes up to date, and record decisions in "Журнал решений".
- Each task: implement → `code-reviewer` agent → fixes → `task-verifier` agent → mark done. The `/next-step` skill runs this cycle.
- Decided: the app is never published (APK only); one UI language (Russian); no external links, "leave a review" button, or language switcher.
- **Target architecture for all new code: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** (FSD layers + class-based services behind interfaces, wired only in `app/di/container.ts`; RTK Query endpoints use `queryFn` with repositories from `extra`). Code rules: TS strict, no `let`, no `any`, no `@ts-ignore`, functional components only. The sections above describe the **legacy** app being replaced.
- Encryption, key handling, Firestore schema and migration for v2: [docs/CRYPTO.md](docs/CRYPTO.md). Security findings: [docs/SECURITY_AUDIT.md](docs/SECURITY_AUDIT.md).
- Git: all rework happens on branch `feature/v2-rework`. Commit messages follow Conventional Commits (`feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `build:`, `test:`, `style:`, `perf:`, `ci:`; optional scope, e.g. `feat(crypto): ...`; imperative, English subject line). **Never commit or push without the user's explicit permission in the current conversation**: after a task is done, propose the commit message and wait.
- Telegram notifications: `.claude/hooks/telegram-notify.mjs` (Stop/Notification hooks), secrets in gitignored `.claude/telegram.json`.
- Data backup: `node scripts/backup-firestore.mjs` → `backups/` (gitignored, ciphertext only).
