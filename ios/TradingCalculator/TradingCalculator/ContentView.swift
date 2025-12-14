import SwiftUI
#if os(macOS)
import AppKit
#endif

struct ContentView: View {
    @State private var stopAmount: String = ""
    @State private var percent: String = ""
    @State private var result: Double?
    @State private var copied: Bool = false
    @State private var updateRequired: Bool = false
    @State private var requiredVersion: String?
    @State private var updateURL: URL?
    @State private var showHelp: Bool = false
    @State private var showDonate: Bool = false
    @AppStorage("appLanguage") private var appLanguage: String = "ru"
    @AppStorage("themeOverride") private var themeOverride: String?
    @FocusState private var focusedField: Field?

    private let logic = CalculatorLogic()
    private let versionChecker = VersionChecker()
    @Environment(\.colorScheme) private var systemColorScheme
    @Environment(\.locale) private var locale
    @Environment(\.scenePhase) private var scenePhase

    var body: some View {
        ZStack {
            gradientBackground
                .ignoresSafeArea()

            ScrollView {
                VStack(spacing: 24) {
                    header
                    inputs
                    if let result {
                        resultCard(value: result)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 32)
            }
        }
        .allowsHitTesting(!updateRequired && !showHelp && !showDonate)
        .onTapGesture {
            focusedField = nil
        }
        .overlay(alignment: .center) {
            if updateRequired {
                forceUpdateOverlay
            }
        }
        .overlay(alignment: .bottomTrailing) {
            helpButton
        }
        #if os(macOS) || targetEnvironment(macCatalyst)
        .overlay {
            macOverlays
        }
        #else
        .sheet(isPresented: $showHelp) {
            helpSheet
        }
        .sheet(isPresented: $showDonate) {
            DonateView()
        }
        #endif
        .preferredColorScheme(preferredColorScheme)
#if os(macOS)
        .onChange(of: stopAmount) { _, newValue in
            let cleaned = sanitizeNumeric(newValue)
            if cleaned != stopAmount {
                stopAmount = cleaned
                return
            }
            calculate()
        }
        .onChange(of: percent) { _, newValue in
            let cleaned = sanitizeNumeric(newValue)
            if cleaned != percent {
                percent = cleaned
                return
            }
            enforcePercentLimit(cleaned)
            calculate()
        }
        .onChange(of: scenePhase) { _, phase in
            if phase == .active {
                Task { await performVersionCheck() }
            }
        }
#else
        .onChange(of: stopAmount) { newValue in
            let cleaned = sanitizeNumeric(newValue)
            if cleaned != stopAmount {
                stopAmount = cleaned
                return
            }
            calculate()
        }
        .onChange(of: percent) { newValue in
            let cleaned = sanitizeNumeric(newValue)
            if cleaned != percent {
                percent = cleaned
                return
            }
            enforcePercentLimit(cleaned)
            calculate()
        }
        .onChange(of: scenePhase) { phase in
            if phase == .active {
                Task { await performVersionCheck() }
            }
        }
#endif
        .environment(\.locale, Locale(identifier: appLanguage))
        .task {
            await performVersionCheck()
        }
    }

    private var gradientBackground: some View {
        LinearGradient(
            gradient: Gradient(colors: isDarkModeActive
                               ? [Color(.sRGB, red: 0.11, green: 0.12, blue: 0.15, opacity: 1),
                                  Color(.sRGB, red: 0.09, green: 0.1, blue: 0.12, opacity: 1)]
                               : [Color(.sRGB, red: 0.9, green: 0.94, blue: 1, opacity: 1),
                                  Color(.sRGB, red: 0.85, green: 0.9, blue: 1, opacity: 1)]),
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    private var header: some View {
        HStack {
            Label {
                Text(LocalizedStringKey("volume_title"))
                    .font(.system(size: 24, weight: .semibold))
            } icon: {
                Image(systemName: "av.remote")
                    .font(.system(size: 22, weight: .semibold))
            }
            .foregroundColor(isDarkModeActive ? Color.white : Color.primary)

            Spacer()

            Button(action: toggleLanguage) {
                Text(appLanguage.uppercased())
                    .font(.system(size: 14, weight: .semibold))
                    .padding(.horizontal, 10)
                    .padding(.vertical, 8)
                    .background(isDarkModeActive ? Color.gray.opacity(0.35) : Color.gray.opacity(0.15))
                    .foregroundColor(isDarkModeActive ? Color.white : Color.primary)
                    .clipShape(Capsule())
            }
            .accessibilityLabel(LocalizedStringKey("language_button"))

            Button(action: { withAnimation { toggleTheme() } }) {
                Image(systemName: isDarkModeActive ? "sun.max.fill" : "moon.fill")
                    .font(.system(size: 18, weight: .bold))
                    .padding(10)
                    .background(isDarkModeActive ? Color.gray.opacity(0.35) : Color.gray.opacity(0.15))
                    .foregroundColor(isDarkModeActive ? Color.yellow : Color.gray)
                    .clipShape(Circle())
            }
            .accessibilityLabel(LocalizedStringKey(isDarkModeActive ? "theme_light" : "theme_dark"))
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(isDarkModeActive ? Color(.sRGB, white: 0.12, opacity: 1) : Color.white)
                .shadow(color: .black.opacity(0.08), radius: 16, x: 0, y: 8)
        )
    }

    private var inputs: some View {
        VStack(spacing: 16) {
            HStack(spacing: 16) {
                inputCard(
                    title: "stop_amount",
                    help: "stop_amount_help",
                    value: $stopAmount,
                    isPrimary: true
                )
                inputCard(
                    title: "percent",
                    help: "percent_help",
                    value: $percent,
                    isPrimary: false
                )
            }
            .frame(maxWidth: .infinity)
        }
    }

    private func inputCard(title: String, help: String, value: Binding<String>, isPrimary: Bool) -> some View {
        VStack(alignment: .center, spacing: 10) {
            Text(LocalizedStringKey(title))
                .font(.headline)
                .foregroundColor(isDarkModeActive ? Color.white : Color.primary)
                .frame(maxWidth: .infinity, alignment: .center)

            ZStack(alignment: .trailing) {
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(isDarkModeActive ? Color(.sRGB, white: 0.18, opacity: 1) : (isPrimary ? Color(.systemBlue).opacity(0.08) : Color(.systemGreen).opacity(0.08)))
                    .overlay(
                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                            .stroke(isDarkModeActive ? Color(.sRGB, white: 0.3, opacity: 1) : (isPrimary ? Color(.systemBlue).opacity(0.25) : Color(.systemGreen).opacity(0.25)), lineWidth: 2)
                    )
                    .frame(height: 86)

                TextField(LocalizedStringKey("placeholder_amount"), text: value)
                    #if os(iOS)
                    .keyboardType(UIKeyboardType.decimalPad)
                    #endif
                    .multilineTextAlignment(TextAlignment.center)
                    .font(Font.system(size: 28, weight: .bold, design: .rounded))
                    .foregroundColor(isDarkModeActive ? Color.white : Color.primary)
                    .padding(.horizontal, 12)
                    .focused($focusedField, equals: title == "stop_amount" ? Field.stop : Field.percent)

                if !value.wrappedValue.isEmpty && title == "percent" {
                    Button(action: clearPercent) {
                        Image(systemName: "xmark.circle.fill")
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(Color.gray.opacity(0.6))
                            .padding(.trailing, 12)
                    }
                }
            }

            Text(LocalizedStringKey(help))
                .font(.footnote)
                .foregroundColor(isDarkModeActive ? Color.gray.opacity(0.6) : Color.gray)
                .frame(maxWidth: .infinity, alignment: .center)
        }
    }

    private func resultCard(value: Double) -> some View {
        VStack(spacing: 12) {
            Text(LocalizedStringKey("result"))
                .font(.subheadline)
                .foregroundColor(isDarkModeActive ? Color.gray.opacity(0.6) : Color.gray)

            HStack(spacing: 12) {
                Text(String(format: "%.1f", value))
                    .font(.system(size: 40, weight: .bold, design: .rounded))
                    .foregroundColor(Color.blue)

                Button(action: copyResult) {
                    Image(systemName: "doc.on.doc.fill")
                        .font(.system(size: 18, weight: .semibold))
                        .padding(10)
                        .background(copied ? Color.green.opacity(0.2) : (isDarkModeActive ? Color.gray.opacity(0.3) : Color.blue.opacity(0.12)))
                        .foregroundColor(copied ? Color.green : Color.blue)
                        .clipShape(Circle())
                }

                if copied {
                    Text(LocalizedStringKey("copied"))
                        .font(.footnote)
                        .foregroundColor(Color.green)
                        .transition(.opacity)
                }
            }

        }
        .padding(20)
        .frame(maxWidth: .infinity)
        .background(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(isDarkModeActive ? Color(.sRGB, white: 0.18, opacity: 1) : Color(.systemBlue).opacity(0.12))
                .overlay(
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .stroke(isDarkModeActive ? Color(.sRGB, white: 0.28, opacity: 1) : Color(.systemBlue), lineWidth: 1.5)
                )
        )
        .animation(.easeInOut, value: copied)
    }

    private func calculate() {
        result = logic.computeVolume(stopAmount: stopAmount, percent: percent)
        if percent.isEmpty {
            result = nil
        }
    }

    private func sanitizeNumeric(_ value: String) -> String {
        value.filter { "0123456789.,".contains($0) }
    }

    private func enforcePercentLimit(_ newValue: String) {
        guard !newValue.isEmpty else { return }
        if newValue.contains(".") || newValue.contains(",") {
            percent = newValue
        } else if newValue.count <= 4 {
            percent = newValue
        } else {
            percent = String(newValue.prefix(4))
        }
    }

    private func clearPercent() {
        percent = ""
        result = nil
    }

    private func copyResult() {
        guard let result else { return }
        #if canImport(UIKit)
        UIPasteboard.general.string = String(format: "%.1f", result)
        #endif
        copied = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            copied = false
        }
    }

    private func toggleLanguage() {
        withAnimation {
            appLanguage = appLanguage == "ru" ? "en" : "ru"
        }
    }

    private var isDarkModeActive: Bool {
        if let override = themeOverride {
            return override == "dark"
        }
        return systemColorScheme == .dark
    }

    private var preferredColorScheme: ColorScheme? {
        if let override = themeOverride {
            return override == "dark" ? .dark : .light
        }
        return nil // follow system
    }

    private func toggleTheme() {
        themeOverride = isDarkModeActive ? "light" : "dark"
    }

    private func openAppStore() {
        guard let url = updateURL else { return }
        #if canImport(UIKit)
        UIApplication.shared.open(url, options: [:], completionHandler: nil)
        #endif
    }

    private func performVersionCheck() async {
        await withCheckedContinuation { continuation in
            versionChecker.checkVersion { status in
                switch status {
                case .upToDate:
                    updateRequired = false
                case .outdated(let required, let link):
                    requiredVersion = required
                    updateURL = link
                    updateRequired = true
                case .unavailable:
                    updateRequired = false
                }
                continuation.resume()
            }
        }
    }

    private var forceUpdateOverlay: some View {
        VStack(spacing: 16) {
            Text(LocalizedStringKey("update_required_title"))
                .font(.title3.bold())
                .multilineTextAlignment(.center)
            Text(LocalizedStringKey("update_required_message"))
                .multilineTextAlignment(.center)
                .foregroundColor(isDarkModeActive ? Color.gray.opacity(0.7) : Color.gray)
            if let requiredVersion {
                Text("\(NSLocalizedString("update_required_version", comment: "")) \(requiredVersion)")
                    .font(.footnote)
                    .foregroundColor(isDarkModeActive ? Color.gray.opacity(0.7) : Color.gray)
            }
            Button(action: openAppStore) {
                Text(LocalizedStringKey("update_now"))
                    .font(.headline)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 12)
                    .frame(maxWidth: .infinity)
                    .background(Color(.systemBlue))
                    .foregroundStyle(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            }
        }
        .padding(24)
        .frame(maxWidth: 360)
        .background(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(isDarkModeActive ? Color(.sRGB, white: 0.12, opacity: 1) : Color(white: 0.98))
                .shadow(color: .black.opacity(0.2), radius: 20, x: 0, y: 10)
        )
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.black.opacity(0.45).ignoresSafeArea())
        .allowsHitTesting(true)
    }

    private var helpSheet: some View {
        NavigationView {
            ScrollView {
                helpContentBody
                    .padding()
            }
            .navigationTitle(LocalizedStringKey("help_nav_title"))
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(LocalizedStringKey("close")) {
                        showHelp = false
                    }
                }
            }
            .sheet(isPresented: $showDonate) {
                DonateView()
            }
        }
    }

