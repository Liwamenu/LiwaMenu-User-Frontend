import { useState, useEffect } from 'react'
import { detectLang, setLang, t } from './i18n'
import type { Lang } from './i18n'
import Header from './components/Header'
import Hero from './components/Hero'
import StatsBar from './components/StatsBar'
import Benefits from './components/Benefits'
import Features from './components/Features'
import Templates from './components/Templates'
import FeatureDetails from './components/FeatureDetails'
import HowItWorks from './components/HowItWorks'
import Pricing from './components/Pricing'
import Platforms from './components/Platforms'
import CtaSection from './components/CtaSection'
import Footer from './components/Footer'

function App() {
  const [lang, setCurrentLang] = useState<Lang>(detectLang)

  useEffect(() => {
    const prevent = (e: MouseEvent) => e.preventDefault()
    document.addEventListener('contextmenu', prevent)
    return () => document.removeEventListener('contextmenu', prevent)
  }, [])

  const changeLang = (newLang: Lang) => {
    setLang(newLang)
    setCurrentLang(newLang)
  }

  const tr = t(lang)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E9EFF9' }}>
      <Header lang={lang} onLangChange={changeLang} t={tr} />
      <Hero t={tr} />
      <StatsBar t={tr} />
      <Benefits t={tr} />
      <Features t={tr} lang={lang} />
      <Templates t={tr} />
      <FeatureDetails t={tr} />
      <HowItWorks t={tr} />
      <Pricing t={tr} />
      <Platforms />
      <CtaSection t={tr} />
      <Footer t={tr} />
    </div>
  )
}

export default App
