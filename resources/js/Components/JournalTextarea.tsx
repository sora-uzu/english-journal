import React, { useEffect, useRef } from "react";

type JournalTextareaProps = {
    label: string;
    name: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    subLabel?: string;
    error?: string;
    disabled?: boolean;
};

const JournalTextarea: React.FC<JournalTextareaProps> = ({
    label,
    name,
    value,
    onChange,
    placeholder,
    className = "",
    subLabel,
    error,
    disabled = false,
}) => {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    const adjustHeight = () => {
        if (!textareaRef.current) return;
        const element = textareaRef.current;
        element.style.height = "auto";
        element.style.height = `${element.scrollHeight}px`;
    };

    useEffect(() => {
        adjustHeight();
    }, [value]);

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange(event.target.value);
        adjustHeight();
    };

    const textareaClasses = [
        "w-full",
        "min-h-[104px]",
        "sm:min-h-[120px]",
        "resize-none",
        "rounded-lg",
        "border",
        "bg-white",
        "px-4",
        "py-3",
        "text-base",
        "leading-relaxed",
        "md:text-sm",
        "focus:outline-none",
        "focus:ring-2",
        error
            ? "border-red-400 focus:border-red-500 focus:ring-red-500"
            : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500",
        "placeholder:text-gray-400",
        "transition",
    ].join(" ");

    return (
        <div className={`space-y-2 md:space-y-3 ${className}`}>
            <label
                htmlFor={name}
                className="flex items-baseline gap-1.5 md:gap-2 text-gray-900"
            >
                <span className="font-semibold">{label}</span>
                {subLabel && (
                    <span className="text-xs text-gray-500">{subLabel}</span>
                )}
            </label>
            <textarea
                id={name}
                name={name}
                ref={textareaRef}
                className={textareaClasses}
                placeholder={placeholder}
                value={value}
                onChange={handleChange}
                onInput={adjustHeight}
                disabled={disabled}
                rows={3}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
};

export default JournalTextarea;
