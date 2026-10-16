import { cn } from "@/lib/utils";
import { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, forwardRef, useState } from "react";
import { Eye, EyeOff } from "@/components/ui/icons";

const fieldBase =
  "w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] transition-colors focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]";

interface FieldWrapperProps {
  label?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

export function FieldWrapper({ label, error, hint, children }: FieldWrapperProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-[var(--color-text-primary)]">{label}</label>}
      {children}
      {hint && !error && <p className="text-xs text-[var(--color-text-tertiary)]">{hint}</p>}
      {error && <p className="text-xs text-[var(--color-error)]">{error}</p>}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}
export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, label, error, hint, ...props }, ref) => (
  <FieldWrapper label={label} error={error} hint={hint}>
    <input ref={ref} className={cn(fieldBase, error && "border-[var(--color-error)]", className)} {...props} />
  </FieldWrapper>
));
Input.displayName = "Input";

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
  hint?: string;
}
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, error, hint, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    return (
      <FieldWrapper label={label} error={error} hint={hint}>
        <div className="relative">
          <input
            ref={ref}
            type={visible ? "text" : "password"}
            className={cn(fieldBase, "pr-11", error && "border-[var(--color-error)]", className)}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            tabIndex={-1}
            aria-label={visible ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-text-secondary)]"
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </FieldWrapper>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => (
    <FieldWrapper label={label} error={error}>
      <textarea ref={ref} className={cn(fieldBase, "min-h-24 resize-y", error && "border-[var(--color-error)]", className)} {...props} />
    </FieldWrapper>
  )
);
Textarea.displayName = "Textarea";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, children, ...props }, ref) => (
    <FieldWrapper label={label} error={error}>
      <select ref={ref} className={cn(fieldBase, "cursor-pointer", error && "border-[var(--color-error)]", className)} {...props}>
        {children}
      </select>
    </FieldWrapper>
  )
);
Select.displayName = "Select";