#if os(macOS) || targetEnvironment(macCatalyst)
    private var macOverlays: some View {
        ZStack {
            if showHelp || showDonate {
                Color.black.opacity(0.45).ignoresSafeArea()
            }

            if showHelp {
                macHelpOverlay
                    .frame(maxWidth: 780, maxHeight: 780)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
            }

            if showDonate {
                macDonateOverlay
                    .frame(maxWidth: 720, maxHeight: 720)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
            }
        }
    }

    private var macHelpOverlay: some View {
        VStack(spacing: 0) {
            HStack {
                Text(LocalizedStringKey("help_nav_title"))
                    .font(.title3.bold())
                Spacer()
                Button(LocalizedStringKey("close")) {
                    showHelp = false
                }
            }
            .padding([.top, .horizontal], 16)

            ScrollView {
                helpContentBody
                    .padding(16)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        }
        .frame(maxWidth: min(680, NSScreen.main?.visibleFrame.width ?? 700 - 40),
               maxHeight: min(720, NSScreen.main?.visibleFrame.height ?? 760 - 80))
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(Color(NSColor.windowBackgroundColor))
                .shadow(color: .black.opacity(0.2), radius: 16, x: 0, y: 8)
        )
        .padding()
    }

    private var macDonateOverlay: some View {
        VStack(spacing: 16) {
            HStack {
                Text(LocalizedStringKey("donate_title"))
                    .font(.title3.bold())
                Spacer()
                Button(LocalizedStringKey("close")) {
                    showDonate = false
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 16)

            DonateViewContent(copied: $copied)
                .padding(.horizontal, 16)
                .padding(.bottom, 16)
        }
        .frame(maxWidth: min(600, NSScreen.main?.visibleFrame.width ?? 640 - 40),
               maxHeight: min(560, NSScreen.main?.visibleFrame.height ?? 640 - 80))
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(Color(NSColor.windowBackgroundColor))
                .shadow(color: .black.opacity(0.2), radius: 16, x: 0, y: 8)
        )
        .padding()
    }
