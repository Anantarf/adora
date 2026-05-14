import { Eye, EyeOff, Lock, User } from "lucide-react";
import type { UseFormRegisterReturn } from "react-hook-form";

interface LoginFieldProps {
  label: string;
  placeholder: string;
  registration: UseFormRegisterReturn;
  errorMessage?: string;
  disabled: boolean;
}

interface LoginPasswordFieldProps extends LoginFieldProps {
  showPassword: boolean;
  onTogglePassword: () => void;
}

export function LoginUsernameField({ label, placeholder, registration, errorMessage, disabled }: LoginFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-micro text-white/70 ml-1">{label}</label>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
          <User className="size-5 text-white/50 group-focus-within:text-primary transition-colors" />
        </div>
        <input
          {...registration}
          type="text"
          disabled={disabled}
          autoComplete="username"
          inputMode="text"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="next"
          onKeyDown={(e) => e.key === " " && e.preventDefault()}
          className="w-full bg-login-input border border-white/12 rounded-2xl py-4 pl-14 pr-5 text-white placeholder:text-white/22 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-all disabled:opacity-50 [&:-webkit-autofill]:[transition:background-color_9999999s] [&:-webkit-autofill]:[-webkit-text-fill-color:white]"
          placeholder={placeholder}
        />
      </div>
      {errorMessage && <p className="text-xs text-red-400 mt-1 ml-1">{errorMessage}</p>}
    </div>
  );
}

export function LoginPasswordField({ label, placeholder, registration, errorMessage, disabled, showPassword, onTogglePassword }: LoginPasswordFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-micro text-white/70 ml-1">{label}</label>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
          <Lock className="size-5 text-white/50 group-focus-within:text-primary transition-colors" />
        </div>
        <input
          {...registration}
          type={showPassword ? "text" : "password"}
          disabled={disabled}
          autoComplete="current-password"
          enterKeyHint="go"
          onKeyDown={(e) => e.key === " " && e.preventDefault()}
          className="w-full bg-login-input border border-white/12 rounded-2xl py-4 pl-14 pr-14 text-white placeholder:text-white/22 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-all disabled:opacity-50 [&:-webkit-autofill]:[transition:background-color_9999999s] [&:-webkit-autofill]:[-webkit-text-fill-color:white]"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={onTogglePassword}
          className="absolute inset-y-0 right-0 px-4 flex items-center text-white/60 hover:text-white/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 rounded-r-2xl transition-colors"
          aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
        >
          {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
        </button>
      </div>
      {errorMessage && <p className="text-xs text-red-400 mt-1 ml-1">{errorMessage}</p>}
    </div>
  );
}
