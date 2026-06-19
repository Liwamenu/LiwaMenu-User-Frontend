import { motion } from 'framer-motion'

interface Props {
  t: any
}

const stats = [
  { value: '30+', key: 'themes' },
  { value: '11', key: 'languages' },
  { value: '20+', key: 'features' },
  { value: '99.9%', key: 'uptime' },
]

export default function StatsBar({ t }: Props) {
  return (
    <section className="relative -mt-10 z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-white rounded-2xl shadow-xl border border-gray-100 grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100"
      >
        {stats.map((stat) => (
          <div key={stat.key} className="px-6 py-6 text-center">
            <div className="text-3xl md:text-4xl font-extrabold text-indigo-600">{stat.value}</div>
            <div className="mt-1 text-sm text-gray-500 font-medium">{(t.stats as any)[stat.key]}</div>
          </div>
        ))}
      </motion.div>
    </section>
  )
}
