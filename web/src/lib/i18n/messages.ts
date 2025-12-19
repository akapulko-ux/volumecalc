export type Locale = "ru" | "en"

export type Messages = typeof messages

export const messages = {
  ru: {
    volume_title: "Объем сделки",
    stop_amount: "Сумма стопа",
    stop_amount_help: "Фиксированное значение стопа для расчетов ($)",
    percent: "Процент",
    percent_help: "Процент для расчета объема сделки (% стопа)",
    result: "Объем сделки",
    result_formula: "Формула: Сумма стопа / 0.0n%",
    placeholder_amount: "0.00",
    copied: "Скопировано",
    copy: "Копировать",
    theme_light: "Переключить на светлую тему",
    theme_dark: "Переключить на темную тему",
    language_button: "Сменить язык",
    update_required_title: "Обновление обязательно",
    update_required_message:
      "Для продолжения нужна новая версия приложения. Пожалуйста, обновите.",
    update_required_version: "Минимальная версия:",
    update_now: "Обновить",
    help_title: "Как пользоваться калькулятором",
    help_stop_title: "Поле \"Сумма стопа\"",
    help_stop_text:
      "Введите в $ желаемую сумму стоп-лосса, которую готовы потерять по правилам риск-менеджмента.",
    help_percent_title: "Поле \"Процент\"",
    help_percent_text:
      "Введите процент стопа из вашей длинной/короткой позиции. Только цифры, без ведущих нулей и без запятых.",
    help_tv_title: "Если используете TradingView",
    help_tv_text:
      "Не учитывайте и не вписывайте последнюю цифру процента, показанную TradingView.",
    help_bybit_title: "Если используете Bybit",
    help_bybit_text:
      "Вводите все цифры процента полностью, включая последнюю.",
    close: "Закрыть",
    help_nav_title: "Помощь",
    app_version_label: "Версия:",
    donate_button: "Помочь проекту",
    donate_title: "Помощь проекту",
    donate_message:
      "Помогите нам развиваться и делать новые удобные продукты. Отсканируйте QR-код для доната.",
    donate_wallet_label: "Адрес кошелька",
    donate_copy: "Скопировать",
    donate_copied: "Скопировано!",
    donate_chat_note:
      "Для предложений или замечаний — переходите в телеграм-чат поддержки:",
    donate_chat_link: "Открыть чат в Telegram",
    donate_chat: "Открыть чат",
  },
  en: {
    volume_title: "Trade Volume",
    stop_amount: "Stop amount",
    stop_amount_help: "Fixed stop value for calculations ($)",
    percent: "Percent",
    percent_help: "Percent to compute position size (% of stop)",
    result: "Position size",
    result_formula: "Formula: Stop amount / 0.0n%",
    placeholder_amount: "0.00",
    copied: "Copied",
    copy: "Copy",
    theme_light: "Switch to light theme",
    theme_dark: "Switch to dark theme",
    language_button: "Change language",
    update_required_title: "Update required",
    update_required_message:
      "A newer version is required to continue. Please update the app.",
    update_required_version: "Minimum version:",
    update_now: "Update",
    help_title: "How to use the calculator",
    help_stop_title: '"Stop amount" field',
    help_stop_text:
      "Enter your desired stop-loss amount in $ that you are ready to risk according to your risk management rules.",
    help_percent_title: '"Percent" field',
    help_percent_text:
      "Enter the stop percent from your Long/Short setup. Only digits, no leading zeros or commas.",
    help_tv_title: "If using TradingView",
    help_tv_text: "Do not include the last digit of the percent shown by TradingView.",
    help_bybit_title: "If using Bybit",
    help_bybit_text: "Enter all percent digits exactly as shown, including the last one.",
    close: "Close",
    help_nav_title: "Help",
    app_version_label: "Version:",
    donate_button: "Support the project",
    donate_title: "Support the project",
    donate_message:
      "Help us grow and build new convenient tools. Scan the QR code to donate.",
    donate_wallet_label: "Wallet address",
    donate_copy: "Copy",
    donate_copied: "Copied!",
    donate_chat_note:
      "For suggestions or feedback, join the Telegram support chat:",
    donate_chat_link: "Open Telegram chat",
    donate_chat: "Open chat",
  },
}



