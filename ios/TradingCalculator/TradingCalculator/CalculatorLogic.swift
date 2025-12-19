import Foundation

struct CalculatorLogic {
    func computeVolume(stopAmount: String, percent: String) -> Double? {
        let stopAmountNum = Double(stopAmount.replacingOccurrences(of: ",", with: ".")) ?? Double(stopAmount)
        guard let stopValue = stopAmountNum else { return nil }

        guard let divisorString = makeDivisorString(from: percent),
              let divisor = Double(divisorString),
              divisor != 0 else { return nil }

        let volume = stopValue / divisor
        return Double((volume * 10).rounded() / 10) // 1 знак после запятой
    }

    private func makeDivisorString(from percent: String) -> String? {
        let trimmed = percent.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return nil }

        if trimmed.contains(".") || trimmed.contains(",") {
            let normalized = trimmed.replacingOccurrences(of: ",", with: ".")
            let digits = normalized.replacingOccurrences(of: ".", with: "")
            return "0." + digits
        }

        switch trimmed.count {
        case 1:
            return "0.000" + trimmed
        case 2:
            return "0.00" + trimmed
        case 3:
            return "0.0" + trimmed
        case 4:
            return "0." + trimmed
        default:
            return nil
        }
    }
}