#endif

    private var helpContentBody: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(LocalizedStringKey("help_title"))
                .font(.title2.bold())
                .multilineTextAlignment(.leading)
                .fixedSize(horizontal: false, vertical: true)

            Text(LocalizedStringKey("help_stop_title"))
                .font(.headline)
            Text(LocalizedStringKey("help_stop_text"))
                .font(.subheadline)
                .foregroundColor(.secondary)

            Text(LocalizedStringKey("help_percent_title"))
                .font(.headline)
                .padding(.top, 8)
            Text(LocalizedStringKey("help_percent_text"))
                .font(.subheadline)
                .foregroundColor(.secondary)

            Text(LocalizedStringKey("help_tv_title"))
                .font(.headline)
                .padding(.top, 8)
            Text(LocalizedStringKey("help_tv_text"))
                .font(.subheadline)
                .foregroundColor(.secondary)

            Text(LocalizedStringKey("help_bybit_title"))
                .font(.headline)
                .padding(.top, 8)
            Text(LocalizedStringKey("help_bybit_text"))
                .font(.subheadline)
                .foregroundColor(.secondary)

            Divider().padding(.vertical, 8)

            Image("helpScreenshot")
                .resizable()
                .scaledToFit()
                .cornerRadius(12)
                .shadow(color: .black.opacity(0.12), radius: 6, x: 0, y: 4)
                .padding(.vertical, 4)

            Button(action: { showDonate = true }) {
                Text(LocalizedStringKey("donate_button"))
                    .font(.headline)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                    .frame(maxWidth: .infinity)
                    .background(Color.blue.opacity(0.15))
                    .foregroundColor(Color.blue)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            }
            .padding(.top, 8)

            HStack(spacing: 4) {
                Text(LocalizedStringKey("app_version_label"))
                Text(appVersion)
            }
            .font(.footnote)
            .foregroundColor(.secondary)
            .frame(maxWidth: .infinity, alignment: .center)
            .padding(.top, 8)
        }
    }
}

