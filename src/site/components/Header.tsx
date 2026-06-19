import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Mail, MessageCircle, ChevronDown } from 'lucide-react'
import type { Lang } from '../i18n'

interface Props {
  lang: Lang
  onLangChange: (lang: Lang) => void
  t: any
}

export default function Header({ lang, onLangChange, t }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const contactRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!contactOpen) return
    const onClick = (e: MouseEvent) => {
      if (contactRef.current && !contactRef.current.contains(e.target as Node)) {
        setContactOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContactOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [contactOpen])

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-2.5">
            <img src="/images/lwlogo.jpeg" alt="LiwaMenu" className="h-9 w-auto rounded-lg" />
            <span className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Conthrax', sans-serif" }}>LiwaMenu</span>
          </a>

          <nav className="hidden lg:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">{t.nav.features}</a>
            <a href="#themes" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">{t.nav.themes}</a>
            <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">{t.nav.howItWorks}</a>
            <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">{t.nav.pricing}</a>

            <div className="relative" ref={contactRef}>
              <button
                onClick={() => setContactOpen((v) => !v)}
                aria-expanded={contactOpen}
                aria-haspopup="menu"
                className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors cursor-pointer"
              >
                {t.nav.contact}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${contactOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {contactOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="absolute right-0 mt-3 w-60 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden"
                    role="menu"
                  >
                    <a
                      href="mailto:support@liwasoft.com"
                      onClick={() => setContactOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 transition-colors"
                      role="menuitem"
                    >
                      <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900">{t.footer.contact}</div>
                        <div className="text-xs text-gray-500 truncate">support@liwasoft.com</div>
                      </div>
                    </a>
                    <div className="border-t border-gray-100" />
                    <a
                      href="https://wa.me/908508407807"
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setContactOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-green-50 transition-colors"
                      role="menuitem"
                    >
                      <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                        <MessageCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900">{t.footer.wpContact}</div>
                        <div className="text-xs text-gray-500 truncate">+90 850 840 78 07</div>
                      </div>
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={() => onLangChange(lang === 'tr' ? 'en' : 'tr')}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all cursor-pointer"
            >
              <img src={lang === 'tr' ? 'https://flagcdn.com/w40/tr.png' : 'https://flagcdn.com/w40/gb.png'} alt="" className="w-5 h-3.5 object-cover rounded-sm" />
              {lang === 'tr' ? 'TR' : 'EN'}
            </button>
            <a
              href="/login"
              className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20"
            >
              {t.nav.login}
            </a>
          </div>

          <button
            className="lg:hidden p-2 cursor-pointer text-gray-700"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3 shadow-lg">
          <a href="#features" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-gray-600 py-2">{t.nav.features}</a>
          <a href="#themes" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-gray-600 py-2">{t.nav.themes}</a>
          <a href="#how-it-works" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-gray-600 py-2">{t.nav.howItWorks}</a>
          <a href="#pricing" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-gray-600 py-2">{t.nav.pricing}</a>

          <div className="border-t border-gray-100 pt-3 space-y-2">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t.nav.contact}</div>
            <a
              href="mailto:support@liwasoft.com"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700"
            >
              <Mail className="w-4 h-4 text-indigo-600" />
              support@liwasoft.com
            </a>
            <a
              href="https://wa.me/908508407807"
              target="_blank"
              rel="noreferrer"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700"
            >
              <MessageCircle className="w-4 h-4 text-green-600" />
              +90 850 840 78 07
            </a>
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-center gap-3">
            <button
              onClick={() => {
                onLangChange(lang === 'tr' ? 'en' : 'tr')
                setMobileOpen(false)
              }}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-600 cursor-pointer"
            >
              <img src={lang === 'tr' ? 'https://flagcdn.com/w40/gb.png' : 'https://flagcdn.com/w40/tr.png'} alt="" className="w-5 h-3.5 object-cover rounded-sm" />
              {lang === 'tr' ? 'English' : 'Türkçe'}
            </button>
          </div>
          <a
            href="https://www.liwamenu.com/login"
            onClick={() => setMobileOpen(false)}
            className="block text-center px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl"
          >
            {t.nav.login}
          </a>
        </div>
      )}
    </header>
  )
}
