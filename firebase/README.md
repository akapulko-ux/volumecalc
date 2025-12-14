# Force update via Firebase Remote Config

## What was added
- Cloud Function `setMinVersion` to write `minSupportedVersion` and optional `forceUpdateLink` parameters in Remote Config.
- Simple hosting page (`hosting/index.html`) that calls the function with an admin secret.

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

## iOS app expectations
- Remote Config parameters: `minSupportedVersion`, `forceUpdateLink`.
- If `CFBundleShortVersionString` is less than `minSupportedVersion`, the app shows a blocking update screen and opens `forceUpdateLink` on tap.
- Provide a real `GoogleService-Info.plist` in `ios/TradingCalculator/TradingCalculator/` and ensure Firebase Remote Config is enabled for the project.

