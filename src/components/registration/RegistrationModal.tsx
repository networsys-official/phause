"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import Link from "next/link";

import {
  ArrowRight,
  AtSign,
  Building2,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  Globe2,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
  UserRound,
  X,
  RefreshCw,
} from "lucide-react";

import {
  createOrganization,
  verifyEmail,
  resendVerificationCode,
} from "@/services/organization.service";

import { login } from "@/services/auth.service";
import { storeToken } from "@/lib/auth";
import { registrationStore } from "@/store/registration.store";

const regions = [
  "North America",
  "South America",
  "Europe",
  "Asia Pacific",
  "Middle East",
  "Africa",
  "Other",
];

const DASHBOARD_URL =
  "https://phause-sumit.vercel.app/auth/sso";

const RESEND_DELAY = 60;

type Props = {
  open: boolean;
  onClose: () => void;
};

const initialForm = {
  fullName: "",
  organisationName: "",
  email: "",
  password: "",
  region: "",
  termsAccepted: false,
};

type FormState = typeof initialForm;
type Field = keyof FormState;
type Errors = Partial<Record<Field, string>>;

type ModalStatus =
  | "idle"
  | "submitting"
  | "otp"
  | "verifying"
  | "resending"
  | "success";

function extractAuthToken(value: unknown): string | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;

  const token =
    record.token ??
    record.accessToken ??
    record.access_token ??
    record.jwt ??
    record.bearerToken;

  if (typeof token === "string" && token.trim()) {
    return token;
  }

  for (const key of [
    "data",
    "result",
    "user",
    "auth",
    "session",
    "tokens",
  ]) {
    const nestedToken = extractAuthToken(record[key]);

    if (nestedToken) {
      return nestedToken;
    }
  }

  return null;
}

function extractRefreshToken(value: unknown): string | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;

  const token =
    record.refreshToken ??
    record.refresh_token;

  if (typeof token === "string" && token.trim()) {
    return token;
  }

  for (const key of [
    "data",
    "result",
    "auth",
    "session",
    "tokens",
  ]) {
    const nestedToken = extractRefreshToken(record[key]);

    if (nestedToken) {
      return nestedToken;
    }
  }

  return null;
}

function formatCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
}

