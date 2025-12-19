import { getApps, initializeApp, type FirebaseApp } from "firebase/app"
import {
  fetchAndActivate,
  getRemoteConfig,
  getValue,
  type RemoteConfig,
} from "firebase/remote-config"

type VersionStatus =
  | { state: "upToDate" }
  | { state: "outdated"; requiredVersion: string; link?: string }
  | { state: "unavailable" }

type FirebaseConfig = {
  apiKey?: string
  authDomain?: string
  projectId?: string
  storageBucket?: string
  messagingSenderId?: string
  appId?: string
  measurementId?: string
}

const firebaseConfig: FirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "tradevolume-3e698.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "tradevolume-3e698",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ??
    "tradevolume-3e698.firebasestorage.app",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "672120005972",
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

const hasRequiredConfig =
  !!firebaseConfig.apiKey &&
  !!firebaseConfig.authDomain &&
  !!firebaseConfig.projectId &&
  !!firebaseConfig.messagingSenderId &&
  !!firebaseConfig.appId

let app: FirebaseApp | null = null
let remoteConfig: RemoteConfig | null = null

function ensureApp() {
  if (!hasRequiredConfig) return null
  if (app) return app
  app = getApps()[0] ?? initializeApp(firebaseConfig)
  return app
}

function ensureRemoteConfig() {
  if (remoteConfig) return remoteConfig
  const ensuredApp = ensureApp()
  if (!ensuredApp) return null
  const rc = getRemoteConfig(ensuredApp)
  rc.settings = {
    minimumFetchIntervalMillis: 3600 * 1000,
    fetchTimeoutMillis: 10_000,
  }
  rc.defaultConfig = {
    minSupportedVersion: "1.0.0",
    forceUpdateLink: "",
  }
  remoteConfig = rc
  return rc
}

export async function checkVersion(): Promise<VersionStatus> {
  const rc = ensureRemoteConfig()
  if (!rc) return { state: "unavailable" }

  try {
    await fetchAndActivate(rc)
    const minVersion = getValue(rc, "minSupportedVersion").asString()
    const updateLink = getValue(rc, "forceUpdateLink").asString()
    const currentVersion = import.meta.env.VITE_APP_VERSION ?? "1.0.0"

    if (compare(currentVersion, minVersion)) {
      return {
        state: "outdated",
        requiredVersion: minVersion,
        link: updateLink || undefined,
      }
    }
    return { state: "upToDate" }
  } catch (error) {
    console.warn("[remote-config] unavailable", error)
    return { state: "unavailable" }
  }
}

function compare(current: string, required: string): boolean {
  const lhsParts = current.split(".").map((p) => Number.parseInt(p, 10) || 0)
  const rhsParts = required.split(".").map((p) => Number.parseInt(p, 10) || 0)
  const maxLen = Math.max(lhsParts.length, rhsParts.length)

  for (let i = 0; i < maxLen; i += 1) {
    const lhs = lhsParts[i] ?? 0
    const rhs = rhsParts[i] ?? 0
    if (lhs < rhs) return true
    if (lhs > rhs) return false
  }
  return false
}

