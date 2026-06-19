import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Palette, Languages, QrCode, ShoppingCart, CalendarCheck, BellRing,
  Smartphone, ShieldCheck, Star, Tags, CreditCard, Share2, X,
  Truck, MessageCircle, Megaphone, Clock, MapPin, LocateFixed,
} from 'lucide-react'
import type { Lang } from '../i18n'
import SectionBadge from './SectionBadge'

interface Props {
  t: any
  lang: Lang
}

const iconMap: Record<string, any> = {
  palette: Palette,
  languages: Languages,
  qrcode: QrCode,
  cart: ShoppingCart,
  calendar: CalendarCheck,
  bell: BellRing,
  notification: Smartphone,
  shield: ShieldCheck,
  star: Star,
  discount: Tags,
  payment: CreditCard,
  social: Share2,
  truck: Truck,
  whatsapp: MessageCircle,
  megaphone: Megaphone,
  clock: Clock,
  google: MapPin,
  location: LocateFixed,
}

export default function Features({ t, lang }: Props) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null)
  const [modalImage, setModalImage] = useState<string | null>(null)
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    setIsTouch(window.matchMedia('(hover: none)').matches)
  }, [])

  const handleBellClick = () => {
    setModalImage(lang === 'tr' ? '/images/mobilimages/callwaiter.png' : '/images/mobilimages/callwaiterEN.png')
  }

  return (
    <section id="features" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <SectionBadge>{t.features.label}</SectionBadge>
          <h2 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">
            {t.features.title}
          </h2>
          <p className="mt-4 text-lg text-gray-500">{t.features.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 items-start">
          {t.features.items.map((item: any, i: number) => {
            const Icon = iconMap[item.icon] || Palette
            const isActive = activeIdx === i
            const isBell = item.icon === 'bell'

            const desktopHandlers = !isTouch ? {
              onMouseEnter: () => setActiveIdx(i),
              onMouseLeave: () => setActiveIdx(null),
            } : {}

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                {...desktopHandlers}
                onClick={() => {
                  if (isTouch) setActiveIdx(isActive ? null : i)
                  if (isBell) handleBellClick()
                }}
                style={{ perspective: '900px' }}
                className="relative bg-white rounded-2xl border border-gray-100 cursor-pointer overflow-hidden"
              >
                <div className="p-6 pb-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">
                    {item.title}
                  </h3>
                </div>

                <motion.div
                  initial={false}
                  animate={{
                    maxHeight: isActive ? 240 : 0,
                    rotateX: isActive ? 0 : -90,
                    opacity: isActive ? 1 : 0,
                  }}
                  transition={{
                    duration: 0.9,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  style={{
                    transformOrigin: 'top center',
                    overflow: 'hidden',
                    backgroundColor: '#4f46e5',
                  }}
                >
                  <p className="text-sm leading-relaxed text-indigo-100 px-6 py-5">
                    {item.desc}
                  </p>
                </motion.div>
              </motion.div>
            )
          })}
        </div>
      </div>

      <AnimatePresence>
        {modalImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setModalImage(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative max-w-full max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setModalImage(null)}
                className="absolute -top-3 -right-3 z-10 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-800" />
              </button>
              <img
                src={modalImage}
                alt=""
                className="max-w-[90vw] max-h-[85vh] w-auto h-auto rounded-2xl shadow-2xl"
                draggable={false}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
