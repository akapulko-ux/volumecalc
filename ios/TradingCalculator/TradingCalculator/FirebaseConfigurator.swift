import Foundation
import FirebaseCore

enum FirebaseConfigurator {
    static func configureIfNeeded() {
        guard FirebaseApp.app() == nil else { return }

        if let filePath = Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist"),
           let options = FirebaseOptions(contentsOfFile: filePath) {
            FirebaseApp.configure(options: options)
        } else {
            // Firebase config not found — skip configure to avoid runtime crash.
            print("Firebase not configured: missing GoogleService-Info.plist")
        }
    }
}

