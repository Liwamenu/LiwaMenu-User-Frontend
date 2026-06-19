import { motion } from 'framer-motion'
import { UserPlus, UtensilsCrossed, QrCode } from 'lucide-react'
import SectionBadge from './SectionBadge'

interface Props {
  t: any
}

const stepIcons = [UserPlus, UtensilsCrossed, QrCode]

export default function HowItWorks({ t }: Props) {
  return (
    <section id="how-it-works" className="py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <SectionBadge>{t.howItWorks.label}</SectionBadge>
          <h2 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">
            {t.howItWorks.title}
          </h2>
        </div>

        <div className="relative">
          <div className="hidden md:block absolute top-16 left-[16.6%] right-[16.6%] h-px bg-gradient-to-r from-indigo-200 via-indigo-400 to-indigo-200" />

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {t.howItWorks.steps.map((step: any, i: number) => {
              const Icon = stepIcons[i]
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  className="text-center relative"
                >
                  <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 mb-6">
                    <Icon className="w-7 h-7" />
                    <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white text-indigo-600 text-sm font-extrabold flex items-center justify-center shadow-md border-2 border-indigo-600">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
