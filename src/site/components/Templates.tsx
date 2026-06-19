import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import SectionBadge from './SectionBadge'

interface Props {
  t: any
}

const TOTAL = 32
const themeImages = Array.from({ length: TOTAL }, (_, i) => `/images/mobilimages/${i + 1}.png`)
const VISIBLE = 9
const HALF = Math.floor(VISIBLE / 2)
const AUTO_SPEED = 0.4

export default function Templates({ t }: Props) {
  const [, setPosition] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const posRef = useRef(0)
  const rafRef = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const hoveringRef = useRef(false)
  const mouseSpeedRef = useRef(0)
  const touchRef = useRef({ lastX: 0, speed: 0 })

  const animate = useCallback(() => {
    const speed = hoveringRef.current ? mouseSpeedRef.current : AUTO_SPEED
    posRef.current = (posRef.current + speed / 60) % TOTAL
    if (posRef.current < 0) posRef.current += TOTAL
    setPosition(posRef.current)
    rafRef.current = requestAnimationFrame(animate)
  }, [])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [animate])

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    mouseSpeedRef.current = x * 4
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchRef.current = { lastX: e.touches[0].clientX, speed: 0 }
    hoveringRef.current = true
  }
  const handleTouchMove = (e: React.TouchEvent) => {
    const currentX = e.touches[0].clientX
    const diff = currentX - touchRef.current.lastX
    mouseSpeedRef.current = -diff * 0.05
    touchRef.current.lastX = currentX
  }
  const handleTouchEnd = () => {
    hoveringRef.current = false
    mouseSpeedRef.current = 0
  }

  const activeIdx = Math.round(posRef.current) % TOTAL

  const getVisibleItems = () => {
    const center = posRef.current
    const items = []
    for (let offset = -HALF; offset <= HALF; offset++) {
      const rawIdx = Math.round(center) + offset
      const idx = ((rawIdx % TOTAL) + TOTAL) % TOTAL
      const fractional = center - Math.round(center)
      const adjustedOffset = offset - fractional
      items.push({ idx, offset: adjustedOffset, intOffset: offset })
    }
    return items
  }

  return (
    <section id="themes" className="py-24 bg-gradient-to-b from-gray-900 to-indigo-950 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <SectionBadge variant="dark">{t.themes.label}</SectionBadge>
          <h2 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            {t.themes.title}
          </h2>
          <p className="mt-4 text-lg text-gray-400">{t.themes.subtitle}</p>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative h-[520px] md:h-[600px] select-none"
        style={{ perspective: '1200px' }}
        onMouseEnter={() => { hoveringRef.current = true }}
        onMouseLeave={() => { hoveringRef.current = false; mouseSpeedRef.current = 0 }}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          {getVisibleItems().map(({ idx, offset, intOffset }) => {
            const absOffset = Math.abs(offset)
            const scale = Math.max(0.35, 1 - absOffset * 0.15)
            const translateX = offset * 180
            const translateZ = Math.max(-400, 100 - absOffset * 100)
            const rotateY = offset * -25
            const opacity = Math.max(0.2, 1 - absOffset * 0.2)
            const zIndex = VISIBLE - Math.round(absOffset)
            const isCenter = Math.abs(offset) < 0.5

            return (
              <div
                key={`${idx}-${intOffset}`}
                className="absolute"
                style={{
                  transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                  opacity,
                  zIndex,
                  cursor: isCenter ? 'pointer' : 'default',
                  willChange: 'transform, opacity',
                }}
                onClick={() => {
                  if (isCenter) setSelected(themeImages[idx])
                }}
              >
                <img
                  src={themeImages[idx]}
                  alt=""
                  className={`h-[400px] md:h-[480px] w-auto rounded-2xl shadow-2xl ${
                    isCenter ? 'shadow-indigo-500/40 ring-2 ring-indigo-400/50' : ''
                  }`}
                  loading="lazy"
                  draggable={false}
                />
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex justify-center gap-1.5 mt-6">
        {themeImages.map((_, i) => (
          <button
            key={i}
            onClick={() => { posRef.current = i }}
            className={`w-2 h-2 rounded-full transition-all ${
              i === activeIdx ? 'bg-indigo-400 w-6' : 'bg-white/20 hover:bg-white/40'
            }`}
          />
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelected(null)}
                className="absolute -top-3 -right-3 z-10 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 text-gray-800" />
              </button>
              <img
                src={selected}
                alt=""
                className="max-h-[85vh] w-auto rounded-2xl shadow-2xl"
                draggable={false}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
