import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  t: any
}

const HERO_IMAGES = [
  '/images/mobilimages/12.png',
  '/images/mobilimages/15.png',
  '/images/mobilimages/5.png',
  '/images/mobilimages/7.png',
  '/images/mobilimages/18.png',
  '/images/mobilimages/callwaiter.png',
  '/images/mobilimages/wporder.png',
]

export default function Hero({ t }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % HERO_IMAGES.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden min-h-[90vh] flex items-center">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(/images/restoran1.png)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/85 via-gray-900/80 to-black/85" />
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <div className="text-center lg:text-left">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight"
            >
              {t.hero.title1}
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                {t.hero.titleHighlight}
              </span>
              {t.hero.title2 ? <> {t.hero.title2}</> : null}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 text-lg text-gray-300 max-w-lg mx-auto lg:mx-0"
            >
              {t.hero.subtitle}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <a
                href="https://www.liwamenu.com/login"
                className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/30 text-center"
              >
                {t.hero.cta}
              </a>
              <a
                href="https://demo.liwamenu.com/?tableNumber=Masa-46"
                className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-white border border-white/20 rounded-xl hover:bg-white/10 transition-all text-center"
              >
                {t.hero.secondary}
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-8 flex items-center justify-center lg:justify-start gap-3"
            >
              <a
                href="https://demo.liwamenu.com/?tableNumber=Masa-46"
                className="block p-[10px] bg-white rounded-[5px] hover:opacity-90 transition-all"
              >
                <img
                  src="/images/mobilimages/qr-table-11.png"
                  alt="QR Code"
                  className="w-[102px] h-[102px]"
                  draggable={false}
                />
              </a>
              <span className="text-sm text-indigo-300 font-medium">{t.hero.scanText}</span>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex items-center justify-center"
          >
            <div className="relative w-[280px] md:w-[340px]" style={{ aspectRatio: '666 / 1466' }}>
              <AnimatePresence mode="sync">
                {HERO_IMAGES.map((src, i) =>
                  i === currentIdx ? (
                    <motion.img
                      key={src}
                      src={src}
                      alt=""
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.04 }}
                      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute inset-0 w-full h-full object-contain rounded-2xl"
                      draggable={false}
                      onContextMenu={(e) => e.preventDefault()}
                      onDragStart={(e) => e.preventDefault()}
                      style={{ userSelect: 'none', WebkitUserDrag: 'none' } as any}
                    />
                  ) : null
                )}
              </AnimatePresence>

              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-1.5">
                {HERO_IMAGES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIdx(i)}
                    aria-label={`Slide ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all ${
                      i === currentIdx ? 'w-6 bg-indigo-400' : 'w-1.5 bg-white/30 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
