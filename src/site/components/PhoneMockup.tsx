interface Props {
  image: string
  alt?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: 'w-[160px] h-[320px]',
  md: 'w-[200px] h-[400px] md:w-[220px] md:h-[440px]',
  lg: 'w-[240px] h-[480px] md:w-[280px] md:h-[560px]',
}

export default function PhoneMockup({ image, alt = '', className = '', size = 'md' }: Props) {
  return (
    <div className={`relative ${sizes[size]} ${className}`}>
      <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-b from-gray-800 to-gray-900 shadow-2xl p-[3px]">
        <div className="relative w-full h-full rounded-[2.3rem] overflow-hidden bg-black">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 w-[90px] h-[25px] bg-black rounded-b-2xl flex items-center justify-center">
            <div className="w-[50px] h-[4px] rounded-full bg-gray-800" />
          </div>

          <div className="absolute top-[1px] left-[1px] right-[1px] bottom-[1px] rounded-[2.2rem] overflow-hidden">
            <img
              src={image}
              alt={alt}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          <div className="absolute bottom-[6px] left-1/2 -translate-x-1/2 w-[100px] h-[4px] bg-white/30 rounded-full" />
        </div>
      </div>

      <div className="absolute -inset-1 rounded-[3rem] bg-gradient-to-b from-gray-600/20 to-transparent pointer-events-none" />
    </div>
  )
}
