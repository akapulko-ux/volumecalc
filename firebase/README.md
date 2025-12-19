# Force update via Firebase Remote Config

## What was added
- Cloud Function `setMinVersion` to write `minSupportedVersion` and optional `forceUpdateLink` parameters in Remote Config.
- Simple hosting page (`hosting/index.html`) that calls the function with an admin secret.
- Web-приложение калькулятора (React + shadcn) собирается из каталога `../web` в `hosting/` (Vite build).

## Deploy steps
1. In the Firebase project, enable Remote Config and Hosting; create a Functions backend.
2. Set an admin secret before deploy:
   ```
   firebase functions:config:set force_update.secret="YOUR_STRONG_SECRET"
   ```
   or set environment variable `FORCE_UPDATE_SECRET` in the deployment environment.
3. Deploy functions and hosting from `firebase/`:
   ```
   firebase deploy --only functions:setMinVersion,hosting
   ```
4. Open the hosting URL, fill in:
   - `minSupportedVersion` (e.g., 1.2.3)
   - `forceUpdateLink` (App Store URL)
   - `Admin secret` (same as above)
   - `Cloud Function endpoint` (e.g., https://us-central1-<project>.cloudfunctions.net/setMinVersion)
   Click **Apply** to push values.
5. Web-app deploy:
   ```
   cd ../web
   npm install
   npm run build
   cd ../firebase
   firebase deploy --only hosting
   ```
   Админ-страница force-update доступна как `force-update-admin.html` и лежит в `web/public/force-update-admin.html` (копируется в билд).

## iOS app expectations
- Remote Config parameters: `minSupportedVersion`, `forceUpdateLink`.
- If `CFBundleShortVersionString` is less than `minSupportedVersion`, the app shows a blocking update screen and opens `forceUpdateLink` on tap.
- Provide a real `GoogleService-Info.plist` in `ios/TradingCalculator/TradingCalculator/` and ensure Firebase Remote Config is enabled for the project.

## Web env
- Добавьте `.env` в `web/` (или используйте переменные окружения) с web-конфигом Firebase:
  ```
  VITE_FIREBASE_API_KEY=...
  VITE_FIREBASE_AUTH_DOMAIN=tradevolume-3e698.firebaseapp.com
  VITE_FIREBASE_PROJECT_ID=tradevolume-3e698
  VITE_FIREBASE_STORAGE_BUCKET=tradevolume-3e698.firebasestorage.app
  VITE_FIREBASE_MESSAGING_SENDER_ID=672120005972
  VITE_FIREBASE_APP_ID=...   # web app id из Firebase console
  VITE_FIREBASE_MEASUREMENT_ID=...
  VITE_APP_VERSION=1.0.0
  ```
  При отсутствии конфига Remote Config в вебе будет отключён (приложение продолжит работать).


