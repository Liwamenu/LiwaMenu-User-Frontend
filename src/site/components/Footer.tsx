import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, MessageCircle, LifeBuoy } from 'lucide-react'

interface Props {
  t: any
}

export default function Footer({ t }: Props) {
  const [termsOpen, setTermsOpen] = useState(false)

  useEffect(() => {
    if (!termsOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTermsOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [termsOpen])

  return (
    <footer id="contact" className="bg-gray-900 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-gray-800">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/images/lwlogo.jpeg" alt="LiwaMenu" className="h-8 w-auto rounded-lg" />
              <span className="text-xl font-bold text-white" style={{ fontFamily: "'Conthrax', sans-serif" }}>LiwaMenu</span>
            </div>
            <p className="text-sm text-gray-400">{t.footer.desc}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">{t.footer.product}</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">{t.footer.features}</a></li>
              <li><a href="#pricing" className="text-sm text-gray-400 hover:text-white transition-colors">{t.footer.pricing}</a></li>
              <li><a href="#themes" className="text-sm text-gray-400 hover:text-white transition-colors">{t.footer.themes}</a></li>
              <li><a href="https://demo.liwamenu.com/?tableNumber=Masa-46" className="text-sm text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">{t.hero.secondary}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">{t.footer.resources}</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://forum.liwasoft.com/t/yeni-urun-qr-menu-tv-menu-kiosk-menu/2449/1"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <LifeBuoy className="w-4 h-4" />
                  {t.footer.support}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">{t.footer.company}</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:support@liwasoft.com"
                  className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  {t.footer.contact}
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/908508407807"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  {t.footer.wpContact}
                </a>
              </li>
              <li>
                <button
                  onClick={() => setTermsOpen(true)}
                  className="text-sm text-gray-400 hover:text-white transition-colors text-left cursor-pointer"
                >
                  {t.footer.terms}
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 text-center">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} LiwaMenu. {t.footer.rights}
          </p>
        </div>

        <div className="sr-only" aria-hidden="true">
          <h2>Restoran Yazılımı &amp; QR Menü Sistemleri</h2>
          <p>LiwaMenu; restoranlar, kafeler, barlar ve fast food işletmeleri için tasarlanmış kapsamlı bir dijital menü, QR menü sistemi ve sipariş yönetim platformudur. 30+ profesyonel tema, 11 dil desteği, masa siparişi, online sipariş, paket servis siparişi, WhatsApp siparişi, rezervasyon sistemi, garson çağırma, alerjen filtre, çoklu ödeme yöntemi, kampanya yönetimi, Google yorum bağlantısı ve POS entegrasyonu sunar.</p>
          <h3>Ana Temalar / Main Topics</h3>
          <ul>
            <li>Restoran Yazılımı - Restaurant Software</li>
            <li>QR Menü Sistemi - QR Menu System</li>
            <li>Dijital Menü - Digital Menu</li>
            <li>Temassız Yemek - Contactless Dining</li>
            <li>Masa Sipariş - Table Ordering</li>
            <li>Restoran Teknoloji - Restaurant Tech</li>
            <li>Gıda Yazılımı - F&amp;B Software</li>
            <li>POS Entegrasyonu - POS Integration</li>
            <li>Online Sipariş - Online Ordering</li>
            <li>Akıllı Menü - Smart Menu</li>
          </ul>
          <h3>Özellik Odaklı / Feature Focused</h3>
          <ul>
            <li>Mobil Sipariş - Mobile Ordering</li>
            <li>QR Kod Restoran - QR Code Restaurant</li>
            <li>Kendi Sipariş - Self Ordering Kiosk</li>
            <li>Restoran Yönetimi - Restaurant Management</li>
            <li>Stok Takibi - Inventory Tracking</li>
            <li>Garson Uygulaması - Waiter App</li>
            <li>Mutfak Ekranı - Kitchen Display System</li>
            <li>Ödeme Sistemi - Payment Gateway</li>
            <li>Çok Dilli Menü - Multi Language Menu</li>
            <li>Alerjen Filtre - Allergy Filter</li>
          </ul>
          <h3>Hedef Kitle / Target Audience</h3>
          <ul>
            <li>Restoran Sahibi - Restaurant Owner</li>
            <li>Kafe POS - Cafe POS</li>
            <li>Bar Yönetimi - Bar Management</li>
            <li>Fast Food Teknoloji - Fast Food Tech</li>
            <li>Lüks Restoran Yazılım - Fine Dining Software</li>
            <li>Bulut Restoran - Cloud Restaurant</li>
            <li>Restoran SaaS - SaaS For Restaurants</li>
            <li>Rezervasyon Sistemi - Table Reservation</li>
            <li>Hesap Paylaşım - Bill Splitting</li>
            <li>Sadakat Programı - Loyalty Program</li>
          </ul>
          <h3>Teknik / Altyapı / Technical / Infrastructure</h3>
          <ul>
            <li>API Uyumlu - API Ready</li>
            <li>Çevrimdışı Mod - Offline Mode</li>
            <li>Anlık Analiz - Real Time Analytics</li>
            <li>Çoklu Şube - Multi Branch</li>
            <li>Tedarikçi Yönetimi - Vendor Management</li>
            <li>Dinamik Fiyat - Dynamic Pricing</li>
            <li>QR Oluşturucu - QR Generator</li>
            <li>Oku Sipariş Ver - Scan To Order</li>
            <li>Kağıtsız Menü - Paperless Menu</li>
            <li>Çevre Dostu Yemek - Eco Friendly Dining</li>
            <li>SambaPOS, Akınsoft, RobotPOS, YemekPos alternatifi</li>
          </ul>
        </div>
      </div>

      <AnimatePresence>
        {termsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setTermsOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="terms-title"
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.97 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-gray-100">
                <h3 id="terms-title" className="text-lg md:text-xl font-extrabold text-gray-900">
                  {t.footer.termsModal.title}
                </h3>
                <button
                  onClick={() => setTermsOpen(false)}
                  aria-label={t.footer.termsModal.close}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto px-6 md:px-8 py-6 space-y-5">
                <p className="text-sm text-gray-500 italic leading-relaxed">
                  {t.footer.termsModal.intro}
                </p>
                {t.footer.termsModal.sections.map((s: any, i: number) => (
                  <div key={i} className="space-y-2">
                    <h4 className="text-sm font-bold text-indigo-700">{s.title}</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">{s.body}</p>
                  </div>
                ))}
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-700 leading-relaxed">
                    {t.footer.termsModal.footer}
                  </p>
                </div>
              </div>

              <div className="px-6 md:px-8 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                <button
                  onClick={() => setTermsOpen(false)}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {t.footer.termsModal.close}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </footer>
  )
}
