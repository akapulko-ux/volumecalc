import Foundation
import FirebaseCore
import FirebaseRemoteConfig

final class VersionChecker {
    enum Status: Equatable {
        case upToDate
        case outdated(required: String, appStoreURL: URL?)
        case unavailable
    }

    private let remoteConfig: RemoteConfig
    private let defaults: [String: NSObject] = [
        "minSupportedVersion": "1.0.0" as NSString,
        "forceUpdateLink": "" as NSString
    ]

    init(remoteConfig: RemoteConfig = RemoteConfig.remoteConfig()) {
        self.remoteConfig = remoteConfig
        let settings = RemoteConfigSettings()
        settings.minimumFetchInterval = 3600
        remoteConfig.configSettings = settings
        remoteConfig.setDefaults(defaults)
    }

    func checkVersion(completion: @escaping (Status) -> Void) {
        guard FirebaseApp.app() != nil else {
            completion(.unavailable)
            return
        }

        remoteConfig.fetchAndActivate { [weak self] _, error in
            guard let self else {
                completion(.unavailable)
                return
            }
            if error != nil {
                // Use cached/default values even if fetch fails.
                self.evaluate(completion: completion)
            } else {
                self.evaluate(completion: completion)
            }
        }
    }

    private func evaluate(completion: @escaping (Status) -> Void) {
        let minVersion = remoteConfig["minSupportedVersion"].stringValue
        let appStoreLink = remoteConfig["forceUpdateLink"].stringValue
        let current = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "0.0.0"

        if compare(current, isLessThan: minVersion) {
            completion(.outdated(required: minVersion, appStoreURL: URL(string: appStoreLink)))
        } else {
            completion(.upToDate)
        }
    }

    private func compare(_ lhs: String, isLessThan rhs: String) -> Bool {
        let lhsParts = lhs.split(separator: ".").map { Int($0) ?? 0 }
        let rhsParts = rhs.split(separator: ".").map { Int($0) ?? 0 }
        let maxCount = max(lhsParts.count, rhsParts.count)

        for i in 0..<maxCount {
            let l = i < lhsParts.count ? lhsParts[i] : 0
            let r = i < rhsParts.count ? rhsParts[i] : 0
            if l < r { return true }
            if l > r { return false }
        }
        return false
    }
}

