interface Props {
  children: React.ReactNode
  variant?: 'light' | 'dark'
  className?: string
}

export default function SectionBadge({ children, variant = 'light', className = '' }: Props) {
  const accent = variant === 'dark' ? 'bg-white' : 'bg-indigo-950'
  const pill = variant === 'dark' ? 'bg-indigo-500' : 'bg-indigo-600'

  return (
    <span className={`inline-flex items-stretch ${className}`}>
      <span className={`w-3 ${accent} rounded-sm -my-0.5`} />
      <span className={`${pill} px-5 py-1.5 text-white text-xs md:text-sm font-bold uppercase tracking-widest rounded-r-md ml-0.5`}>
        {children}
      </span>
    </span>
  )
}
