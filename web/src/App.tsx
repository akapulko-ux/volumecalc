import {
  Calculator as CalculatorIcon,
  Copy,
  HelpCircle,
  Heart,
  Moon,
  Sun,
  X,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { computeVolume, enforcePercentLimit, sanitizeNumeric } from "@/lib/calculator"
import { checkVersion } from "@/lib/firebase"
import { messages, type Locale } from "@/lib/i18n/messages"
import { cn } from "@/lib/utils"

type ThemeOverride = "light" | "dark" | null

const DONATE_WALLET = "TQYNfMQerVw9TxJKF9dT3ABAoXSAszwhSp"
const DONATE_CHAT = "https://t.me/+n9T7BbQkG3FiMTA6"

function App() {
  const [stopAmount, setStopAmount] = useState("")
  const [percent, setPercent] = useState("")
  const [result, setResult] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const [language, setLanguage] = useState<Locale>(() => {
    const stored = window.localStorage.getItem("appLanguage")
    return stored === "en" || stored === "ru" ? stored : "ru"
  })
  const [themeOverride, setThemeOverride] = useState<ThemeOverride>(() => {
    const stored = window.localStorage.getItem("themeOverride")
    return stored === "light" || stored === "dark" ? stored : null
  })
  const [systemPrefersDark, setSystemPrefersDark] = useState(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches,
  )
  const [updateRequired, setUpdateRequired] = useState(false)
  const [requiredVersion, setRequiredVersion] = useState<string | undefined>()
  const [updateLink, setUpdateLink] = useState<string | undefined>()
  const [showHelp, setShowHelp] = useState(false)
  const [showDonate, setShowDonate] = useState(false)

  const locale = useMemo(() => messages[language], [language])

  const isDarkMode = themeOverride
    ? themeOverride === "dark"
    : systemPrefersDark

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const listener = (event: MediaQueryListEvent) => setSystemPrefersDark(event.matches)
    media.addEventListener("change", listener)
    return () => media.removeEventListener("change", listener)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle("dark", isDarkMode)
    if (themeOverride) {
      window.localStorage.setItem("themeOverride", themeOverride)
    } else {
      window.localStorage.removeItem("themeOverride")
    }
  }, [isDarkMode, themeOverride])

  useEffect(() => {
    window.localStorage.setItem("appLanguage", language)
  }, [language])

  useEffect(() => {
    if (!percent.trim()) {
      setResult(null)
      return
    }
    setResult(computeVolume(stopAmount, percent))
  }, [stopAmount, percent])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const status = await checkVersion()
      if (cancelled) return
      if (status.state === "outdated") {
        setRequiredVersion(status.requiredVersion)
        setUpdateLink(status.link)
        setUpdateRequired(true)
      } else {
        setUpdateRequired(false)
      }
    }
    run()
    const handler = () => {
      if (!document.hidden) {
        run()
      }
    }
    document.addEventListener("visibilitychange", handler)
    return () => {
      cancelled = true
      document.removeEventListener("visibilitychange", handler)
    }
  }, [])

  const gradientClass = isDarkMode
    ? "from-[#1b1e24] via-[#16181f] to-[#101118]"
    : "from-[#eaf3ff] via-[#e2edff] to-[#d6e8ff]"

  const handleStopChange = (value: string) => {
    const cleaned = sanitizeNumeric(value)
    setStopAmount(cleaned)
  }

  const handlePercentChange = (value: string) => {
    const cleaned = sanitizeNumeric(value)
    const limited = enforcePercentLimit(cleaned)
    setPercent(limited)
  }

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "ru" ? "en" : "ru"))
  }

  const toggleTheme = () => {
    setThemeOverride(isDarkMode ? "light" : "dark")
  }

  const clearPercent = () => {
    setPercent("")
    setResult(null)
  }

  const copyResult = async () => {
    if (result === null) return
    try {
      await navigator.clipboard.writeText(result.toFixed(1))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("clipboard copy failed", error)
    }
  }

  const openUpdate = () => {
    if (updateLink) {
      window.open(updateLink, "_blank", "noopener,noreferrer")
    }
  }

  const appVersion = import.meta.env.VITE_APP_VERSION ?? "1.0.0"

  return (
    <div
      className={cn(
        "min-h-screen w-full bg-gradient-to-br",
        gradientClass,
      )}
    >
      <div className="mx-auto max-w-6xl px-4 pt-4 pb-10 lg:pt-6 lg:pb-12">
        <div className="flex items-start justify-between gap-4">
          <HeaderCard
            locale={locale}
            language={language}
            isDarkMode={isDarkMode}
            onToggleLanguage={toggleLanguage}
            onToggleTheme={toggleTheme}
            onOpenHelp={() => setShowHelp(true)}
          />
        </div>

        <div className="mt-6 grid gap-4 rounded-3xl bg-white/70 p-1 shadow-card backdrop-blur md:p-2 dark:bg-black/30">
          <Card className="border-none bg-transparent shadow-none">
            <CardContent className="p-4 sm:p-6">
              <div className="grid gap-4 md:grid-cols-2 md:gap-6">
                <InputCard
                  title={locale.stop_amount}
                  help={locale.stop_amount_help}
                  value={stopAmount}
                  onChange={handleStopChange}
                  placeholder={locale.placeholder_amount}
                  tone="primary"
                  autoFocus
                />
                <InputCard
                  title={locale.percent}
                  help={locale.percent_help}
                  value={percent}
                  onChange={handlePercentChange}
                  placeholder={locale.placeholder_amount}
                  tone="secondary"
                  onClear={percent ? clearPercent : undefined}
                />
              </div>
              {result !== null && (
                <ResultCard
                  locale={locale}
                  value={result}
                  copied={copied}
                  onCopy={copyResult}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showHelp} onOpenChange={(open) => setShowHelp(open)}>
        <DialogContent className="max-h-[90vh] max-w-3xl bg-card">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {locale.help_nav_title}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-2">
            <HelpContent locale={locale} appVersion={appVersion} />
          </ScrollArea>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              className="gap-2"
              onClick={() => setShowDonate(true)}
            >
              <Heart className="h-4 w-4" />
              {locale.donate_button}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDonate} onOpenChange={(open) => setShowDonate(open)}>
        <DialogContent className="max-w-2xl bg-card sm:max-h-[90vh] sm:pb-2">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {locale.donate_title}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-2">
            <div className="grid gap-4 pb-2 sm:pb-4">
              <img
                src="/QRcode.png"
                alt="Donate QR"
                className="w-full max-w-xs self-center rounded-2xl shadow-card"
              />
              <p className="text-sm text-muted-foreground">{locale.donate_message}</p>
              <div className="space-y-2 rounded-xl border border-border bg-muted/40 p-4">
                <Label className="text-xs uppercase text-muted-foreground">
                  {locale.donate_wallet_label}
                </Label>
                <div className="flex flex-wrap items-center gap-2 text-sm font-mono">
                  <span className="truncate">{DONATE_WALLET}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-auto"
                    onClick={async () => {
                      await navigator.clipboard.writeText(DONATE_WALLET)
                      setCopied(true)
                      window.setTimeout(() => setCopied(false), 2000)
                    }}
                  >
                    {locale.donate_copy}
                  </Button>
                </div>
                {copied && (
                  <p className="text-xs font-medium text-green-600">
                    {locale.donate_copied}
                  </p>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{locale.donate_chat_note}</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <a
                    href={DONATE_CHAT}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {locale.donate_chat_link}
                  </a>
                </Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {updateRequired && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="space-y-3 text-center">
              <h3 className="text-lg font-semibold">{locale.update_required_title}</h3>
              <p className="text-sm text-muted-foreground">
                {locale.update_required_message}
              </p>
              {requiredVersion && (
                <p className="text-xs text-muted-foreground">
                  {locale.update_required_version} {requiredVersion}
                </p>
              )}
              <Button className="w-full" onClick={openUpdate}>
                {locale.update_now}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

type InputCardProps = {
  title: string
  help: string
  value: string
  placeholder: string
  tone: "primary" | "secondary"
  onChange: (value: string) => void
  onClear?: () => void
  autoFocus?: boolean
}

function InputCard({
  title,
  help,
  value,
  placeholder,
  tone,
  onChange,
  onClear,
  autoFocus,
}: InputCardProps) {
  const toneClasses =
    tone === "primary"
      ? "bg-blue-50/70 border-blue-200 text-blue-900 dark:bg-blue-500/10 dark:border-blue-500/40"
      : "bg-emerald-50/70 border-emerald-200 text-emerald-900 dark:bg-emerald-500/10 dark:border-emerald-500/40"

  return (
    <div className="space-y-3">
      <Label className="block text-lg font-semibold leading-tight text-foreground">
        {title}
      </Label>
      <div className={cn("relative rounded-2xl border p-4 shadow-sm", toneClasses)}>
        <Input
          value={value}
          inputMode="decimal"
          placeholder={placeholder}
          className="h-16 border-none bg-transparent text-center text-3xl font-bold shadow-none outline-none focus-visible:ring-0 dark:placeholder:text-gray-500"
          onChange={(event) => onChange(event.target.value)}
          onWheel={(event) => event.currentTarget.blur()}
          autoFocus={autoFocus}
        />
        {onClear && value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-white/60 text-muted-foreground hover:bg-white dark:bg-white/10"
            onClick={onClear}
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>
      <p className="text-center text-sm text-muted-foreground">{help}</p>
    </div>
  )
}

type ResultCardProps = {
  locale: (typeof messages)["ru"]
  value: number
  copied: boolean
  onCopy: () => void
}

function ResultCard({ locale, value, copied, onCopy }: ResultCardProps) {
  return (
    <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50/80 p-6 text-center shadow-sm dark:border-blue-500/50 dark:bg-blue-500/10">
      <p className="text-sm font-medium text-muted-foreground">{locale.result}</p>
      <div className="mt-3 flex items-center justify-center gap-3">
        <span className="text-4xl font-bold text-blue-600 dark:text-blue-300">
          {value.toFixed(1)}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "h-10 w-10 rounded-full",
            copied
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200"
              : "bg-white/70 text-blue-600 hover:bg-white dark:bg-white/5 dark:text-blue-200",
          )}
          onClick={onCopy}
        >
          <Copy className="h-5 w-5" />
        </Button>
        {copied && (
          <span className="text-sm font-medium text-emerald-600 dark:text-emerald-300">
            {locale.copied}
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{locale.result_formula}</p>
    </div>
  )
}

type HeaderCardProps = {
  locale: (typeof messages)["ru"]
  language: Locale
  isDarkMode: boolean
  onToggleLanguage: () => void
  onToggleTheme: () => void
  onOpenHelp: () => void
}

function HeaderCard({
  locale,
  language,
  isDarkMode,
  onToggleLanguage,
  onToggleTheme,
  onOpenHelp,
}: HeaderCardProps) {
  return (
    <Card className="flex-1 border-none bg-white/80 shadow-card backdrop-blur dark:bg-white/5">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="flex items-center gap-3 text-2xl font-semibold text-foreground">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">
            <CalculatorIcon className="h-5 w-5" />
          </span>
          {locale.volume_title}
        </CardTitle>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            className="min-w-[52px] rounded-full border border-border bg-muted/60 text-sm font-semibold uppercase dark:bg-white/10"
            onClick={onToggleLanguage}
            aria-label={locale.language_button}
          >
            {language}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 rounded-full border border-border bg-muted/60 text-foreground hover:bg-muted dark:bg-white/10"
            onClick={onToggleTheme}
            aria-label={isDarkMode ? locale.theme_light : locale.theme_dark}
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5 text-amber-400" />
            ) : (
              <Moon className="h-5 w-5 text-slate-600" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 rounded-full border border-border bg-muted/60 text-foreground hover:bg-muted dark:bg-white/10"
            onClick={onOpenHelp}
            aria-label={locale.help_nav_title}
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
    </Card>
  )
}

type HelpContentProps = {
  locale: (typeof messages)["ru"]
  appVersion: string
}

function HelpContent({ locale, appVersion }: HelpContentProps) {
  return (
    <div className="space-y-3 text-left leading-relaxed text-foreground">
      <h3 className="text-lg font-semibold">{locale.help_title}</h3>
      <Section title={locale.help_stop_title} text={locale.help_stop_text} />
      <Section title={locale.help_percent_title} text={locale.help_percent_text} />
      <Section title={locale.help_tv_title} text={locale.help_tv_text} />
      <Section title={locale.help_bybit_title} text={locale.help_bybit_text} />
      <div className="py-2">
        <img
          src="/helpScreenshot.png"
          alt="Help screenshot"
          className="w-full rounded-2xl shadow-card"
        />
      </div>
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <span>{locale.app_version_label}</span>
        <span>{appVersion}</span>
      </div>
    </div>
  )
}

function Section({ title, text }: { title: string; text: string }) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  )
}

export default App