export default function RegistrationModal({
  open,
  onClose,
}: Props) {
  const reduceMotion = useReducedMotion();

  const dialogRef = useRef<HTMLDivElement>(null);
  const submittingRef = useRef(false);
  const countdownIntervalRef = useRef<ReturnType<
    typeof setInterval
  > | null>(null);

  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Errors>({});

  const [showPassword, setShowPassword] = useState(false);

  const [status, setStatus] = useState<ModalStatus>("idle");

  const [otp, setOtp] = useState("");
  const [serverError, setServerError] = useState("");

  const [resendSeconds, setResendSeconds] = useState(0);
  const [resendExpiry, setResendExpiry] = useState<number | null>(
    null
  );

  const isBusy =
    status === "submitting" ||
    status === "verifying" ||
    status === "resending";

  // --------------------------------------------------
  // Countdown management
  // --------------------------------------------------

  const clearCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const startCountdown = useCallback(() => {
    clearCountdown();

    const expiry = Date.now() + RESEND_DELAY * 1000;

    setResendExpiry(expiry);
    setResendSeconds(RESEND_DELAY);
  }, [clearCountdown]);

  useEffect(() => {
    if (!open || !resendExpiry || status !== "otp") {
      clearCountdown();
      return;
    }

    const updateCountdown = () => {
      const remaining = Math.max(
        0,
        Math.ceil((resendExpiry - Date.now()) / 1000)
      );

      setResendSeconds(remaining);

      if (remaining <= 0) {
        clearCountdown();
      }
    };

    updateCountdown();

    countdownIntervalRef.current = setInterval(
      updateCountdown,
      1000
    );

    return clearCountdown;
  }, [
    open,
    resendExpiry,
    status,
    clearCountdown,
  ]);

  // --------------------------------------------------
  // Modal lifecycle
  // --------------------------------------------------

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submittingRef.current) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    const timer = window.setTimeout(() => {
      dialogRef.current
        ?.querySelector<HTMLInputElement>("input")
        ?.focus();
    }, 180);

    return () => {
      document.body.style.overflow = previousOverflow;

      window.removeEventListener("keydown", handleKeyDown);

      window.clearTimeout(timer);
    };
  }, [open, onClose]);

  useEffect(() => {
    return () => clearCountdown();
  }, [clearCountdown]);

  // --------------------------------------------------
  // Field handling
  // --------------------------------------------------

  const updateField = <K extends Field>(
    field: K,
    value: FormState[K]
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  };

  // --------------------------------------------------
  // Form validation
  // --------------------------------------------------

  const validate = () => {
    const nextErrors: Errors = {};

    if (form.fullName.trim().length < 2) {
      nextErrors.fullName = "Enter your full name.";
    }

    if (!form.organisationName.trim()) {
      nextErrors.organisationName =
        "Enter your organisation name.";
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    ) {
      nextErrors.email = "Enter a valid work email.";
    }

    const validPassword =
      form.password.length >= 8 &&
      /[A-Z]/.test(form.password) &&
      /[a-z]/.test(form.password) &&
      /[0-9]/.test(form.password) &&
      /[^A-Za-z0-9]/.test(form.password);

    if (!validPassword) {
      nextErrors.password =
        "Use 8+ characters with upper, lower, number and symbol.";
    }

    if (!form.region) {
      nextErrors.region = "Select your region.";
    }

    if (!form.termsAccepted) {
      nextErrors.termsAccepted =
        "Please accept the terms to continue.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  // --------------------------------------------------
  // Registration
  // --------------------------------------------------

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!validate() || submittingRef.current) {
      return;
    }

    submittingRef.current = true;

    setStatus("submitting");
    setServerError("");

    try {
      const regionCodes: Record<string, string> = {
        "North America": "US",
        "South America": "BR",
        Europe: "DE",
        "Asia Pacific": "IN",
        "Middle East": "AE",
        Africa: "ZA",
        Other: "XX",
      };

      await createOrganization({
        fullName: form.fullName.trim(),
        organizationName: form.organisationName.trim(),
        email: form.email.trim(),
        password: form.password,
        region: regionCodes[form.region] ?? "XX",
        termsAccepted: form.termsAccepted,
      });

      registrationStore.save({
        fullName: form.fullName.trim(),
        organisationName: form.organisationName.trim(),
        email: form.email.trim(),
        region: form.region,
      });

      setOtp("");
      startCountdown();

      setStatus("otp");
    } catch (error) {
      setStatus("idle");

      setServerError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      submittingRef.current = false;
    }
  };

  // --------------------------------------------------
  // Resend OTP
  // --------------------------------------------------