private extension ContentView {
    var appVersion: String {
        let version = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "0.0.0"
        let build = Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? ""
        return build.isEmpty ? version : "\(version) (\(build))"
    }

    var helpButton: some View {
        Button(action: { showHelp = true }) {
            Image(systemName: "questionmark.circle.fill")
                .font(.system(size: 26, weight: .semibold))
                .foregroundColor(Color.blue)
                .padding(14)
                .background(.thinMaterial)
                .clipShape(Circle())
                .shadow(color: .black.opacity(0.15), radius: 8, x: 0, y: 4)
        }
        .padding(.trailing, 20)
        .padding(.bottom, 24)
    }
}

struct DonateView: View {
    @Environment(\.presentationMode) private var presentationMode
    @State private var copied: Bool = false
    private let walletAddress = "TQYNfMQerVw9TxJKF9dT3ABAoXSAszwhSp"

    var body: some View {
        NavigationView {
            DonateViewContent(copied: $copied)
                .padding()
            .navigationTitle(LocalizedStringKey("donate_title"))
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(LocalizedStringKey("close")) {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            }
        }
    }
}

struct DonateViewContent: View {
    @Binding var copied: Bool
    private let walletAddress = "TQYNfMQerVw9TxJKF9dT3ABAoXSAszwhSp"

