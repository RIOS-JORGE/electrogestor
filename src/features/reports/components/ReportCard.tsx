import type { ReactNode } from 'react'

interface ReportCardProps {
  title: string
  children: ReactNode
}

export function ReportCard({ title, children }: ReportCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>
      {children}
    </div>
  )
}