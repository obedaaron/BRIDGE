import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function PasswordInput({ value, onChange, placeholder = "Password" }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        className="auth-input pr-11"
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        minLength={8}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="auth-control absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-[#d6ff57]"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}