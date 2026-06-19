import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import SectionBadge from './SectionBadge'

interface Props {
  t: any
}

const images = [
  '/images/order1.png',
  '/images/mobilimages/rezerve.png',
  '/images/mobilimages/languages.png',
]

export default function FeatureDetails({ t }: Props) {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-32">
        {t.featureDetails.map((feature: any, i: number) => {
          const isReversed = i % 2 === 1
          return (
            <div
              key={i}
              className={`flex flex-col ${isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12 lg:gap-20`}
            >
              <motion.div
                initial={{ opacity: 0, x: isReversed ? 30 : -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="flex-1"
              >
                <SectionBadge>{feature.label}</SectionBadge>
                <h3 className="mt-4 text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
                  {feature.title}
                </h3>
                <p className="mt-4 text-gray-500 leading-relaxed">
                  {feature.desc}
                </p>
                <ul className="mt-6 space-y-3">
                  {feature.bullets.map((bullet: string, j: number) => (
                    <li key={j} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-indigo-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{bullet}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: isReversed ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex-shrink-0"
              >
                <div className="relative">
                  <div className="absolute -inset-4 bg-indigo-100/50 rounded-[3rem] blur-2xl" />
                  <div className="relative">
                    <img
                      src={images[i]}
                      alt={feature.title}
                      className={
                        i === 0
                          ? 'w-[360px] md:w-[420px] rounded-2xl shadow-2xl'
                          : 'w-[288px] md:w-[336px] rounded-2xl shadow-2xl'
                      }
                      loading="lazy"
                    />
                  </div>
                </div>
              </motion.div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
