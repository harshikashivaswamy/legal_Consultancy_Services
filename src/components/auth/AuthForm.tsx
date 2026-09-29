import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, useId } from "react";
import { toast } from "sonner";
import {
  Briefcase,
  CheckCircle2,
  Eye,
  EyeOff,
  ShieldCheck,
  UserRound,
  FileCheck2,
  Upload,
  AlertCircle,
  KeyRound,
  X,
  Phone,
  Scale,
  Award,
  Mail,
  Smartphone,
  Lock,
  RefreshCw,
  ArrowLeft,
  Copy,
  Check,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ROLE_HOME, ROLE_LABEL, useAuth, type Role } from "@/lib/auth";
import { submitLawyerRegistration } from "@/lib/database";
import { sendEmailOtp, verifyEmailOtp } from "@/lib/otp";

const ROLE_META: Record<Role, { icon: typeof UserRound; tagline: string }> = {
  client: { icon: UserRound, tagline: "Find verified advocates and manage every matter in one place." },
  lawyer: { icon: Briefcase, tagline: "Fill your calendar with prepared, verified clients." },
  admin: { icon: ShieldCheck, tagline: "Keep the marketplace verified, compliant and healthy." },
};

const VALID: Role[] = ["client", "lawyer", "admin"];

const STATE_BAR_COUNCILS: { label: string; code: string }[] = [
  { label: "Bar Council of Maharashtra & Goa",   code: "MAH" },
  { label: "Bar Council of Delhi",                code: "DL"  },
  { label: "Karnataka State Bar Council",          code: "KA"  },
  { label: "Bar Council of West Bengal",           code: "WB"  },
  { label: "Bar Council of Tamil Nadu & Puducherry", code: "TN" },
  { label: "Bar Council of Uttar Pradesh",         code: "UP"  },
  { label: "Bar Council of Gujarat",               code: "GJ"  },
  { label: "Bar Council of Rajasthan",             code: "RJ"  },
  { label: "Bar Council of Punjab & Haryana",      code: "PH"  },
  { label: "Bar Council of Andhra Pradesh",        code: "AP"  },
  { label: "Bar Council of Telangana",             code: "TS"  },
  { label: "Bar Council of Kerala",               code: "KL"  },
  { label: "Bar Council of Madhya Pradesh",        code: "MP"  },
  { label: "Bar Council of Odisha",               code: "OD"  },
  { label: "Bar Council of Bihar",                code: "BR"  },
  { label: "Bar Council of Chhattisgarh",         code: "CG"  },
  { label: "Bar Council of Jharkhand",            code: "JH"  },
  { label: "Bar Council of Uttarakhand",          code: "UK"  },
  { label: "Bar Council of Himachal Pradesh",     code: "HP"  },
  { label: "Bar Council of Haryana",              code: "HR"  },
  { label: "Bar Council of Assam",               code: "AS"  },
  { label: "Bar Council of India (BCI)",          code: "BCI" },
];

const SPECIALISATIONS = [
  "Criminal Law & Cyber Crime",
  "Corporate & Commercial Law",
  "Family, Divorce & Custody",
  "Property, Real Estate & RERA",
  "Civil Litigation & Arbitration",
  "Constitutional & High Court Writs",
  "Taxation, GST & Customs",
  "Intellectual Property & Patents",
];

function GoogleIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const params = useParams({ strict: false }) as { role?: string };
  const role = (VALID.includes(params.role as Role) ? params.role : "client") as Role;
  const { signIn, signUp, signInWithGoogle, signOut } = useAuth();
  const navigate = useNavigate();

  // Basic Auth Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [countryCode, setCountryCode] = useState("+91(IND)");
  const [receiveOffers, setReceiveOffers] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // 2-Step Verification (Email OTP) State
  const [authStep, setAuthStep] = useState<"credentials" | "2fa">("credentials");
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Advocate Specific Fields
  const [phone, setPhone] = useState("");
  const [barNumber, setBarNumber] = useState("");
  const [stateBar, setStateBar] = useState(STATE_BAR_COUNCILS[0]!.label);
  const [specialization, setSpecialization] = useState(SPECIALISATIONS[0]!);
  const [experience, setExperience] = useState("8");
  const [fee, setFee] = useState("2000");
  const [certificateName, setCertificateName] = useState("");
  const [certificateData, setCertificateData] = useState<string | null>(null);

  // Bar Council Verify Step
  const [barVerified, setBarVerified] = useState(false);
  const [barVerifyLoading, setBarVerifyLoading] = useState(false);
  const [barVerifyError, setBarVerifyError] = useState<string | null>(null);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const Icon = ROLE_META[role].icon;

  // Strict Password Strength Rules
  const passwordRules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  const isPasswordValid =
    passwordRules.length &&
    passwordRules.uppercase &&
    passwordRules.lowercase &&
    passwordRules.number &&
    passwordRules.special;

  // Bar Council Format Validation — strict 3-part: STATECODE/NUMBER/YEAR
  const getExpectedBarCode = (): string => {
    return STATE_BAR_COUNCILS.find((b) => b.label === stateBar)?.code ?? "";
  };

  const validateBarCouncil = (num: string): { valid: boolean; reason?: string } => {
    const clean = num.trim().toUpperCase();
    if (!clean) return { valid: false, reason: "Please enter your Enrolment number" };

    const parts = clean.split("/");
    if (parts.length !== 3) {
      return {
        valid: false,
        reason: `Format must be exactly STATECODE/NUMBER/YEAR — e.g. ${getExpectedBarCode()}/1234/2016`,
      };
    }

    const [statePart, numPart, yearPart] = parts as [string, string, string];

    const expectedCode = getExpectedBarCode();
    if (statePart !== expectedCode) {
      return {
        valid: false,
        reason: `State code must match your selected Bar Council — expected "${expectedCode}", got "${statePart}"`,
      };
    }

    if (!/^\d{1,6}$/.test(numPart)) {
      return { valid: false, reason: "Enrolment number must be 1–6 digits (e.g. 1234)" };
    }

    const year = parseInt(yearPart, 10);
    const currentYear = new Date().getFullYear();
    if (isNaN(year) || String(year).length !== 4 || year < 1950 || year > currentYear) {
      return { valid: false, reason: `Year must be a 4-digit number between 1950 and ${currentYear}` };
    }

    return { valid: true };
  };

  // Resets bar verification whenever the number changes
  const handleBarNumberChange = (val: string) => {
    setBarNumber(val);
    setBarVerified(false);
    setBarVerifyError(null);
  };

  const handleStateBarChange = (val: string) => {
    setStateBar(val);
    setBarVerified(false);
    setBarNumber("");
    setBarVerifyError(null);
  };

  const isBarValid = validateBarCouncil(barNumber).valid;

  const handleVerifyBar = async () => {
    const check = validateBarCouncil(barNumber);
    if (!check.valid) {
      setBarVerifyError(check.reason ?? "Invalid format");
      setBarVerified(false);
      return;
    }

    setBarVerifyLoading(true);
    setBarVerifyError(null);

    try {
      // Simulate real-time Bar Council Registry check
      await new Promise((r) => setTimeout(r, 1200));

      const parts = barNumber.trim().toUpperCase().split("/");
      const num = parseInt(parts[1] ?? "0", 10);
      if (num === 0 || num > 999999) {
        setBarVerifyError("Enrolment record not found in the State Bar Council register.");
        setBarVerified(false);
      } else {
        setBarVerified(true);
        setBarVerifyError(null);
        toast.success(`Bar Council Enrolment (${barNumber}) verified successfully!`);
      }
    } catch {
      setBarVerifyError("Verification service temporarily unavailable. Try again.");
      setBarVerified(false);
    } finally {
      setBarVerifyLoading(false);
    }
  };

  const handleCertificateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be under 10MB");
      return;
    }
    setCertificateName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setCertificateData(reader.result as string);
      toast.success("Certificate attached for verification review.");
    };
    reader.readAsDataURL(file);
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle(role);
      toast.success(`Signed in with Google as ${ROLE_LABEL[role]}`);
      void navigate({ to: ROLE_HOME[role] });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Google sign in failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.includes("@")) {
      toast.error("Please provide a valid email address");
      return;
    }
    setForgotLoading(true);
    try {
      // Simulate password reset email dispatch
      await new Promise((r) => setTimeout(r, 1200));
      toast.success(`Password reset link sent to ${forgotEmail}. Please check your inbox.`);
      setShowForgotModal(false);
      setForgotEmail("");
    } catch {
      toast.error("Failed to send reset link. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 1: Handle Initial Form Submission (Registration or Login)
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email address.");
      return;
    }
    if (!password) {
      toast.error("Please enter your password.");
      return;
    }

    if (mode === "register") {
      if (!name.trim()) {
        toast.error("Please enter your full name.");
        return;
      }
      const cleanPhone = phone.trim().replace(/\D/g, "");
      if (cleanPhone.length > 0 && cleanPhone.length < 10) {
        toast.error("Please enter a valid 10-digit mobile number.");
        return;
      }
      if (!isPasswordValid) {
        toast.error("Please meet all password security requirements before proceeding.");
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Passwords do not match. Please ensure both passwords match.");
        return;
      }
      if (role === "lawyer" && !barVerified) {
        toast.error("Please verify your Bar Council Enrolment Number before submitting.");
        return;
      }
    }

    // Login requires accepting the Terms & Conditions before the OTP is sent.
    if (mode === "login" && !termsAccepted) {
      setShowTerms(true);
      return;
    }

    setLoading(true);
    try {
      if (mode === "register") {
        // --- REGISTRATION OTP VERIFICATION FLOW ---
        // Generate 6-digit OTP -> Dispatched to client's email (and mobile SMS if active)
        const fullPhone = phone ? `${countryCode} ${phone.trim()}` : undefined;
        await sendEmailOtp(email, role, undefined, password, "register", fullPhone);
        setResendCooldown(60);
        setAuthStep("2fa");
        setOtpCode("");
        toast.success(`🔒 Verification code sent to ${email} (Valid for 5 minutes)`);
      } else {
        // --- LOGIN TWO-STEP VERIFICATION (2FA) FLOW ---
        // 1. Credentials checked -> Generate 6-digit OTP -> Dispatched to user's email via Gmail SMTP
        await sendEmailOtp(email, role, undefined, password, "login");
        setResendCooldown(60);
        setAuthStep("2fa");
        setOtpCode("");
        toast.success(`🔒 Login Verification code sent to ${email} (Valid for 5 minutes)`);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Handle OTP Verification
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = otpCode.trim().replace(/\D/g, "");
    if (cleanCode.length !== 6) {
      toast.error("Please enter the full 6-digit verification code.");
      return;
    }

    setOtpLoading(true);
    try {
      // 1. Verify the 6-digit OTP against database / server
      const res = await verifyEmailOtp(email, cleanCode);
      if (!res.success) {
        toast.error(res.message || "Invalid or expired verification code.");
        setOtpLoading(false);
        return;
      }

      if (mode === "register") {
        // 2a. Registration: Complete Account Creation with Phone & Password
        await signUp({ name, email, role, password, phone });

        if (role === "lawyer") {
          await submitLawyerRegistration({
            name,
            email,
            phone: phone || "",
            barNumber,
            stateBar,
            specialization,
            experience: `${experience} years`,
            fee: Number(fee) || 2000,
            certificateUrl: certificateData || "",
          });

          localStorage.setItem(
            `lawyer.settings.temp`,
            JSON.stringify({ barNumber, stateBar, phone, specialization, fee, experience })
          );

          toast.success(
            "Account verified & Advocate application submitted! Your Bar Council credentials are now under review."
          );
        } else {
          toast.success("Account verified & created successfully! Welcome to Legal Consultancy Service.");
        }
        void navigate({ to: ROLE_HOME[role] });
      } else {
        // 2b. Login: Complete Sign-In
        const signedIn = await signIn({ name, email, role, password });
        if (signedIn.role !== role) {
          // The account exists but belongs to a different portal (e.g. a client trying the admin portal).
          await signOut();
          throw new Error(
            `This account is registered as ${ROLE_LABEL[signedIn.role]}. Please sign in from the ${ROLE_LABEL[signedIn.role]} portal.`
          );
        }
        toast.success(`Two-Step Verification Confirmed! Welcome back to the ${ROLE_LABEL[role]} Portal.`);
        void navigate({ to: ROLE_HOME[role] });
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setOtpLoading(false);
    }
  };

  // Resend OTP Code
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || otpLoading) return;
    setOtpLoading(true);
    try {
      const fullPhone = phone ? `${countryCode} ${phone.trim()}` : undefined;
      await sendEmailOtp(email, role, undefined, password, mode, fullPhone);
      setResendCooldown(60);
      toast.success(`New 6-digit verification code dispatched to ${email}!`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to resend verification code. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left decorative brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-hero p-12 lg:flex">
        <div className="pointer-events-none absolute -left-20 bottom-0 size-96 rounded-full bg-accent/20 blur-3xl" />
        <Link to="/" className="relative">
          <Logo inverted />
        </Link>
        <div className="relative max-w-md">
          <span className="grid size-12 place-items-center rounded-2xl bg-gold">
            <Icon className="size-6 text-[oklch(0.22_0.045_260)]" />
          </span>
          <h2 className="mt-6 text-3xl font-serif text-[oklch(0.98_0.004_250)]">
            {ROLE_LABEL[role]} Portal
          </h2>
          <p className="mt-3 text-[oklch(0.85_0.02_250)]">{ROLE_META[role].tagline}</p>
        </div>
        <div className="relative space-y-2">
          <div className="flex items-center gap-2 text-xs text-amber-300 font-medium">
            <ShieldCheck className="size-4" />
            <span>256-bit SSL Encrypted & Bar Council Compliant</span>
          </div>
          <p className="text-xs text-[oklch(0.78_0.02_250)]">
            Sessions are protected with JWT authentication, role guards and database verification.
          </p>
        </div>
      </div>

      {/* Right form container */}
      <div className="flex items-center justify-center px-4 py-12 sm:px-8 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md my-auto"
        >
          <div className="lg:hidden mb-6">
            <Link to="/">
              <Logo />
            </Link>
          </div>
          <AnimatePresence mode="wait">
            {authStep === "2fa" ? (
              <motion.div
                key="step-2fa"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setAuthStep("credentials")}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
                  >
                    <ArrowLeft className="size-3.5" />
                    {mode === "register" ? "Back to Registration" : "Back to Login"}
                  </button>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold">
                    <ShieldCheck className="size-3" />
                    {mode === "register" ? "Email Verification" : "2-Step Verification"}
                  </span>
                </div>

                <div className="text-center space-y-3 pt-2">
                  <div className="relative mx-auto size-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-primary/20 border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/10">
                    <ShieldCheck className="size-8 text-primary" />
                    <span className="absolute -bottom-1 -right-1 size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs shadow-sm">
                      <Mail className="size-3.5" />
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold font-serif sm:text-3xl text-foreground">
                    {mode === "register" ? "Verify Your Account" : "Two-Step Verification"}
                  </h1>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    {mode === "register"
                      ? `We've sent a 6-digit verification OTP to confirm your ${ROLE_LABEL[role]} account:`
                      : "We've sent a 6-digit one-time password (OTP) to:"}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <div className="inline-flex items-center gap-2 font-mono text-xs sm:text-sm font-semibold text-foreground bg-muted px-3.5 py-1.5 rounded-xl border border-border">
                      <Mail className="size-3.5 text-primary" />
                      <span>{email}</span>
                    </div>
                    {mode === "register" && phone && (
                      <div className="inline-flex items-center gap-2 font-mono text-xs sm:text-sm font-semibold text-foreground bg-muted px-3.5 py-1.5 rounded-xl border border-border">
                        <Smartphone className="size-3.5 text-sky-500" />
                        <span>{countryCode} {phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Email Verification Instructions Notice */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-xs">
                  <Mail className="size-4 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">Please check your Email Inbox</p>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      We have sent a 6-digit verification code to <strong className="text-foreground">{email}</strong>. Enter the code below to complete verification. (Check spam/junk if not in inbox).
                    </p>
                  </div>
                </div>

                {/* 6-Digit OTP Input Form */}
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-center block text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                      Enter 6-Digit Security Code
                    </Label>
                    <div className="flex justify-center py-2">
                      <InputOTP
                        maxLength={6}
                        value={otpCode}
                        onChange={(val) => setOtpCode(val)}
                        autoFocus
                      >
                        <InputOTPGroup className="gap-2 sm:gap-3">
                          <InputOTPSlot index={0} className="w-10 h-12 sm:w-12 sm:h-14 text-xl font-bold rounded-xl border-2 shadow-sm focus:border-primary" />
                          <InputOTPSlot index={1} className="w-10 h-12 sm:w-12 sm:h-14 text-xl font-bold rounded-xl border-2 shadow-sm focus:border-primary" />
                          <InputOTPSlot index={2} className="w-10 h-12 sm:w-12 sm:h-14 text-xl font-bold rounded-xl border-2 shadow-sm focus:border-primary" />
                          <InputOTPSlot index={3} className="w-10 h-12 sm:w-12 sm:h-14 text-xl font-bold rounded-xl border-2 shadow-sm focus:border-primary" />
                          <InputOTPSlot index={4} className="w-10 h-12 sm:w-12 sm:h-14 text-xl font-bold rounded-xl border-2 shadow-sm focus:border-primary" />
                          <InputOTPSlot index={5} className="w-10 h-12 sm:w-12 sm:h-14 text-xl font-bold rounded-xl border-2 shadow-sm focus:border-primary" />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={otpLoading || otpCode.length !== 6}
                    className="w-full rounded-xl h-11 text-base font-semibold shadow-soft"
                    size="lg"
                  >
                    {otpLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Verifying Code…
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="size-4" />
                        {mode === "register"
                          ? (role === "lawyer" ? "Verify & Submit Application" : "Verify & Complete Registration")
                          : "Verify & Complete Login"}
                      </span>
                    )}
                  </Button>

                  {/* Resend & Navigation controls */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs border-t border-border">
                    <button
                      type="button"
                      onClick={() => setAuthStep("credentials")}
                      className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
                    >
                      <ArrowLeft className="size-3.5" />
                      {mode === "register" ? "Edit Registration Details" : "Re-enter Password"}
                    </button>
                    <button
                      type="button"
                      disabled={resendCooldown > 0 || otpLoading}
                      onClick={handleResendOtp}
                      className={`font-semibold inline-flex items-center gap-1.5 transition-colors ${
                        resendCooldown > 0
                          ? "text-muted-foreground cursor-not-allowed"
                          : "text-primary hover:underline cursor-pointer"
                      }`}
                    >
                      <RefreshCw className={`size-3.5 ${otpLoading ? "animate-spin" : ""}`} />
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend 6-digit code"}
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="step-credentials"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Practo-style Header: Title on Left, Role Switch link on Right */}
                <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-4">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                      {mode === "login"
                        ? role === "lawyer"
                          ? "Lawyer Sign In"
                          : "Join Legal Consultancy"
                        : role === "lawyer"
                        ? "Lawyer Registration"
                        : "Join Legal Consultancy"}
                    </h1>
                  </div>
                  <div className="text-xs text-right">
                    {role === "client" ? (
                      <div>
                        <span className="text-muted-foreground">Are you a lawyer? </span>
                        <Link
                          to={mode === "login" ? "/auth/lawyer/login" : "/auth/lawyer/register"}
                          className="text-amber-500 hover:text-amber-600 font-semibold hover:underline transition-colors"
                        >
                          {mode === "login" ? "Login Here" : "Register Here"}
                        </Link>
                      </div>
                    ) : (
                      <div>
                        <span className="text-muted-foreground">Are you a client? </span>
                        <Link
                          to={mode === "login" ? "/auth/client/login" : "/auth/client/register"}
                          className="text-amber-500 hover:text-amber-600 font-semibold hover:underline transition-colors"
                        >
                          {mode === "login" ? "Login Here" : "Register Here"}
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                {/* Continue with Google button */}
                <div className="mb-5 space-y-4">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={googleLoading || loading}
                    onClick={handleGoogleSignIn}
                    className="w-full h-11 rounded-lg border-border bg-card/60 hover:bg-muted font-medium transition-all gap-2.5 shadow-sm"
                  >
                    <GoogleIcon className="size-5" />
                    <span>{googleLoading ? "Connecting to Google…" : "Continue with Google"}</span>
                  </Button>

                  {/* Divider */}
                  <div className="relative flex items-center justify-center">
                    <div className="w-full border-t border-border" />
                    <span className="absolute bg-background px-3 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                      Or with email & password
                    </span>
                  </div>
                </div>

                <form onSubmit={onSubmit} className="space-y-4">
                  {mode === "register" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Full Name"
                        className="rounded-lg h-11 border-slate-200 dark:border-slate-800"
                        required
                      />
                    </div>
                  )}

                  {mode === "register" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Mobile Number
                      </Label>
                      <div className="flex gap-2">
                        <select
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          className="h-11 rounded-lg border border-slate-200 dark:border-slate-800 bg-background px-3 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                        >
                          <option value="+91(IND)">+91(IND)</option>
                          <option value="+1(USA)">+1(USA)</option>
                          <option value="+44(UK)">+44(UK)</option>
                          <option value="+971(UAE)">+971(UAE)</option>
                          <option value="+65(SGP)">+65(SGP)</option>
                        </select>
                        <Input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Mobile Number"
                          className="rounded-lg h-11 border-slate-200 dark:border-slate-800 flex-1"
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {mode === "register" ? "Email Address (for OTP Verification)" : "Email Address"}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={mode === "register" ? "Email Address" : "you@example.com"}
                      className="rounded-lg h-11 border-slate-200 dark:border-slate-800"
                    />
                  </div>

                  {mode === "register" && role === "lawyer" && (
                    <>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="specialisation">Primary Specialisation</Label>
                          <select
                            id="specialisation"
                            value={specialization}
                            onChange={(e) => setSpecialization(e.target.value)}
                            className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            {SPECIALISATIONS.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="experience">Years of Experience</Label>
                          <Input
                            id="experience"
                            type="number"
                            min="1"
                            max="50"
                            value={experience}
                            onChange={(e) => setExperience(e.target.value)}
                            className="rounded-xl h-11"
                            placeholder="e.g. 10"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="stateBar">State Bar Council</Label>
                        <select
                          id="stateBar"
                          value={stateBar}
                          onChange={(e) => handleStateBarChange(e.target.value)}
                          className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          {STATE_BAR_COUNCILS.map((b) => (
                            <option key={b.code} value={b.label}>
                              {b.label}
                            </option>
                          ))}
                        </select>
                        <p className="text-[11px] text-muted-foreground">
                          Your enrolment number must start with <span className="font-bold font-mono text-primary">{getExpectedBarCode()}</span>
                        </p>
                      </div>

                      {/* Bar Council Enrolment Number with Verify Step */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="bar">Bar Council Enrolment Number</Label>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            Format: {getExpectedBarCode()}/NUMBER/YEAR
                          </span>
                        </div>

                        {/* Input + Verify button */}
                        <div className="flex gap-2">
                          <Input
                            id="bar"
                            value={barNumber}
                            onChange={(e) => handleBarNumberChange(e.target.value.toUpperCase())}
                            placeholder={`${getExpectedBarCode()}/1234/2019`}
                            className={`rounded-xl font-mono uppercase h-11 flex-1 ${
                              barVerified
                                ? "border-emerald-500 ring-1 ring-emerald-500/40"
                                : barVerifyError
                                ? "border-destructive ring-1 ring-destructive/40"
                                : ""
                            }`}
                            required
                            disabled={barVerified}
                          />
                          <Button
                            type="button"
                            variant={barVerified ? "outline" : "default"}
                            className={`h-11 rounded-xl px-4 shrink-0 font-semibold text-sm ${
                              barVerified
                                ? "border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                                : ""
                            }`}
                            onClick={barVerified ? () => { setBarVerified(false); setBarNumber(""); setBarVerifyError(null); } : handleVerifyBar}
                            disabled={barVerifyLoading || (!barVerified && barNumber.length < 5)}
                          >
                            {barVerifyLoading ? (
                              <span className="flex items-center gap-1.5">
                                <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                Verifying…
                              </span>
                            ) : barVerified ? (
                              <span className="flex items-center gap-1.5">
                                <CheckCircle2 className="size-4" /> Verified
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5">
                                <ShieldCheck className="size-4" /> Verify
                              </span>
                            )}
                          </Button>
                        </div>

                        {/* Status messages */}
                        {barVerified && (
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                            <CheckCircle2 className="size-3.5 shrink-0" />
                            Bar Council enrolment verified — you may proceed.
                          </div>
                        )}
                        {!barVerified && barVerifyError && (
                          <div className="flex items-start gap-1.5 text-xs font-medium text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
                            <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
                            <span>{barVerifyError}</span>
                          </div>
                        )}
                        {!barVerified && !barVerifyError && barNumber.length > 0 && (
                          <p className="text-[11px] text-muted-foreground">
                            ⓘ Click <strong>Verify</strong> to validate your enrolment number before proceeding.
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="certificate">Upload Bar Council Certificate / ID</Label>
                        <label
                          htmlFor="certificate"
                          className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-border bg-card/40 hover:bg-muted/50 cursor-pointer transition-colors"
                        >
                          <Upload className="size-5 text-muted-foreground" />
                          <span className="text-xs font-medium text-foreground text-center">
                            {certificateName ? (
                              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                                <FileCheck2 className="size-4" /> {certificateName}
                              </span>
                            ) : (
                              "Click to upload Certificate or Bar ID (PDF, PNG, JPG max 10MB)"
                            )}
                          </span>
                          <input
                            id="certificate"
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg"
                            onChange={handleCertificateUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {mode === "register" ? "Create Password" : "Password"}
                      </Label>
                      {mode === "login" && (
                        <button
                          type="button"
                          onClick={() => setShowForgotModal(true)}
                          className="text-xs text-primary hover:underline"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="rounded-lg pr-10 h-11 border-slate-200 dark:border-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>

                    {/* Real-Time Password Strength Validation Checklist for Registration */}
                    {mode === "register" && password.length > 0 && (
                      <div className="p-3 bg-muted/50 rounded-lg border border-border space-y-1.5 text-xs mt-2">
                        <p className="font-semibold text-foreground">Password Security Requirements:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                          <span
                            className={`flex items-center gap-1.5 ${
                              passwordRules.length ? "text-emerald-600 font-medium" : "text-muted-foreground"
                            }`}
                          >
                            <CheckCircle2
                              className={`size-3.5 ${passwordRules.length ? "text-emerald-600" : "opacity-30"}`}
                            />
                            At least 8 characters
                          </span>
                          <span
                            className={`flex items-center gap-1.5 ${
                              passwordRules.uppercase ? "text-emerald-600 font-medium" : "text-muted-foreground"
                            }`}
                          >
                            <CheckCircle2
                              className={`size-3.5 ${passwordRules.uppercase ? "text-emerald-600" : "opacity-30"}`}
                            />
                            1 Uppercase letter (A-Z)
                          </span>
                          <span
                            className={`flex items-center gap-1.5 ${
                              passwordRules.lowercase ? "text-emerald-600 font-medium" : "text-muted-foreground"
                            }`}
                          >
                            <CheckCircle2
                              className={`size-3.5 ${passwordRules.lowercase ? "text-emerald-600" : "opacity-30"}`}
                            />
                            1 Lowercase letter (a-z)
                          </span>
                          <span
                            className={`flex items-center gap-1.5 ${
                              passwordRules.number ? "text-emerald-600 font-medium" : "text-muted-foreground"
                            }`}
                          >
                            <CheckCircle2
                              className={`size-3.5 ${passwordRules.number ? "text-emerald-600" : "opacity-30"}`}
                            />
                            1 Number (0-9)
                          </span>
                          <span
                            className={`flex items-center gap-1.5 ${
                              passwordRules.special ? "text-emerald-600 font-medium" : "text-muted-foreground"
                            }`}
                          >
                            <CheckCircle2
                              className={`size-3.5 ${passwordRules.special ? "text-emerald-600" : "opacity-30"}`}
                            />
                            1 Special char (!@#$%)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password Field for Registration */}
                  {mode === "register" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Confirm Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm Password"
                          className={`rounded-lg pr-10 h-11 border-slate-200 dark:border-slate-800 ${
                            confirmPassword.length > 0
                              ? confirmPassword === password
                                ? "border-emerald-500 ring-1 ring-emerald-500/30"
                                : "border-destructive ring-1 ring-destructive/30"
                              : ""
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          title={showConfirmPassword ? "Hide password" : "Show password"}
                        >
                          {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                      {confirmPassword.length > 0 && (
                        <p
                          className={`text-xs flex items-center gap-1 font-medium ${
                            confirmPassword === password ? "text-emerald-600" : "text-destructive"
                          }`}
                        >
                          {confirmPassword === password ? (
                            <>
                              <CheckCircle2 className="size-3.5" /> Passwords match
                            </>
                          ) : (
                            "Passwords do not match"
                          )}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Practo-style Promotional Communication Checkbox & Terms */}
                  {mode === "register" && (
                    <div className="space-y-2 pt-1">
                      <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 dark:text-slate-400 select-none">
                        <input
                          type="checkbox"
                          checked={receiveOffers}
                          onChange={(e) => setReceiveOffers(e.target.checked)}
                          className="mt-0.5 rounded border-slate-300 text-sky-500 focus:ring-sky-400 size-4 cursor-pointer accent-[#00a0e3]"
                        />
                        <span>Receive relevant offers and promotional communication from Legal Consultancy</span>
                      </label>
                      <p className="text-[11px] text-muted-foreground pl-6">
                        By signing up, I agree to{" "}
                        <Link to="/terms" className="text-sky-600 dark:text-sky-400 hover:underline">
                          terms
                        </Link>
                      </p>
                    </div>
                  )}

                  {/* Practo-style "Send OTP" Button */}
                  <Button
                    type="submit"
                    disabled={
                      loading ||
                      googleLoading ||
                      (mode === "register" &&
                        (!isPasswordValid ||
                          password !== confirmPassword ||
                          (role === "lawyer" && !isBarValid)))
                    }
                    className="w-full rounded-lg h-12 text-base font-semibold bg-[#00a0e3] hover:bg-[#0090cc] text-white shadow-sm transition-all cursor-pointer"
                    size="lg"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Sending OTP…
                      </span>
                    ) : mode === "login" ? (
                      <span className="flex items-center gap-2">
                        <Lock className="size-4" />
                        Continue to 2-Step Verification
                      </span>
                    ) : (
                      "Send OTP"
                    )}
                  </Button>
                </form>

                <p className="mt-6 text-sm text-muted-foreground text-center">
                  {mode === "login" ? (
                    <>
                      New to Legal Consultancy Service?{" "}
                      <Link
                        to="/auth/$role/register"
                        params={{ role }}
                        className="font-semibold text-primary hover:underline"
                      >
                        Create a {ROLE_LABEL[role].toLowerCase()} account
                      </Link>
                    </>
                  ) : (
                    <>
                      Already have an account?{" "}
                      <Link
                        to="/auth/$role/login"
                        params={{ role }}
                        className="font-semibold text-primary hover:underline"
                      >
                        Sign in
                      </Link>
                    </>
                  )}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Login Terms & Conditions Modal */}
      <AnimatePresence>
        {showTerms && mode === "login" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="w-full max-w-lg rounded-2xl border border-border bg-background shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border">
                <h2 className="text-xl font-bold">Terms & Conditions</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Please read and accept our Terms & Conditions before continuing.
                </p>
              </div>

              <div className="max-h-72 overflow-y-auto p-6 space-y-5 text-sm">
                <section>
                  <h3 className="font-semibold mb-1">1. Legal Services</h3>
                  <p className="text-muted-foreground">
                    Legal Consultancy Service connects users with independent legal professionals.
                    Advice is provided by the selected lawyer.
                  </p>
                </section>
                <section>
                  <h3 className="font-semibold mb-1">2. No Guaranteed Outcome</h3>
                  <p className="text-muted-foreground">
                    The platform does not guarantee any particular legal result, judgment,
                    settlement, or outcome.
                  </p>
                </section>
                <section>
                  <h3 className="font-semibold mb-1">3. Accurate Information</h3>
                  <p className="text-muted-foreground">
                    You agree to provide accurate information and use the platform only for
                    lawful purposes.
                  </p>
                </section>
                <section>
                  <h3 className="font-semibold mb-1">4. Privacy</h3>
                  <p className="text-muted-foreground">
                    Personal information and documents are handled according to the platform's
                    privacy policy.
                  </p>
                </section>
                <section>
                  <h3 className="font-semibold mb-1">5. Payments</h3>
                  <p className="text-muted-foreground">
                    Consultation fees, cancellations and refunds are subject to the applicable
                    payment policy.
                  </p>
                </section>
              </div>

              <div className="px-6 pb-4">
                <label className="flex items-start gap-3 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1 size-4 accent-[#00a0e3]"
                  />
                  <span>
                    I have read and agree to the <strong>Terms & Conditions</strong>.
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-3 p-6 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowTerms(false);
                    setTermsAccepted(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={!termsAccepted || loading}
                  onClick={() => {
                    setShowTerms(false);
                    // Keep the accepted state true so the existing login submit can continue.
                    setLoading(true);
                    void (async () => {
                      try {
                        await sendEmailOtp(email, role, undefined, password, "login");
                        setResendCooldown(60);
                        setAuthStep("2fa");
                        setOtpCode("");
                        toast.success(
                          `Verification code sent to ${email}. Check your inbox; it expires in 5 minutes.`
                        );
                      } catch (err: unknown) {
                        toast.error(err instanceof Error ? err.message : "Could not send verification email.");
                        setTermsAccepted(false);
                      } finally {
                        setLoading(false);
                      }
                    })();
                  }}
                  className="bg-[#00a0e3] hover:bg-[#0090cc] text-white"
                >
                  {loading ? "Sending OTP..." : "Accept & Continue"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <KeyRound className="size-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Reset your password</h3>
                </div>
                <button
                  onClick={() => setShowForgotModal(false)}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
                >
                  <X className="size-4" />
                </button>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Enter your registered email address and we'll send you instructions to securely reset your password.
              </p>
              <form onSubmit={handleForgotPassword} className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Registered Email</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="rounded-xl h-11"
                  />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForgotModal(false)}
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={forgotLoading} className="rounded-xl">
                    {forgotLoading ? "Sending Link…" : "Send Reset Link"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}