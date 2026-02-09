import { useId, useState } from 'react'

export const FormInput = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled,
  textarea,
  maxLength,
}: {
  label: string
  type?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  textarea?: boolean
  maxLength?: number
}) => {
  const id = useId()
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium text-slate-300">
        {label}
      </label>
      {textarea ? (
        <textarea
          id={id}
          className="input min-h-[100px]"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
        />
      ) : (
        <div className="relative">
          <input
            id={id}
            className={`input ${isPassword ? 'pr-10' : ''}`}
            type={inputType}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
          />
          {isPassword && (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md border border-slate-700 bg-slate-950/60 p-1 text-slate-300 hover:text-slate-100 hover:border-slate-600"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                  <path
                    d="M12 6c5 0 8.5 6 8.5 6s-3.5 6-8.5 6-8.5-6-8.5-6S7 6 12 6Z"
                    fill="currentColor"
                  />
                  <circle cx="12" cy="12" r="3" fill="#0B1220" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                  <path
                    d="M12 6c5 0 8.5 6 8.5 6s-3.5 6-8.5 6-8.5-6-8.5-6S7 6 12 6Z"
                    fill="currentColor"
                  />
                  <circle cx="12" cy="12" r="3" fill="#0B1220" />
                  <path d="M5 5l14 14" stroke="#0B1220" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
