interface CardProps {
  title: string
  value: string
  subtitle?: string
  color?: 'default' | 'green' | 'red'
}

export default function Card({ title, value, subtitle, color = 'default' }: CardProps) {
  const colorClasses = {
    default: 'text-gray-900 dark:text-gray-100',
    green: 'text-green-600 dark:text-green-400',
    red: 'text-red-600 dark:text-red-400'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 p-6 transition-colors">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
      <p className={`text-2xl font-bold mt-2 ${colorClasses[color]}`}>{value}</p>
      {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
    </div>
  )
}
