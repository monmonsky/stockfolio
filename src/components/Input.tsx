interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export default function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {props.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        {...props}
        className={`
          w-full px-4 py-2.5
          text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
          bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl
          focus:bg-white dark:focus:bg-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
          transition-all duration-200
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
          ${className}
        `}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  children: React.ReactNode
}

export function Select({ label, error, className = '', children, ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {props.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        {...props}
        className={`
          w-full px-4 py-2.5
          text-gray-900 dark:text-gray-100
          bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl
          focus:bg-white dark:focus:bg-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
          transition-all duration-200
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
          ${className}
        `}
      >
        {children}
      </select>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
