import SwiftUI
import FirebaseCore

@main
struct TradingCalculatorApp: App {
    init() {
        FirebaseApp.configure()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}



