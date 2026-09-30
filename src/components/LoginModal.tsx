import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Building2, 
  ShieldCheck, 
  Mail, 
  Phone, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  User, 
  KeyRound, 
  RefreshCw, 
  ArrowLeft,
  AlertCircle,
  HardHat,
  Shield,
  Briefcase,
  FileSpreadsheet
} from 'lucide-react';
import { UserRole } from '../types';
import { 
  DEMO_OTP,
  verifyDemoOtpAndAuthenticate, 
  normalizePhoneNumber 
} from '../services/authService';


export const LoginModal: React.FC = () => {
  const { loginAs } = useApp();

  // Step 1: CREDENTIALS (Role + Email + Phone), Step 2: OTP_VERIFY
  const [step, setStep] = useState<'CREDENTIALS' | 'OTP_VERIFY'>('CREDENTIALS');
  
  const [selectedRole, setSelectedRole] = useState<UserRole>('Administrator');
  const [email, setEmail] = useState('admin@citytrack.ai');
  const [phone, setPhone] = useState('9876543210');

  // OTP State (6 digits)
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isOtpSending, setIsOtpSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [otpSentNotice, setOtpSentNotice] = useState<string | null>(null);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Update default email & phone based on role selection
  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMsg(null);
    switch (role) {
      case 'Administrator':
        setEmail('admin@citytrack.ai');
        setPhone('9876543210');
        break;
      case 'Contractor':
        setEmail('contractor@citytrack.ai');
        setPhone('9812345678');
        break;
      case 'Field Officer':
        setEmail('field@citytrack.ai');
        setPhone('9765432109');
        break;
      case 'Project Manager':
        setEmail('pm@citytrack.ai');
        setPhone('9988776655');
        break;
    }
  };

  // Timer countdown for Resend OTP
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (step === 'OTP_VERIFY' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Focus first OTP input on step change
  useEffect(() => {
    if (step === 'OTP_VERIFY') {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    }
  }, [step]);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Basic Validation
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid official Email ID.');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit Mobile Phone Number.');
      return;
    }

    const formattedPhone = normalizePhoneNumber(phone);

    setIsOtpSending(true);
    setTimeout(() => {
      setIsOtpSending(false);
      setStep('OTP_VERIFY');
      setTimer(30);
      setCanResend(false);
      setOtpSentNotice(`Demo OTP sent successfully to ${formattedPhone}. Use code ${DEMO_OTP}.`);
    }, 400);
  };

  const handleResendOtp = () => {
    if (!canResend) return;
    setErrorMsg(null);
    setTimer(30);
    setCanResend(false);
    setOtpDigits(['', '', '', '', '', '']);
    setOtpSentNotice(`Demo OTP resent. Use code ${DEMO_OTP}.`);
    setTimeout(() => {
      otpInputRefs.current[0]?.focus();
    }, 100);
  };

  const handleFillDemoOtp = () => {
    setOtpDigits(['1', '2', '3', '4', '5', '6']);
    setErrorMsg(null);
  };

  const handleOtpDigitChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle pasted OTP code e.g. "123456"
      const pasted = value.replace(/\D/g, '').slice(0, 6).split('');
      const newDigits = [...otpDigits];
      pasted.forEach((char, i) => {
        if (i < 6) newDigits[i] = char;
      });
      setOtpDigits(newDigits);
      const nextIndex = Math.min(pasted.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
      return;
    }

    const digit = value.replace(/\D/g, '');
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    // Auto advance focus
    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyAndLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    const enteredCode = otpDigits.join('');

    if (enteredCode.length < 6) {
      setErrorMsg(`Please enter the 6-digit demo OTP code (${DEMO_OTP}).`);
      return;
    }

    if (enteredCode !== DEMO_OTP) {
      setErrorMsg(`Invalid OTP. Please enter ${DEMO_OTP} for this prototype.`);
      return;
    }

    setIsVerifying(true);

    try {
      const formattedPhone = normalizePhoneNumber(phone);
      const userProfile = await verifyDemoOtpAndAuthenticate(
        enteredCode,
        selectedRole,
        email,
        formattedPhone
      );
      setIsVerifying(false);
      loginAs(userProfile.role, userProfile.email, userProfile.phone, userProfile);
    } catch (err: any) {
      setIsVerifying(false);
      setErrorMsg(err.message || `Invalid OTP. Please enter ${DEMO_OTP} for this prototype.`);
    }
  };

  const handleQuickPresetLogin = (role: UserRole) => {
    handleRoleSelect(role);
  };

  const handleInstantLogin = async (role: UserRole) => {
    setIsVerifying(true);
    setErrorMsg(null);
    try {
      const emailMap: Record<UserRole, string> = {
        'Administrator': 'admin@citytrack.ai',
        'Project Manager': 'pm@citytrack.ai',
        'Field Officer': 'field@citytrack.ai',
        'Contractor': 'contractor@citytrack.ai'
      };
      const targetEmail = emailMap[role];
      const userProfile = await verifyDemoOtpAndAuthenticate(
        DEMO_OTP,
        role,
        targetEmail,
        '+919876543210'
      );
      setIsVerifying(false);
      loginAs(userProfile.role, userProfile.email, userProfile.phone, userProfile);
    } catch (err: any) {
      setIsVerifying(false);
      setErrorMsg(err.message || 'Login failed');
    }
  };

  const rolesConfig: { role: UserRole; title: string; icon: React.FC<{ className?: string }>; color: string; desc: string }[] = [
    {
      role: 'Administrator',
      title: 'Administrator / Admin',
      icon: Shield,
      color: 'from-blue-600 to-cyan-500',
      desc: 'Full platform oversight, department budgets, AI predictions & audit logs'
    },
    {
      role: 'Contractor',
      title: 'Contractor',
      icon: HardHat,
      color: 'from-amber-600 to-orange-500',
      desc: 'Milestone tracking, work order submissions & delay justification'
    },
    {
      role: 'Field Officer',
      title: 'Field Officer',
      icon: Briefcase,
      color: 'from-emerald-600 to-teal-500',
      desc: 'Geo-tagged site inspections, photo uploads & progress reporting'
    },
    {
      role: 'Project Manager',
      title: 'Project Manager',
      icon: FileSpreadsheet,
      color: 'from-purple-600 to-indigo-500',
      desc: 'Project scheduling, contractor management & risk resolution'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Background Ambient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-xl bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10">
        
        {/* Header Branding */}
        <div className="text-center space-y-3 mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-xl shadow-blue-500/25">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Building2 className="w-7 h-7 text-cyan-400" />
            </div>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display bg-gradient-to-r from-white via-slate-100 to-cyan-200 bg-clip-text text-transparent">
              CityTrack <span className="text-cyan-400">AI</span>
            </h1>
            <p className="text-xs font-medium text-slate-400 mt-1">
              Prototype Mode • Role-Based Authentication System
            </p>
          </div>
        </div>

        {/* Prototype Banner */}
        <div className="bg-slate-950/90 border border-cyan-500/30 rounded-2xl p-3.5 mb-6 shadow-inner">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">
                Prototype Authentication Mode
              </span>
            </div>
            <span className="text-[10px] text-cyan-400 font-mono font-bold px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30 rounded">
              Demo OTP: {DEMO_OTP}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {rolesConfig.map((rc) => (
              <button
                key={rc.role}
                type="button"
                onClick={() => handleQuickPresetLogin(rc.role)}
                className={`px-2 py-2 border rounded-xl text-[11px] font-bold transition-all text-center flex flex-col items-center justify-center space-y-1 group ${
                  selectedRole === rc.role
                    ? 'bg-slate-800 border-cyan-400 text-cyan-300'
                    : 'bg-slate-900 hover:bg-slate-800 border-slate-700/80 text-slate-300'
                }`}
              >
                <rc.icon className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span className="truncate w-full">{rc.role}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Error Alert Message */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center space-x-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: CREDENTIALS & ROLE SELECTION */}
        {step === 'CREDENTIALS' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            
            {/* Role Selection Grid */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span>1. Select Your Administrative Role</span>
                </label>
                <span className="text-[10px] text-cyan-400 font-semibold">Required</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {rolesConfig.map((rc) => {
                  const isSelected = selectedRole === rc.role;
                  const Icon = rc.icon;
                  return (
                    <div
                      key={rc.role}
                      onClick={() => handleRoleSelect(rc.role)}
                      className={`p-3 rounded-2xl cursor-pointer border transition-all ${
                        isSelected
                          ? 'bg-slate-800/90 border-cyan-500 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/50'
                          : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <div className={`p-1.5 rounded-lg bg-gradient-to-tr ${rc.color} text-white`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                          {rc.title}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1 leading-tight">
                        {rc.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Email ID Field */}
            <div>
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                2. Official Email ID
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="e.g. officer@citytrack.gov.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-mono"
                />
              </div>
            </div>

            {/* Phone Number Field */}
            <div>
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                3. Mobile Phone Number
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 top-3 flex items-center space-x-1 text-slate-400 text-xs font-mono">
                  <Phone className="w-3.5 h-3.5 text-slate-500 mr-1" />
                  <span>+91</span>
                </div>
                <input
                  type="tel"
                  required
                  maxLength={13}
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-16 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-mono"
                />
              </div>
            </div>

            {/* Send OTP Action Button */}
            <button
              type="submit"
              disabled={isOtpSending}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isOtpSending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generating Demo OTP...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Send Demo OTP Code</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* STEP 2: 6-DIGIT OTP VERIFICATION */
          <form onSubmit={handleVerifyAndLogin} className="space-y-5 animate-fadeIn">
            
            {/* Back to Step 1 */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('CREDENTIALS')}
                className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change Number / Role</span>
              </button>

              <span className="text-[11px] font-semibold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                Role: {selectedRole}
              </span>
            </div>

            {/* OTP Sent Notice */}
            {otpSentNotice && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{otpSentNotice}</span>
              </div>
            )}

            {/* OTP Input Grid */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Enter 6-Digit Demo OTP Code
                </label>
                
                <button
                  type="button"
                  onClick={handleFillDemoOtp}
                  className="text-[11px] font-bold text-cyan-300 hover:text-cyan-200 bg-blue-600/20 border border-blue-500/30 px-2 py-0.5 rounded-lg flex items-center space-x-1"
                >
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>Auto-fill Demo Code ({DEMO_OTP})</span>
                </button>
              </div>

              <div className="grid grid-cols-6 gap-2 sm:gap-3">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpInputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-full h-12 text-center text-lg font-bold font-mono bg-slate-950 border border-slate-800 rounded-xl text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all shadow-inner"
                  />
                ))}
              </div>
            </div>

            {/* Resend Timer */}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Didn't receive code?</span>
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-cyan-400 hover:underline font-bold flex items-center space-x-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Resend Demo OTP</span>
                </button>
              ) : (
                <span className="font-mono text-slate-400">
                  Resend available in <strong className="text-cyan-400">{timer}s</strong>
                </span>
              )}
            </div>

            {/* Verify Action Button */}
            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-500 hover:from-emerald-500 hover:to-cyan-400 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Authenticating Demo Session...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify OTP & Access CityTrack AI</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer Security Badge */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center space-x-1.5 text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Prototype Authentication • Session Encrypted</span>
          </div>
          <span className="font-mono">National Smart City Portal v2.4</span>
        </div>
      </div>
    </div>
  );
};

