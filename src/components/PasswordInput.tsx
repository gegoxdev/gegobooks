import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
  rightLabel?: React.ReactNode;
}

const PasswordInput = ({ label, value, onChange, placeholder = '••••••••', required, rightLabel }: PasswordInputProps) => {
  const [show, setShow] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="font-body text-sm font-medium text-foreground">{label}</label>
        {rightLabel}
      </div>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="w-full font-body border border-border rounded-lg px-4 py-3 pr-11 text-sm bg-surface text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
          tabIndex={-1}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

export default PasswordInput;
