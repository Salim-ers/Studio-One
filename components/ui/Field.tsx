"use client";

import { cn } from "@/lib/utils";

interface FieldProps {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export function Field({ label, htmlFor, hint, error, children, className }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-coffee">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-warm-gray">{hint}</p>}
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}

export const inputClasses =
  "h-11 w-full rounded-xl border border-hairline-strong bg-ivory px-4 text-sm text-coffee " +
  "placeholder:text-warm-gray/70 transition-colors duration-200 " +
  "hover:border-bronze/50 focus:border-bronze focus:outline-none focus:ring-2 focus:ring-bronze/15";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputClasses, props.className)} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(inputClasses, "h-auto min-h-[96px] py-3", props.className)}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cn(inputClasses, "appearance-none", props.className)}>
      {props.children}
    </select>
  );
}
