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
  required?: boolean;
  options?: { value: string; label: string }[];
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
  required = true,
  options,
  onChange,
  onBlur,
}: FormFieldProps) {
  const id = useId();

  const fieldClassName = `w-full rounded-xl border-2 bg-slate-50 px-4 py-3 text-base font-medium text-navy outline-none transition-all duration-150 placeholder:font-normal placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
    error
      ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100"
      : "border-slate-300 focus:border-fuchsia focus:ring-fuchsia/15"
  }`;

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-navy">
        {label} {required && <span className="text-fuchsia">*</span>}
      </label>
      {options ? (
        <select
          id={id}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={fieldClassName}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
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
          className={fieldClassName}
        />
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-rose-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