const handleResendOtp = async () => {
  if (
    submittingRef.current ||
    resendSeconds > 0 ||
    status !== "otp"
  ) {
    return;
  }

  submittingRef.current = true;
  setStatus("resending");
  setServerError("");

  try {
    await resendVerificationCode(form.email.trim());

    setOtp("");
    startCountdown();

    setStatus("otp");
  } catch (error) {
    setStatus("otp");

    setServerError(
      error instanceof Error
        ? error.message
        : "Unable to resend verification code."
    );
  } finally {
    submittingRef.current = false;
  }
};

  // --------------------------------------------------
  // Verify OTP + automatic login
  // --------------------------------------------------

  const handleVerifyOtp = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (submittingRef.current) return;

    if (!/^\d{6}$/.test(otp)) {
      setServerError(
        "Enter the 6-digit code sent to your email."
      );
      return;
    }

    submittingRef.current = true;

    setStatus("verifying");
    setServerError("");

    try {
      // Step 1: Verify email OTP.
      const verificationResult = await verifyEmail(
        form.email.trim(),
        otp
      );

      // Step 2: Use token from verification if provided.
      let token = extractAuthToken(verificationResult);

      let refreshToken = extractRefreshToken(
        verificationResult
      );

      // Step 3: If verification did not return a token,
      // authenticate using the existing login API.
      if (!token) {
        const loginResult = await login({
          email: form.email.trim(),
          password: form.password,
        });

        token = extractAuthToken(loginResult);

        refreshToken = extractRefreshToken(loginResult);

        if (!token) {
          throw new Error(
            "Your email was verified, but the login service did not return an access token."
          );
        }
      }

      // Step 4: Save authentication session.
      storeToken(token);

      // Step 5: Prepare dashboard SSO handoff.
      const dashboardUrl = new URL(DASHBOARD_URL);

      const handoff = new URLSearchParams({
        access_token: token,
      });

      if (refreshToken) {
        handoff.set("refresh_token", refreshToken);
      }

      dashboardUrl.hash = handoff.toString();

      // Step 6: Show success briefly, then redirect.
      setStatus("success");

      window.setTimeout(() => {
        registrationStore.clear();

        submittingRef.current = false;

        onClose();

        window.location.assign(dashboardUrl.toString());
      }, 900);
    } catch (error) {
      submittingRef.current = false;

      setStatus("otp");

      setServerError(
        error instanceof Error
          ? error.message
          : "Verification failed. Please try again."
      );
    }
  };

  // --------------------------------------------------
  // Password strength
  // --------------------------------------------------

  const passwordScore = [
    form.password.length >= 8,
    /[A-Z]/.test(form.password),
    /[a-z]/.test(form.password),
    /[0-9]/.test(form.password),
    /[^A-Za-z0-9]/.test(form.password),
  ].filter(Boolean).length;

  // --------------------------------------------------
  // Reusable input styles
  // --------------------------------------------------

  const inputClass = (field: Field) =>
    `h-12 w-full rounded-xl border bg-white/[0.035] px-11 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:bg-white/[0.055] focus:ring-2 focus:ring-phause-cyan/10 ${
      errors[field]
        ? "border-red-400/60"
        : "border-white/[0.09] focus:border-phause-cyan/60"
    }`;

  const renderField = (
    name: Field,
    label: string,
    placeholder: string,
    icon: React.ReactNode,
    type = "text"
  ) => (
    <div>
      <label
        htmlFor={`modal-${name}`}
        className="mb-2 block text-xs font-semibold text-slate-300"
      >
        {label} <span className="text-phause-cyan">*</span>
      </label>

      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
          {icon}
        </span>

        <input
          id={`modal-${name}`}
          name={name}
          type={type}
          value={String(form[name])}
          onChange={(event) =>
            updateField(name, event.target.value)
          }
          placeholder={placeholder}
          autoComplete={
            name === "email"
              ? "email"
              : name === "fullName"
                ? "name"
                : name === "organisationName"
                  ? "organization"
                  : "new-password"
          }
          className={inputClass(name)}
        />
      </div>

      <AnimatePresence>
        {errors[name] && (
          <motion.p
            initial={{ opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-1.5 text-xs text-red-400"
          >
            {errors[name]}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#02070c]/80 px-4 py-6 backdrop-blur-md sm:px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !submittingRef.current
            ) {
              onClose();
            }
          }}
          role="presentation"
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="registration-modal-title"
            initial={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 28, scale: 0.96 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 18, scale: 0.97 }
            }
            transition={{
              duration: reduceMotion ? 0.1 : 0.38,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative my-auto w-full max-w-[660px] overflow-hidden rounded-[26px] border border-white/[0.1] bg-[#091720]/95 shadow-[0_32px_120px_rgba(0,0,0,0.65)] backdrop-blur-2xl"
          >
            <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-phause-cyan/70 to-transparent" />

            <button
              type="button"
              onClick={onClose}
              disabled={isBusy}
              aria-label="Close registration"
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-slate-400 transition-all hover:rotate-90 hover:border-phause-cyan/30 hover:text-white disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>

            <AnimatePresence mode="wait">
              {/* SUCCESS */}
              {status === "success" ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex min-h-[520px] flex-col items-center justify-center px-8 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.1 }}
                    className="flex h-20 w-20 items-center justify-center rounded-full border border-phause-cyan/30 bg-phause-cyan/10 text-phause-cyan shadow-[0_0_50px_rgba(0,216,201,0.18)]"
                  >
                    <Check className="h-9 w-9" />
                  </motion.div>

                  <h2 className="mt-7 text-3xl font-bold">
                    Welcome to Phause!
                  </h2>

                  <p className="mt-3 max-w-sm text-sm leading-6 text-slate-400">
                    Your email has been verified. Preparing your
                    workspace...
                  </p>

                  <LoaderCircle className="mt-6 h-5 w-5 animate-spin text-phause-cyan" />
                </motion.div>
              ) : status === "otp" ||
                status === "verifying" ||
                status === "resending" ? (
                /* OTP VERIFICATION */
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex min-h-[520px] flex-col justify-center px-6 py-10 sm:px-12"
                >
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-phause-cyan/30 bg-phause-cyan/10 text-phause-cyan">
                    <ShieldCheck className="h-7 w-7" />
                  </div>

                  <h2 className="text-center text-3xl font-bold">
                    Verify your email
                  </h2>

                  <p className="mx-auto mt-3 max-w-md text-center text-sm leading-6 text-slate-400">
                    Enter the 6-digit code sent to{" "}
                    <span className="font-semibold text-white">
                      {form.email}
                    </span>
                    .
                  </p>

                  <form
                    onSubmit={handleVerifyOtp}
                    className="mx-auto mt-7 w-full max-w-sm"
                  >
                    <label
                      htmlFor="registration-otp"
                      className="mb-2 block text-center text-xs font-semibold uppercase tracking-[0.16em] text-slate-400"
                    >
                      Verification code
                    </label>

                    <input
                      id="registration-otp"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={otp}
                      disabled={status !== "otp"}
                      onChange={(event) => {
                        setOtp(
                          event.target.value
                            .replace(/\D/g, "")
                            .slice(0, 6)
                        );

                        setServerError("");
                      }}
                      className="h-16 w-full rounded-2xl border border-white/[0.12] bg-white/[0.04] text-center font-mono text-3xl tracking-[0.55em] text-white outline-none transition-all focus:border-phause-cyan/60 focus:ring-2 focus:ring-phause-cyan/10 disabled:opacity-60"
                      autoFocus
                    />

                    {/* Error message */}
                    <AnimatePresence>
                      {serverError && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          role="alert"
                          className="mt-3 text-center text-xs text-red-400"
                        >
                          {serverError}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    {/* Resend OTP */}
                    <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5 text-sm">
                      <span className="text-slate-400">
                        Didn&apos;t receive the code?
                      </span>

                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={
                          resendSeconds > 0 ||
                          status !== "otp"
                        }
                        className="inline-flex items-center gap-1.5 font-semibold text-phause-cyan transition-colors hover:text-white disabled:cursor-not-allowed disabled:text-slate-500"
                      >
                        {status === "resending" ? (
                          <>
                            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                            Sending...
                          </>
                        ) : resendSeconds > 0 ? (
                          <>
                            Resend in {formatCountdown(resendSeconds)}
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-3.5 w-3.5" />
                            Resend code
                          </>
                        )}
                      </button>
                    </div>

                    {/* Verify button */}
                    <motion.button
                      type="submit"
                      disabled={
                        status !== "otp" ||
                        otp.length !== 6
                      }
                      whileTap={{ scale: 0.985 }}
                      className="mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-phause-cyan to-phause-teal font-bold text-phause-dark disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {status === "verifying" ? (
                        <>
                          <LoaderCircle className="h-5 w-5 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          Verify email
                          <ArrowRight className="h-[18px] w-[18px]" />
                        </>
                      )}
                    </motion.button>
                  </form>
                </motion.div>
              ) : (
                /* REGISTRATION FORM */
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="max-h-[calc(100vh-3rem)] overflow-y-auto p-6 sm:p-8 md:p-9"
                >
                  <div className="mb-7 pr-10">
                    <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-phause-cyan">
                      <ShieldCheck className="h-4 w-4" />
                      Secure registration
                    </div>

                    <h2
                      id="registration-modal-title"
                      className="text-2xl font-black tracking-tight sm:text-3xl"
                    >
                      Create your account
                    </h2>

                    <p className="mt-2 text-sm text-slate-400">
                      A few details and your Phause workspace is ready.
                    </p>
                  </div>

                  <form
                    onSubmit={handleSubmit}
                    noValidate
                    className="space-y-5"
                  >
                    <div className="grid gap-5 sm:grid-cols-2">
                      {renderField(
                        "fullName",
                        "Full name",
                        "Your full name",
                        <UserRound className="h-[18px] w-[18px]" />
                      )}

                      {renderField(
                        "organisationName",
                        "Organisation",
                        "Organisation name",
                        <Building2 className="h-[18px] w-[18px]" />
                      )}
                    </div>

                    {renderField(
                      "email",
                      "Work email",
                      "you@company.com",
                      <AtSign className="h-[18px] w-[18px]" />,
                      "email"
                    )}

                    {/* Password */}
                    <div>
                      <label
                        htmlFor="modal-password"
                        className="mb-2 block text-xs font-semibold text-slate-300"
                      >
                        Password{" "}
                        <span className="text-phause-cyan">*</span>
                      </label>

                      <div className="relative">
                        <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-500" />

                        <input
                          id="modal-password"
                          type={showPassword ? "text" : "password"}
                          value={form.password}
                          onChange={(event) =>
                            updateField("password", event.target.value)
                          }
                          placeholder="Create a strong password"
                          autoComplete="new-password"
                          className={`${inputClass("password")} pr-12`}
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword((current) => !current)
                          }
                          aria-label={
                            showPassword
                              ? "Hide password"
                              : "Show password"
                          }
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-phause-cyan"
                        >
                          {showPassword ? (
                            <EyeOff className="h-[18px] w-[18px]" />
                          ) : (
                            <Eye className="h-[18px] w-[18px]" />
                          )}
                        </button>
                      </div>

                      {form.password && (
                        <div className="mt-2.5 flex gap-1.5">
                          {[0, 1, 2, 3, 4].map((segment) => (
                            <motion.span
                              key={segment}
                              animate={{
                                opacity:
                                  segment < passwordScore ? 1 : 0.18,
                              }}
                              className="h-1 flex-1 rounded-full bg-phause-cyan"
                            />
                          ))}
                        </div>
                      )}

                      {errors.password && (
                        <p className="mt-1.5 text-xs text-red-400">
                          {errors.password}
                        </p>
                      )}
                    </div>

                    {/* Region */}
                    <div>
                      <label
                        htmlFor="modal-region"
                        className="mb-2 block text-xs font-semibold text-slate-300"
                      >
                        Region{" "}
                        <span className="text-phause-cyan">*</span>
                      </label>

                      <div className="relative">
                        <Globe2 className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-500" />

                        <select
                          id="modal-region"
                          value={form.region}
                          onChange={(event) =>
                            updateField("region", event.target.value)
                          }
                          className={`${inputClass("region")} appearance-none pr-11 ${
                            !form.region ? "text-slate-500" : ""
                          }`}
                        >
                          <option
                            value=""
                            disabled
                            className="bg-[#091720]"
                          >
                            Select your region
                          </option>

                          {regions.map((region) => (
                            <option
                              key={region}
                              className="bg-[#091720]"
                            >
                              {region}
                            </option>
                          ))}
                        </select>

                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      </div>

                      {errors.region && (
                        <p className="mt-1.5 text-xs text-red-400">
                          {errors.region}
                        </p>
                      )}
                    </div>

                    {/* Terms */}
                    <label className="flex cursor-pointer items-start gap-3 pt-1">
                      <input
                        type="checkbox"
                        checked={form.termsAccepted}
                        onChange={(event) =>
                          updateField(
                            "termsAccepted",
                            event.target.checked
                          )
                        }
                        className="peer sr-only"
                      />

                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-phause-cyan/50 ${
                          form.termsAccepted
                            ? "border-phause-cyan bg-phause-cyan text-phause-dark"
                            : "border-slate-600 bg-white/[0.03]"
                        }`}
                      >
                        {form.termsAccepted && (
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                        )}
                      </span>

                      <span className="text-xs leading-5 text-slate-400">
                        I agree to the{" "}
                        <Link
                          href="/terms"
                          className="font-semibold text-phause-cyan"
                        >
                          Terms &amp; Conditions
                        </Link>{" "}
                        and{" "}
                        <Link
                          href="/privacy"
                          className="font-semibold text-phause-cyan"
                        >
                          Privacy Policy
                        </Link>
                        .
                      </span>
                    </label>

                    {errors.termsAccepted && (
                      <p className="text-xs text-red-400">
                        {errors.termsAccepted}
                      </p>
                    )}

                    {serverError && (
                      <p
                        role="alert"
                        className="rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-xs text-red-300"
                      >
                        {serverError}
                      </p>
                    )}

                    {/* Submit */}
                    <motion.button
                      type="submit"
                      disabled={status === "submitting"}
                      whileTap={{ scale: 0.985 }}
                      className="group flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-phause-cyan to-phause-teal font-bold text-phause-dark shadow-[0_12px_35px_rgba(0,216,201,0.16)] transition-shadow hover:shadow-[0_16px_45px_rgba(0,216,201,0.28)] disabled:opacity-70"
                    >
                      {status === "submitting" ? (
                        <>
                          <LoaderCircle className="h-5 w-5 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        <>
                          Create account
                          <ArrowRight className="h-[18px] w-[18px] transition-transform group-hover:translate-x-1" />
                        </>
                      )}
                    </motion.button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}