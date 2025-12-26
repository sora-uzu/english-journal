import React from 'react';

type GlassInputProps = {
    id: string;
    label: string;
    value: string;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string;
    name?: string;
    placeholder?: string;
    autoComplete?: string;
    autoFocus?: boolean;
    required?: boolean;
    error?: string;
    className?: string;
    inputRef?: React.Ref<HTMLInputElement>;
};

export default function GlassInput({
    id,
    label,
    value,
    onChange,
    type = 'text',
    name,
    placeholder,
    autoComplete,
    autoFocus,
    required,
    error,
    className = '',
    inputRef,
}: GlassInputProps) {
    return (
        <div className={`space-y-2 ${className}`}>
            <label
                htmlFor={id}
                className="text-sm font-medium text-slate-700"
            >
                {label}
            </label>
            <input
                id={id}
                type={type}
                name={name ?? id}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                autoComplete={autoComplete}
                autoFocus={autoFocus}
                required={required}
                ref={inputRef}
                className={`lg-input ${error ? 'lg-input-error' : ''}`}
            />
            {error && <p className="text-xs text-rose-500">{error}</p>}
        </div>
    );
}
