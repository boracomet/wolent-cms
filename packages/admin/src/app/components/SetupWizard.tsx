/**
 * First-run Setup Wizard — Strapi-like onboarding.
 * Shown automatically when /api/setup/status returns { required: true }.
 * Preserves the existing dark design language.
 */
import { useState } from "react";
import { Layers, Check, AlertCircle, Loader2, Eye, EyeOff, ArrowRight } from "lucide-react";

interface SetupInput {
  siteName: string;
  siteUrl: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface Props {
  onComplete: () => void;
}

type Step = "welcome" | "admin" | "done";

export function SetupWizard({ onComplete }: Props) {
  const [step, setStep] = useState<Step>("welcome");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [input, setInput] = useState<SetupInput>({
    siteName: "My Wolent CMS",
    siteUrl: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  function update(field: keyof SetupInput, value: string) {
    setInput((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }

  async function handleComplete() {
    // Validation
    if (!input.firstName.trim()) return setError("First name is required");
    if (!input.lastName.trim()) return setError("Last name is required");
    if (!input.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
      return setError("Valid email address is required");
    }
    if (input.password.length < 8) return setError("Password must be at least 8 characters");
    if (!/[A-Z]/.test(input.password)) return setError("Password must contain at least one uppercase letter");
    if (!/[0-9]/.test(input.password)) return setError("Password must contain at least one number");
    if (input.password !== input.confirmPassword) return setError("Passwords do not match");

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/setup/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteName: input.siteName,
          siteUrl: input.siteUrl || undefined,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          password: input.password,
        }),
      });

      const json = await res.json() as { data?: { ok: boolean }; error?: { message: string } };

      if (!res.ok) {
        setError(json.error?.message ?? "Setup failed. Please try again.");
        return;
      }

      setStep("done");
    } catch {
      setError("Cannot reach the server. Make sure the API is running on port 3000.");
    } finally {
      setLoading(false);
    }
  }

  const fieldClass =
    "w-full h-11 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-600/50 focus:border-zinc-600 transition-colors";

  const labelClass = "block text-sm font-medium text-zinc-300 mb-1.5";

  return (
    <div className="min-h-[100dvh] min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6 text-zinc-950" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-zinc-100">Wolent CMS</h1>
            <p className="text-xs text-zinc-500">Setup Wizard</p>
          </div>
        </div>

        {/* Step: Welcome */}
        {step === "welcome" && (
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Welcome! 👋</h2>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Let's set up your Wolent CMS instance. This will only take a minute.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelClass}>Site Name</label>
                <input
                  type="text"
                  className={fieldClass}
                  placeholder="My Awesome Site"
                  value={input.siteName}
                  onChange={(e) => update("siteName", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>
                  Site URL <span className="text-zinc-600 font-normal">(optional)</span>
                </label>
                <input
                  type="url"
                  className={fieldClass}
                  placeholder="https://example.com"
                  value={input.siteUrl}
                  onChange={(e) => update("siteUrl", e.target.value)}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep("admin")}
              className="w-full h-11 rounded-lg bg-zinc-100 text-zinc-950 text-sm font-semibold hover:bg-white transition-colors flex items-center justify-center gap-2"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step: Admin account */}
        {step === "admin" && (
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Create Admin Account</h2>
              <p className="text-zinc-400 text-sm">
                This will be your super admin account.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-3 text-sm text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>First Name</label>
                  <input
                    type="text"
                    className={fieldClass}
                    placeholder="John"
                    value={input.firstName}
                    onChange={(e) => update("firstName", e.target.value)}
                    autoFocus
                  />
                </div>
                <div>
                  <label className={labelClass}>Last Name</label>
                  <input
                    type="text"
                    className={fieldClass}
                    placeholder="Doe"
                    value={input.lastName}
                    onChange={(e) => update("lastName", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Email Address</label>
                <input
                  type="email"
                  className={fieldClass}
                  placeholder="admin@example.com"
                  value={input.email}
                  onChange={(e) => update("email", e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div>
                <label className={labelClass}>Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className={`${fieldClass} pr-11`}
                    placeholder="Min 8 chars, 1 uppercase, 1 number"
                    value={input.password}
                    onChange={(e) => update("password", e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className={labelClass}>Confirm Password</label>
                <input
                  type="password"
                  className={fieldClass}
                  placeholder="Repeat password"
                  value={input.confirmPassword}
                  onChange={(e) => update("confirmPassword", e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep("welcome")}
                className="h-11 px-5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors text-sm"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleComplete}
                disabled={loading}
                className="flex-1 h-11 rounded-lg bg-zinc-100 text-zinc-950 text-sm font-semibold hover:bg-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Setting up..." : "Complete Setup"}
              </button>
            </div>
          </div>
        )}

        {/* Step: Done */}
        {step === "done" && (
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold mb-2">You're all set! 🎉</h2>
              <p className="text-zinc-400 text-sm">
                Your Wolent CMS is ready. Log in with your admin account to get started.
              </p>
            </div>
            <button
              type="button"
              onClick={onComplete}
              className="w-full h-11 rounded-lg bg-zinc-100 text-zinc-950 text-sm font-semibold hover:bg-white transition-colors flex items-center justify-center gap-2"
            >
              Go to Login
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Progress dots */}
        {step !== "done" && (
          <div className="flex justify-center gap-2 mt-6">
            {(["welcome", "admin"] as const).map((s) => (
              <div
                key={s}
                className={`w-2 h-2 rounded-full transition-colors ${
                  step === s ? "bg-zinc-100" : "bg-zinc-700"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
