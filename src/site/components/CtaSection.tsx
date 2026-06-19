import { motion } from 'framer-motion'

interface Props {
  t: any
}

export default function CtaSection({ t }: Props) {
  return (
    <section className="relative py-24 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(/images/restoran2.png)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/75 via-indigo-800/70 to-purple-900/75" />
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-400/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight"
            >
              {t.cta.title}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="mt-4 text-lg text-indigo-100"
            >
              {t.cta.subtitle}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <a
                href="/login"
                className="inline-flex items-center px-10 py-4 text-lg font-bold text-indigo-700 bg-white rounded-xl hover:bg-gray-50 transition-all shadow-xl"
              >
                {t.cta.button}
              </a>
              <a
                href="https://demo.liwamenu.com/?tableNumber=Masa-46"
                className="inline-flex items-center px-10 py-4 text-lg font-bold text-white border-2 border-white/40 rounded-xl hover:bg-white/10 transition-all"
              >
                {t.hero.secondary}
              </a>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="flex items-end justify-center gap-4"
          >
            <div className="opacity-60 -rotate-6 translate-y-4">
              <img src="/images/mobilimages/12.png" alt="" className="w-[160px] rounded-2xl shadow-2xl" loading="lazy" />
            </div>
            <div className="z-10">
              <img src="/images/mobilimages/27.png" alt="" className="w-[200px] md:w-[220px] rounded-2xl shadow-2xl" loading="lazy" />
            </div>
            <div className="opacity-60 rotate-6 translate-y-4">
              <img src="/images/mobilimages/30.png" alt="" className="w-[160px] rounded-2xl shadow-2xl" loading="lazy" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
