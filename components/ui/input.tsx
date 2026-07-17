import { cn } from "@/lib/utils";
import { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, forwardRef } from "react";

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
