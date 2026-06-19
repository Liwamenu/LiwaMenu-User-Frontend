import { motion } from 'framer-motion'

const platforms = [
  { name: 'Google', color: '#4285F4' },
  { name: 'Google Maps', color: '#34A853' },
  { name: 'Instagram', color: '#E4405F' },
  { name: 'Facebook', color: '#1877F2' },
  { name: 'TripAdvisor', color: '#00AF87' },
  { name: 'TikTok', color: '#000000' },
  { name: 'WhatsApp', color: '#25D366' },
  { name: 'YouTube', color: '#FF0000' },
]

export default function Platforms() {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-4 md:gap-6"
        >
          {platforms.map((platform) => (
            <div
              key={platform.name}
              className="flex items-center gap-2.5 bg-white px-5 py-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
            >
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: platform.color }}
              />
              <span className="text-sm font-medium text-gray-600">{platform.name}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
