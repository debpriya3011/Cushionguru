// Re-export shared types
export * from '@shared-types/calculator'
export * from '@shared-types/user'
export * from '@shared-types/quote'

// App-specific types
export interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

export interface DashboardStat {
  title: string
  value: string | number
  change?: string
  trend?: 'up' | 'down'
  icon: React.ComponentType<{ className?: string }>
}

export interface TableColumn<T> {
  key: keyof T | string
  header: string
  cell: (row: T) => React.ReactNode
}

export interface FilterOption {
  value: string
  label: string
}

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