    var body: some View {
        VStack(spacing: 16) {
            Image("QRcode")
                .resizable()
                .scaledToFit()
                .frame(maxWidth: 260)
                .cornerRadius(16)
                .shadow(color: .black.opacity(0.15), radius: 8, x: 0, y: 4)

            Text(LocalizedStringKey("donate_message"))
                .font(.body)
                .multilineTextAlignment(.center)
                .foregroundColor(.secondary)
                .padding(.horizontal)

            VStack(alignment: .leading, spacing: 8) {
                Text(LocalizedStringKey("donate_wallet_label"))
                    .font(.subheadline)
                    .foregroundColor(.secondary)

                HStack(spacing: 12) {
                    Text(walletAddress)
                        .font(.system(.body, design: .monospaced))
                        .lineLimit(1)
                        .minimumScaleFactor(0.6)
                    Spacer()
                    Button(action: copyWallet) {
                        Image(systemName: "doc.on.doc")
                            .font(.system(size: 18, weight: .semibold))
                    }
                    .accessibilityLabel(LocalizedStringKey("donate_copy"))
                }
                .padding(12)
                .background(Color.gray.opacity(0.12))
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))

                if copied {
                    Text(LocalizedStringKey("donate_copied"))
                        .font(.footnote)
                        .foregroundColor(.green)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private func copyWallet() {
        #if canImport(UIKit)
        UIPasteboard.general.string = walletAddress
        #elseif os(macOS)
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(walletAddress, forType: .string)
        #endif
        copied = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            copied = false
        }
    }
}

private enum Field {
    case stop, percent
}

#Preview {
    ContentView()
}


