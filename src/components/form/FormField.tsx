"use client";

import { useId } from "react";

interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  placeholder?: string;
  error?: string;
  autoComplete?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
}

export function FormField({
  label,
  name,
  type = "text",
  value,
  placeholder,
  error,
  autoComplete,
  onChange,
  onBlur,
}: FormFieldProps) {
  const id = useId();

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-navy">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full rounded-xl border bg-white px-4 py-3 text-base text-navy shadow-sm outline-none transition-all duration-150 placeholder:text-slate-400 focus:ring-4 ${
          error
            ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100"
            : "border-slate-200 focus:border-fuchsia focus:ring-fuchsia/15"
        }`}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-rose-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
