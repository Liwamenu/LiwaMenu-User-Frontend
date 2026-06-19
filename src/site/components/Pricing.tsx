import { motion } from 'framer-motion'
import { ShieldCheck, Zap, Headphones, Sparkles } from 'lucide-react'
import SectionBadge from './SectionBadge'

interface Props {
  t: any
}

export default function Pricing({ t }: Props) {
  return (
    <section id="pricing" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <SectionBadge>{t.pricing.label}</SectionBadge>
          <h2 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">
            {t.pricing.title}
          </h2>
          <p className="mt-4 text-lg text-gray-500">{t.pricing.subtitle}</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-xl mx-auto"
        >
          <div className="relative bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 text-white rounded-3xl shadow-2xl shadow-indigo-900/30 overflow-hidden">
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle at 20% 20%, white 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-purple-400/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative px-8 md:px-12 py-12 text-center">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-400 text-amber-950 text-[11px] font-extrabold uppercase tracking-widest rounded-full shadow-lg">
                <Sparkles className="w-3.5 h-3.5" />
                {t.pricing.note}
              </span>

              <p className="mt-8 text-xs font-bold text-indigo-200 uppercase tracking-[0.25em]">
                {t.pricing.period}
              </p>
              <div className="mt-3 flex items-baseline justify-center gap-2">
                <span className="text-6xl md:text-7xl font-extrabold tracking-tight">
                  {t.pricing.price}
                </span>
              </div>
              <p className="mt-2 text-sm text-indigo-300">
                {t.pricing.taxNote}
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-3">
                <a
                  href="https://www.liwamenu.com/login"
                  className="flex-1 inline-flex items-center justify-center px-6 py-3.5 text-base font-bold text-indigo-900 bg-white rounded-xl hover:bg-indigo-50 transition-all shadow-lg"
                >
                  {t.pricing.cta}
                </a>
                <a
                  href="https://demo.liwamenu.com/?tableNumber=Masa-46"
                  className="flex-1 inline-flex items-center justify-center px-6 py-3.5 text-base font-semibold text-white border border-white/30 rounded-xl hover:bg-white/10 transition-all"
                >
                  {t.pricing.secondary}
                </a>
              </div>

              <div className="mt-10 pt-8 border-t border-white/10 grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-amber-400/20 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-amber-300" />
                  </div>
                  <span className="text-xs font-semibold text-indigo-100 leading-tight">30 Gün İade</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-amber-400/20 flex items-center justify-center">
                    <Headphones className="w-5 h-5 text-amber-300" />
                  </div>
                  <span className="text-xs font-semibold text-indigo-100 leading-tight">7/24 Destek</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-amber-400/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-amber-300" />
                  </div>
                  <span className="text-xs font-semibold text-indigo-100 leading-tight">Anında Aktif</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
