export type Lang = 'tr' | 'en' | 'az' | 'es' | 'el' | 'it' | 'ar' | 'ru' | 'bg' | 'fr'

const translations = {
  tr: {
    nav: {
      features: 'Özellikler',
      themes: 'Temalar',
      howItWorks: 'Nasıl Çalışır',
      pricing: 'Fiyatlandırma',
      contact: 'İletişim',
      startFree: 'Ücretsiz Başla',
      login: 'Yönetim Paneli',
    },
    hero: {
      title1: 'Siparişleri Hızlandırın,',
      titleHighlight: 'Restoranınızı Dijitalleştirin',
      title2: '',
      subtitle: 'QR kod ile müşterileriniz masalarından menünüze anında ulaşsın.',
      cta: 'Hemen Başla',
      secondary: 'Demo İncele',
      scanText: 'Tarayın ve deneyin!',
    },
    stats: {
      themes: 'Profesyonel Tema',
      languages: 'Dil Desteği',
      features: 'Üstün Özellik',
      uptime: 'Kesintisiz Hizmet',
    },
    benefits: {
      label: 'NEDEN LİWAMENU?',
      title: 'Restoranınızı dijital çağa taşıyın',
      subtitle: 'Tek bir platformda ihtiyacınız olan her şey',
      cards: [
        { title: 'Daha Fazla Müşteri', desc: 'Profesyonel dijital menü ile müşterilerinizi etkileyin. Google görünürlüğünüzü artırın.' },
        { title: 'Kolay Güncelleme', desc: 'Oransal veya sabit tutar yazarak dilediğiniz kategorilere tek hamlede fiyat güncellemesi yapın.' },
        { title: 'Daha Fazla Sipariş Alın', desc: 'Müşterileriniz dilerse menü üzerinden siparişlerini kendileri verebilir. Bu sayede sipariş süreci hızlanır, müşteriler beklemeden kolayca sipariş oluşturabilir ve servis yoğunluğu azalır. Daha az personel ile daha verimli hizmet sunabilir, daha fazla sipariş alarak işletmenizin gelirini artırabilirsiniz.' },
        { title: 'Kendi Sitenizde Yayınlayın', desc: 'Hazır iframe kodları ile dilerseniz menüyü kendi sitenizde yayınlayabilirsiniz.' },
        { title: 'Rezervasyon Sistemi', desc: 'Müşterileriniz online rezervasyon yapsın. SMS doğrulama ile sahte rezervasyon önlenmektedir. Rezervasyon seçenekleri çalışma günü ve saatleri ile uyumludur.' },
        { title: 'Google Yorum Bağlantısı', desc: 'Google işletme profilinizi ve yorum linkinizi paylaşarak Google görünürlüğünüzü artırın.' },
      ],
    },
    features: {
      label: 'ÖZELLİKLER',
      title: 'Her ihtiyaca cevap veren kapsamlı özellikler',
      subtitle: 'Restoranınızı dijitalleştirmek için gereken tüm araçlar tek bir platformda',
      items: [
        {
          title: '30+ Profesyonel Tema',
          desc: 'Her biri özenle tasarlanmış 30+ farklı tema. Fine dining\'den fast food\'a, cafe\'den sushi restoranına kadar her konsepte uygun tasarım.',
          icon: 'palette',
        },
        {
          title: '11 Dil Desteği',
          desc: 'Türkçe, İngilizce, Almanca, Fransızca, İtalyanca, İspanyolca, Arapça (RTL), Azerice, Rusça, Yunanca ve Çince desteği.',
          icon: 'languages',
        },
        {
          title: 'QR Kod ile Anında Erişim',
          desc: 'Müşterileriniz masadaki QR kodu tarayarak menünüze anında ulaşır. Uygulama indirmeye gerek yok.',
          icon: 'qrcode',
        },
        {
          title: 'Online Sipariş & Sepet',
          desc: 'Porsiyon seçenekleri, eklentiler, özel notlar ve fiyat hesaplaması ile tam donanımlı sipariş sistemi.',
          icon: 'cart',
        },
        {
          title: 'Rezervasyon Sistemi',
          desc: 'Tarih, saat ve kişi sayısı ile online rezervasyon. SMS doğrulama kodu ve onay makbuzu.',
          icon: 'calendar',
        },
        {
          title: 'Garson Çağırma',
          desc: 'Tek dokunuşla garson çağırma. Sebep belirtme ve spam koruması ile profesyonel hizmet.',
          icon: 'bell',
        },
        {
          title: 'Alerjen Bilgileri',
          desc: 'Türk Gıda Kodeksine göre 14 temel alerjen bildirimi. "İçerir" ve "İçerebilir" ayrımı ile yasal uyumluluk.',
          icon: 'shield',
        },
        {
          title: 'Müşteri Anket Sistemi',
          desc: 'Yemek, hizmet, ambiyans gibi kategorilerde yıldız puanlama ve geri bildirim toplama.',
          icon: 'star',
        },
        {
          title: 'Kampanya & İndirimler',
          desc: 'Ürün bazlı kampanya fiyatları, masa/online ayrı indirim oranları ve özel fiyatlandırma.',
          icon: 'discount',
        },
        {
          title: 'Konum Kontrollü Aksiyonlar',
          desc: 'Garson çağrısı ve siparişler restoran konumuna göre doğrulanır. Konum dışı işlemlere izin verilmez.',
          icon: 'location',
        },
        {
          title: 'Sosyal Medya Entegrasyonu',
          desc: 'Instagram, Facebook, TikTok, YouTube ve WhatsApp bağlantıları ile müşteri erişimi.',
          icon: 'social',
        },
        {
          title: 'Paket Servis Siparişi',
          desc: 'Müşterileriniz paket servis siparişi verebilir. Adres, telefon ve özel notlarla kolay teslimat. Müşteri konumu siparişle birlikte restorana iletilmektedir.',
          icon: 'truck',
        },
        {
          title: 'WhatsApp Siparişi',
          desc: 'Tek tıkla WhatsApp üzerinden sipariş gönderme. Hızlı, kolay ve doğrudan iletişim. Müşteri konumu siparişle birlikte restorana iletilmektedir.',
          icon: 'whatsapp',
        },
        {
          title: 'Özel Gün Duyuruları',
          desc: 'Bayram, doğum günü ve özel etkinlikler için müşterilerinize özelleştirilmiş duyurular gösterin.',
          icon: 'megaphone',
        },
        {
          title: 'Gün & Saat Bazlı Menü',
          desc: 'Kahvaltı, öğle ve akşam menülerini saat aralıklarına göre otomatik gösterin. Çalışma saatlerine uygun.',
          icon: 'clock',
        },
        {
          title: 'Google Yorum Bağlantısı',
          desc: 'Google işletme profilinizi ve yorum linkinizi paylaşarak Google görünürlüğünüzü artırın.',
          icon: 'google',
        },
      ],
    },
    themes: {
      label: 'TEMALAR',
      title: '30+ profesyonel tema ile restoranınıza özel tasarım',
      subtitle: 'Her tema mobil uyumlu, hızlı ve tüm özellikleri destekler. Fine dining\'den fast food\'a her konsepte uygun.',
      cta: 'Tüm Temaları İncele',
    },
    featureDetails: [
      {
        label: 'SİPARİŞ SİSTEMİ',
        title: 'Masadan veya online, sipariş artık çok kolay',
        desc: 'Müşterileriniz menüden porsiyon seçimi yapabilir, eklentiler ekleyebilir, özel isteklerini yazabilir ve sepete ekleyebilir. Masa siparişi ve online teslimat seçenekleri, farklı indirim oranları ve ödeme yöntemleri ile tam bir sipariş deneyimi.',
        bullets: ['Porsiyon ve eklenti seçimi', 'Sepet yönetimi', 'Masa & online sipariş', 'Anlık fiyat hesaplama', 'Müşteri ve Restoran konumuna göre sipariş kabulü', 'WhatsApp üzerinden sipariş alma', 'Kuryeye bahşiş bırakma', 'Müşteri konumunu siparişe ekleme', 'Opsiyonel sepette indirim özelliği'],
      },
      {
        label: 'REZERVASYON',
        title: 'Online rezervasyon ile masanızı ayırın',
        desc: 'Müşterileriniz telefon aramadan online rezervasyon yapsın. Tarih seçimi, saat aralığı, kişi sayısı ve özel istekler belirtebilir. SMS doğrulama ile güvenli, onay makbuzu ile profesyonel.',
        bullets: ['Takvim ile tarih seçimi', 'Esnek saat aralıkları', 'SMS doğrulama kodu', 'Yazdırılabilir onay makbuzu', 'Restoran çalışma saatleri ile uyumlu', 'Rezervasyon limiti belirleme'],
      },
      {
        label: 'ÇOK DİLLİ MENÜ',
        title: 'Dil engeli olmadan global müşteriye ulaşın',
        desc: '11 dilde menü sunarak yabancı misafirlerinize kendi dillerinde hizmet verin. Arapça için sağdan sola (RTL) tam destek. Tarayıcı dili otomatik algılama ve kolay dil değiştirme.',
        bullets: ['11 dil desteği', 'Arapça RTL desteği', 'Otomatik dil algılama', 'Tek tıkla dil değiştirme'],
      },
    ],
    howItWorks: {
      label: 'NASIL ÇALIŞIR',
      title: '3 adımda dijital menünüz hazır',
      steps: [
        { title: 'Kaydolun', desc: 'Ücretsiz hesap oluşturun ve restoranınızı tanımlayın.' },
        { title: 'Menünüzü Oluşturun', desc: 'Ürünlerinizi, fotoğrafları ve fiyatları ekleyin. Temanızı seçin.' },
        { title: 'QR Kodunuzu Paylaşın', desc: 'Masalarınıza QR kodu yerleştirin. Müşterileriniz tarayarak menüye ulaşsın.' },
      ],
    },
    pricing: {
      label: 'FİYATLANDIRMA',
      title: 'Şeffaf ve sade fiyatlandırma',
      subtitle: 'Tek paket. Tüm modüller, tüm özellikler dahil. Gizli ücret yok.',
      period: 'Yıllık',
      price: '5.500 ₺',
      currency: '₺',
      note: 'Tüm Özellikler fiyata Dahildir',
      features: [
        '30+ Profesyonel Tema',
        '11 Dil Desteği',
        'Sınırsız Online & Masa Sipariş',
        'Online Rezervasyon Sistemi',
        'Garson Çağırma',
        'WhatsApp & Paket Servis Siparişi',
        'Kampanya & İndirim Yönetimi',
        'Müşteri Anket Sistemi',
        'Konum Kontrollü Aksiyonlar',
        'Push Bildirimleri',
        '7/24 Teknik Destek',
        '30 Gün Para İade Garantisi',
      ],
      cta: 'Hemen Başla',
      secondary: 'Demo İncele',
      taxNote: 'Fiyatlara KDV dahildir.',
      refund: '30 Gün İade',
      support: '7/24 Destek',
      instant: 'Anında Aktif',
    },
    cta: {
      title: "LiwaMenu ile dijital menünüzü bugün alın!",
      subtitle: '30 gün para iade garantisi!',
      button: 'Hemen Başla',
    },
    footer: {
      product: 'Ürün',
      resources: 'Kaynaklar',
      company: 'Şirket',
      features: 'Özellikler',
      pricing: 'Fiyatlandırma',
      themes: 'Temalar',
      support: 'Destek',
      contact: 'İletişim',
      wpContact: 'WhatsApp İletişim',
      terms: 'Kullanım Şartları',
      rights: 'Tüm hakları saklıdır.',
      desc: 'Restoranlar için modern dijital menü çözümü. 30+ tema, 11 dil, tam sipariş yönetimi.',
      termsModal: {
        title: 'Kullanım Şartları',
        intro: 'LiwaMenu hizmetini kullanarak aşağıdaki şartları kabul etmiş sayılırsınız. Lütfen dikkatlice okuyunuz.',
        sections: [
          {
            title: '1. Yasal Kullanım',
            body: 'Müşteri, LiwaMenu platformunu yalnızca yasal ürün ve hizmet satışları için kullanmayı kabul eder. Yasalara aykırı içerik, ürün veya hizmet pazarlamak; sahte ürün, sağlığa zararlı ya da kaçak gıda satmak; lisanssız alkol veya tütün ürünü sunmak veya yürürlükteki mevzuata aykırı her türlü faaliyet kesinlikle yasaktır.',
          },
          {
            title: '2. Amaç Dışı Kullanım Yasağı',
            body: 'Sistem, restoran, kafe ve gıda işletmelerinin dijital menü, sipariş, rezervasyon ve müşteri etkileşim ihtiyaçları için tasarlanmıştır. Bu kapsam dışında kumar, çekiliş, kripto işlemleri, finansal aracılık veya kanunlara aykırı her türlü faaliyet için kullanılamaz. Tespit halinde sözleşme tek taraflı feshedilir.',
          },
          {
            title: '3. Hizmet Sürekliliği',
            body: 'LiwaMenu mümkün olan en yüksek erişilebilirlik oranını hedefler ve bunun için modern altyapı kullanır. Ancak bulut sağlayıcı kesintileri, üçüncü taraf bağımlılıkları (Firebase, SMS sağlayıcıları, ödeme sistemleri, internet servis sağlayıcıları vb.), planlı bakım pencereleri veya öngörülemeyen mücbir sebepler nedeniyle çok nadir de olsa sistemin geçici olarak çevrimdışı kalabileceği durumlar yaşanabilir.',
          },
          {
            title: '4. Sorumluluk Sınırı',
            body: 'Müşteri, olağanüstü bir kesinti veya teknik aksaklık sırasında oluşabilecek dolaylı veya doğrudan ticari kayıplardan, sipariş kaybından, rezervasyon iptalinden, kar kaybından veya itibar zararından Liwa Yazılım San. Tic. Ltd. Şirketi\'nin sorumlu tutulamayacağını kabul eder. Şirketimiz bu süreçte tazminat, geri ödeme veya başka bir mali yükümlülük altına girmez.',
          },
          {
            title: '5. Veri Güvenliği ve Hesap Sorumluluğu',
            body: 'Müşteri verileri SSL şifreleme ile korunur ve düzenli olarak yedeklenir. Hesap bilgileri (kullanıcı adı, şifre, API anahtarları) yalnızca yetkili kişilerle paylaşılmalıdır. Yetkisiz erişim veya hesap kötüye kullanımı sonucu doğan tüm zararlardan hesap sahibi sorumludur.',
          },
          {
            title: '6. Fikri Mülkiyet',
            body: 'LiwaMenu platformu, kaynak kodları, tasarımları, logoları ve tüm görsel ögeleri Liwa Yazılım San. Tic. Ltd. Şirketi\'nin fikri mülkiyetidir. İzinsiz çoğaltılamaz, dağıtılamaz veya türev çalışmalarda kullanılamaz.',
          },
          {
            title: '7. Şartların Güncellenmesi',
            body: 'Liwa Yazılım San. Tic. Ltd. Şirketi, işbu kullanım şartlarını önceden bildirim yapmaksızın güncelleme hakkını saklı tutar. Güncellenmiş şartlar, web sitesinde yayımlandığı tarihte yürürlüğe girer ve hizmeti kullanmaya devam eden müşteri yeni şartları kabul etmiş sayılır.',
          },
        ],
        footer: 'Bu sözleşmeyi onaylayarak LiwaMenu hizmetini yukarıdaki şartlar çerçevesinde kullanacağınızı kabul etmiş olursunuz.',
        close: 'Kapat',
      },
    },
  },
  en: {
    nav: {
      features: 'Features',
      themes: 'Themes',
      howItWorks: 'How It Works',
      pricing: 'Pricing',
      contact: 'Contact',
      startFree: 'Start Free',
      login: 'Admin Panel',
    },
    hero: {
      title1: 'Accelerate Orders,',
      titleHighlight: 'Digitalize Your Restaurant',
      title2: '',
      subtitle: 'Let your customers instantly access your menu via QR code. 30+ professional themes, 11 languages, and full order management.',
      cta: 'Get Started',
      secondary: 'View Demo',
      scanText: 'Scan & try it!',
    },
    stats: {
      themes: 'Professional Themes',
      languages: 'Languages',
      features: 'Premium Features',
      uptime: 'Uptime',
    },
    benefits: {
      label: 'WHY LIWAMENU?',
      title: 'Bring your restaurant to the digital age',
      subtitle: 'Everything you need in a single platform',
      cards: [
        { title: 'More Customers', desc: 'Impress your customers with a professional digital menu. Boost your Google visibility.' },
        { title: 'Easy Updates', desc: 'Update prices for any category in one move by entering a percentage or fixed amount.' },
        { title: 'Take More Orders', desc: 'Your customers can place their own orders right from the menu. This speeds up the ordering process, lets guests order easily without waiting, and eases service load. You serve more efficiently with fewer staff and grow your revenue by taking more orders.' },
        { title: 'Publish On Your Website', desc: 'Embed your menu on your own website with ready-to-use iframe codes.' },
        { title: 'Reservation System', desc: 'Let customers make online reservations. Email verification prevents fake reservations. Reservation options align with your working days and hours.' },
        { title: 'Google Review Link', desc: 'Share your Google business profile and review link to boost your Google visibility.' },
      ],
    },
    features: {
      label: 'FEATURES',
      title: 'Comprehensive features for every need',
      subtitle: 'All the tools you need to digitize your restaurant in one platform',
      items: [
        {
          title: '30+ Professional Themes',
          desc: '30+ carefully designed themes. From fine dining to fast food, from cafes to sushi restaurants — a design for every concept.',
          icon: 'palette',
        },
        {
          title: '11 Language Support',
          desc: 'Turkish, English, German, French, Italian, Spanish, Arabic (RTL), Azerbaijani, Russian, Greek and Chinese support.',
          icon: 'languages',
        },
        {
          title: 'Instant QR Code Access',
          desc: 'Customers scan the QR code at the table to instantly access your menu. No app download needed.',
          icon: 'qrcode',
        },
        {
          title: 'Online Order & Cart',
          desc: 'Full-featured ordering with portion options, add-ons, special notes, and price calculation.',
          icon: 'cart',
        },
        {
          title: 'Reservation System',
          desc: 'Online reservation with date, time and guest count. Email verification code and confirmation receipt.',
          icon: 'calendar',
        },
        {
          title: 'Call Waiter',
          desc: 'Call waiter with one touch. Professional service with reason specification and spam protection.',
          icon: 'bell',
        },
        {
          title: 'Allergen Information',
          desc: 'EU 14 major allergen declarations. Legal compliance with "Contains" and "May Contain" distinction.',
          icon: 'shield',
        },
        {
          title: 'Customer Surveys',
          desc: 'Star ratings for food, service, ambiance and more. Collect valuable feedback.',
          icon: 'star',
        },
        {
          title: 'Campaigns & Discounts',
          desc: 'Product-level campaign pricing, separate table/online discount rates and special pricing.',
          icon: 'discount',
        },
        {
          title: 'Location-Verified Actions',
          desc: 'Waiter calls and orders are verified by restaurant location. Off-site actions are not permitted.',
          icon: 'location',
        },
        {
          title: 'Social Media Integration',
          desc: 'Instagram, Facebook, TikTok, YouTube and WhatsApp links for customer reach.',
          icon: 'social',
        },
        {
          title: 'Takeaway Orders',
          desc: 'Customers can place takeaway orders with delivery address, phone and special notes for easy delivery. Customer location is sent to the restaurant along with the order.',
          icon: 'truck',
        },
        {
          title: 'WhatsApp Ordering',
          desc: 'Send orders via WhatsApp with a single tap. Fast, easy and direct communication. Customer location is sent to the restaurant along with the order.',
          icon: 'whatsapp',
        },
        {
          title: 'Special Day Announcements',
          desc: 'Display customized announcements for holidays, birthdays and special events to your customers.',
          icon: 'megaphone',
        },
        {
          title: 'Time-based Menu',
          desc: 'Show breakfast, lunch and dinner menus automatically based on time of day. Adapts to working hours.',
          icon: 'clock',
        },
        {
          title: 'Google Review Link',
          desc: 'Share your Google business profile and review link to boost your Google visibility.',
          icon: 'google',
        },
      ],
    },
    themes: {
      label: 'THEMES',
      title: '30+ professional themes designed for your restaurant',
      subtitle: 'Every theme is mobile-friendly, fast and supports all features. From fine dining to fast food — suitable for every concept.',
      cta: 'Explore All Themes',
    },
    featureDetails: [
      {
        label: 'ORDER SYSTEM',
        title: 'From table or online, ordering is now effortless',
        desc: 'Customers can select portions, add extras, write special requests and add to cart. Table ordering and online delivery options, different discount rates and payment methods for a complete ordering experience.',
        bullets: ['Portion & add-on selection', 'Cart management', 'Table & online orders', 'Real-time price calculation', 'Location-based order acceptance', 'Order taking via WhatsApp', 'Courier tipping', 'Add customer location to order', 'Optional cart discount feature'],
      },
      {
        label: 'RESERVATIONS',
        title: 'Book your table with online reservations',
        desc: 'Customers can make reservations online without calling. Select date, time slot, guest count and special requests. Secure with email verification, professional with confirmation receipt.',
        bullets: ['Calendar date picker', 'Flexible time slots', 'Email verification code', 'Printable confirmation receipt', 'Aligned with restaurant working hours', 'Reservation limit settings'],
      },
      {
        label: 'MULTILINGUAL MENU',
        title: 'Reach global customers without language barriers',
        desc: 'Serve foreign guests in their own language with menus in 11 languages. Full right-to-left (RTL) support for Arabic. Automatic browser language detection and easy language switching.',
        bullets: ['11 language support', 'Arabic RTL support', 'Auto language detection', 'One-click language switch'],
      },
    ],
    howItWorks: {
      label: 'HOW IT WORKS',
      title: 'Your digital menu ready in 3 steps',
      steps: [
        { title: 'Sign Up', desc: 'Create a free account and define your restaurant.' },
        { title: 'Build Your Menu', desc: 'Add your products, photos and prices. Choose your theme.' },
        { title: 'Share Your QR Code', desc: 'Place QR codes on your tables. Customers scan to access the menu.' },
      ],
    },
    pricing: {
      label: 'PRICING',
      title: 'Transparent and simple pricing',
      subtitle: 'One package. All modules, all features included. No hidden fees.',
      period: 'Yearly',
      price: '$120',
      currency: '$',
      note: 'All Features Included in the Price',
      features: [
        '30+ Professional Themes',
        '11 Language Support',
        'Unlimited Online & Table Orders',
        'Online Reservation System',
        'Waiter Call',
        'WhatsApp & Takeaway Orders',
        'Campaign & Discount Management',
        'Customer Survey System',
        'Location-Verified Actions',
        'Push Notifications',
        '24/7 Technical Support',
        '30-Day Money-Back Guarantee',
      ],
      cta: 'Get Started',
      secondary: 'View Demo',
      taxNote: 'Tax included.',
      refund: '30-Day Refund',
      support: '24/7 Support',
      instant: 'Instant Activation',
    },
    cta: {
      title: 'Get your digital menu with LiwaMenu today!',
      subtitle: '30-day money-back guarantee!',
      button: 'Get Started',
    },
    footer: {
      product: 'Product',
      resources: 'Resources',
      company: 'Company',
      features: 'Features',
      pricing: 'Pricing',
      themes: 'Themes',
      support: 'Support',
      contact: 'Contact',
      wpContact: 'WhatsApp Contact',
      terms: 'Terms of Service',
      rights: 'All rights reserved.',
      desc: 'Modern digital menu solution for restaurants. 30+ themes, 11 languages, full order management.',
      termsModal: {
        title: 'Terms of Service',
        intro: 'By using LiwaMenu services, you agree to the terms below. Please read carefully.',
        sections: [
          {
            title: '1. Lawful Use',
            body: 'Customer agrees to use the LiwaMenu platform only for lawful sales of products and services. It is strictly prohibited to market illegal content, products or services; sell counterfeit, unsafe or smuggled food items; offer unlicensed alcohol or tobacco products; or engage in any activity that violates applicable laws.',
          },
          {
            title: '2. Prohibition of Off-Purpose Use',
            body: 'The system is designed for the digital menu, ordering, reservation and customer engagement needs of restaurants, cafes and food businesses. It cannot be used for gambling, lotteries, cryptocurrency transactions, financial intermediation or any unlawful activity. In case of detection, the contract may be terminated unilaterally.',
          },
          {
            title: '3. Service Continuity',
            body: 'LiwaMenu targets the highest possible availability using modern infrastructure. However, due to cloud provider outages, third-party dependencies (Firebase, SMS providers, payment systems, ISPs, etc.), scheduled maintenance windows or unforeseen force majeure events, the system may rarely experience temporary offline periods.',
          },
          {
            title: '4. Limitation of Liability',
            body: 'Customer acknowledges that Liwa Yazılım San. Tic. Ltd. Şirketi shall not be held responsible for any direct or indirect commercial losses, lost orders, cancelled reservations, lost profits or reputational damage that may occur during extraordinary outages or technical disruptions. Our company assumes no compensation, refund or other financial liability during such periods.',
          },
          {
            title: '5. Data Security and Account Responsibility',
            body: 'Customer data is protected with SSL encryption and regularly backed up. Account credentials (username, password, API keys) must only be shared with authorized personnel. All damages arising from unauthorized access or account misuse are the responsibility of the account holder.',
          },
          {
            title: '6. Intellectual Property',
            body: 'The LiwaMenu platform, source code, designs, logos and all visual elements are the intellectual property of Liwa Yazılım San. Tic. Ltd. Şirketi. They cannot be copied, distributed or used in derivative works without permission.',
          },
          {
            title: '7. Updates to Terms',
            body: 'Liwa Yazılım San. Tic. Ltd. Şirketi reserves the right to update these terms of service without prior notice. Updated terms take effect on the date of publication on the website, and customers who continue to use the service are deemed to have accepted the new terms.',
          },
        ],
        footer: 'By accepting this agreement, you agree to use LiwaMenu services within the framework of the above terms.',
        close: 'Close',
      },
    },
  },
  az: {
    "nav": {
      "features": "Xüsusiyyətlər",
      "themes": "Mövzular",
      "howItWorks": "Necə İşləyir",
      "pricing": "Qiymətlər",
      "contact": "Əlaqə",
      "startFree": "Pulsuz Başla",
      "login": "İdarə Paneli"
    },
    "hero": {
      "title1": "Sifarişləri Sürətləndirin,",
      "titleHighlight": "Restoranınızı Rəqəmsallaşdırın",
      "title2": "",
      "subtitle": "Müştəriləriniz QR kod vasitəsilə menyunuza anında çıxış əldə etsin. 30+ peşəkar mövzu, 11 dil və tam sifariş idarəetməsi.",
      "cta": "İndi Başla",
      "secondary": "Demonu Gör",
      "scanText": "Skan edin və sınayın!"
    },
    "stats": {
      "themes": "Peşəkar Mövzu",
      "languages": "Dil Dəstəyi",
      "features": "Premium Xüsusiyyət",
      "uptime": "Fasiləsiz Xidmət"
    },
    "benefits": {
      "label": "NİYƏ LIWAMENU?",
      "title": "Restoranınızı rəqəmsal dövrə aparın",
      "subtitle": "Tək platformada ehtiyacınız olan hər şey",
      "cards": [
        {
          "title": "Daha Çox Müştəri",
          "desc": "Peşəkar rəqəmsal menyu ilə müştərilərinizi heyran edin. Google görünürlüyünüzü artırın."
        },
        {
          "title": "Asan Yeniləmə",
          "desc": "Faiz və ya sabit məbləğ daxil edərək istənilən kateqoriyada qiymətləri bir anda yeniləyin."
        },
        {
          "title": "Daha Çox Sifariş Alın",
          "desc": "Müştəriləriniz menyu üzərindən öz sifarişlərini özləri verə bilər. Bu, sifariş prosesini sürətləndirir, qonaqların gözləmədən asanlıqla sifariş verməsinə imkan yaradır və xidmət yükünü azaldır. Daha az işçi ilə daha səmərəli xidmət göstərir, daha çox sifariş alaraq gəlirinizi artırırsınız."
        },
        {
          "title": "Öz Saytınızda Yayımlayın",
          "desc": "Hazır iframe kodları ilə menyunu öz saytınızda asanlıqla yayımlayın."
        },
        {
          "title": "Rezervasiya Sistemi",
          "desc": "Müştəriləriniz onlayn rezervasiya etsin. E-poçt doğrulaması saxta rezervasiyaların qarşısını alır. Rezervasiya seçimləri iş günləriniz və saatlarınıza uyğunlaşdırılır."
        },
        {
          "title": "Google Rəy Linki",
          "desc": "Google biznes profilinizi və rəy linkini paylaşaraq Google görünürlüyünüzü artırın."
        }
      ]
    },
    "features": {
      "label": "XÜSUSİYYƏTLƏR",
      "title": "Hər ehtiyaca cavab verən geniş xüsusiyyətlər",
      "subtitle": "Restoranınızı rəqəmsallaşdırmaq üçün lazım olan bütün alətlər tək platformada",
      "items": [
        {
          "title": "30+ Peşəkar Tema",
          "desc": "Hər biri diqqətlə hazırlanmış 30+ müxtəlif tema. Fine dining-dən fast food-a, kafelərdən suşi restoranlarına qədər hər konsepsiyaya uyğun dizayn.",
          "icon": "palette"
        },
        {
          "title": "11 Dil Dəstəyi",
          "desc": "Türk, İngilis, Alman, Fransız, İtalyan, İspan, Ərəb (RTL), Azərbaycan, Rus, Yunan və Çin dili dəstəyi.",
          "icon": "languages"
        },
        {
          "title": "QR Kod ilə Ani Giriş",
          "desc": "Müştərilər masadakı QR kodu skan edərək menyunuza dərhal daxil olur. Tətbiq yükləməyə ehtiyac yoxdur.",
          "icon": "qrcode"
        },
        {
          "title": "Onlayn Sifariş & Səbət",
          "desc": "Porsiya seçimləri, əlavələr, xüsusi qeydlər və qiymət hesablaması ilə tam funksional sifariş sistemi.",
          "icon": "cart"
        },
        {
          "title": "Rezervasiya Sistemi",
          "desc": "Tarix, saat və qonaq sayı ilə onlayn rezervasiya. E-poçt doğrulama kodu və təsdiq qəbzi.",
          "icon": "calendar"
        },
        {
          "title": "Ofisiant Çağırışı",
          "desc": "Bir toxunuşla ofisiant çağırın. Səbəb göstərimi və spam qoruması ilə peşəkar xidmət.",
          "icon": "bell"
        },
        {
          "title": "Allergen Məlumatları",
          "desc": "AB-nin 14 əsas allergen bəyannaməsi. «İçərir» və «İçərə bilər» fərqi ilə qanuni uyğunluq.",
          "icon": "shield"
        },
        {
          "title": "Müştəri Sorğuları",
          "desc": "Yemək, xidmət, mühit və digər kateqoriyalarda ulduz reytinqi. Dəyərli rəylər toplayın.",
          "icon": "star"
        },
        {
          "title": "Kampaniyalar & Endirimler",
          "desc": "Məhsul bazlı kampaniya qiymətləri, masa/onlayn ayrı endirim dərəcələri və xüsusi qiymətləndirmə.",
          "icon": "discount"
        },
        {
          "title": "Məkana Bağlı Əməliyyatlar",
          "desc": "Ofisiant çağırışları və sifarişlər restoran məkanına görə yoxlanılır. Məkandan kənar əməliyyatlara icazə verilmir.",
          "icon": "location"
        },
        {
          "title": "Sosial Media İnteqrasiyası",
          "desc": "Instagram, Facebook, TikTok, YouTube və WhatsApp bağlantıları ilə müştəri əlçatanlığı.",
          "icon": "social"
        },
        {
          "title": "Evə Çatdırılma Sifarişi",
          "desc": "Müştərilər çatdırılma ünvanı, telefon nömrəsi və xüsusi qeydlərlə evə sifariş verə bilər. Müştərinin məkanı sifarişlə birlikdə restorana ötürülür.",
          "icon": "truck"
        },
        {
          "title": "WhatsApp Sifarişi",
          "desc": "Bir toxunuşla WhatsApp üzərindən sifariş göndərin. Sürətli, asan və birbaşa ünsiyyət. Müştərinin məkanı sifarişlə birlikdə restorana ötürülür.",
          "icon": "whatsapp"
        },
        {
          "title": "Xüsusi Gün Elanları",
          "desc": "Bayramlar, ad günləri və xüsusi tədbirlər üçün müştərilərinizə fərdiləşdirilmiş elanlar göstərin.",
          "icon": "megaphone"
        },
        {
          "title": "Vaxta Görə Menyu",
          "desc": "Səhər yeməyi, nahar və şam menyularını gün ərzindəki saata görə avtomatik göstərin. İş saatlərinə uyğunlaşır.",
          "icon": "clock"
        },
        {
          "title": "Google Rəy Linki",
          "desc": "Google biznes profilinizi və rəy linkini paylaşaraq Google-da görünürlüyünüzü artırın.",
          "icon": "google"
        }
      ]
    },
    "themes": {
      "label": "TEMALAR",
      "title": "Restoranınız üçün hazırlanmış 30+ peşəkar tema",
      "subtitle": "Hər tema mobil uyğun, sürətli və bütün funksiyaları dəstəkləyir. Fine dining-dən fast food-a qədər — hər konsepsiyaya uyğundur.",
      "cta": "Bütün Temaları Kəşf Et"
    },
    "featureDetails": [
      {
        "label": "SİFARİŞ SİSTEMİ",
        "title": "Masadan və ya onlayn — sifariş etmək indi çox asandır",
        "desc": "Müştərilər porsion seçə, əlavələr əlavə edə, xüsusi istəklər yaza və səbətə əlavə edə bilər. Masa sifarişi və onlayn çatdırılma seçimləri, müxtəlif endirim nisbətləri və ödəniş üsulları ilə tam sifariş təcrübəsi.",
        "bullets": [
          "Porsion və əlavə seçimi",
          "Səbət idarəetməsi",
          "Masa və onlayn sifarişlər",
          "Anlıq qiymət hesablaması",
          "Yerə əsaslanan sifariş qəbulu",
          "WhatsApp vasitəsilə sifariş qəbulu",
          "Kuryer üçün bəxşiş",
          "Müştəri məkanını sifarişə əlavə et",
          "İstəyə bağlı səbət endirimi funksiyası"
        ]
      },
      {
        "label": "REZERVASİYA",
        "title": "Onlayn rezervasiya ilə masanızı ayırın",
        "desc": "Müştərilər zəng etmədən onlayn rezervasiya edə bilər. Tarix, zaman aralığı, qonaq sayı və xüsusi istəkləri seçə bilərlər. E-poçt doğrulaması ilə etibarlı, təsdiq qəbzi ilə peşəkardır.",
        "bullets": [
          "Təqvim ilə tarix seçimi",
          "Çevik zaman aralıqları",
          "E-poçt doğrulama kodu",
          "Çap edilə bilən təsdiq qəbzi",
          "Restoranın iş saatları ilə uyğunlaşdırılmış",
          "Rezervasiya limiti tənzimləməsi"
        ]
      },
      {
        "label": "ÇOXDİLLİ MENYU",
        "title": "Dil maneəsiz qlobal müştərilərə çatın",
        "desc": "11 dildə menyu ilə xarici qonaqlarınıza öz dillərində xidmət edin. Ərəb dili üçün tam sağdan-sola (RTL) dəstəyi. Brauzerin dilini avtomatik aşkarlama və asan dil keçidi.",
        "bullets": [
          "11 dil dəstəyi",
          "Ərəbcə RTL dəstəyi",
          "Avtomatik dil aşkarlaması",
          "Bir kliklə dil keçidi"
        ]
      }
    ],
    "howItWorks": {
      "label": "NECƏ İŞLƏYİR",
      "title": "3 addımda rəqəmsal menyunuz hazırdır",
      "steps": [
        {
          "title": "Qeydiyyatdan Keçin",
          "desc": "Pulsuz hesab yaradın və restoranınızı müəyyənləşdirin."
        },
        {
          "title": "Menyunuzu Qurun",
          "desc": "Məhsullarınızı, şəkillərinizi və qiymətlərinizi əlavə edin. Temanızı seçin."
        },
        {
          "title": "QR Kodunuzu Paylaşın",
          "desc": "Masalarınıza QR kodu yerləşdirin. Müştərilər skan edərək menyuya daxil olsun."
        }
      ]
    },
    "pricing": {
      "label": "QİYMƏTLƏNDİRMƏ",
      "title": "Şəffaf və sadə qiymətləndirmə",
      "subtitle": "Bir paket. Bütün modullar, bütün funksiyalar daxildir. Gizli ödəniş yoxdur.",
      "period": "İllik",
      "price": "$120",
      "currency": "$",
      "note": "Bütün Xüsusiyyətlər Qiymətə Daxildir",
      "features": [
        "30+ Peşəkar Tema",
        "11 Dil Dəstəyi",
        "Limitsiz Onlayn & Masa Sifarişi",
        "Onlayn Rezervasiya Sistemi",
        "Ofisiant Çağırma",
        "WhatsApp & Paket Sifarişi",
        "Kampaniya & Endirim İdarəetməsi",
        "Müştəri Sorğu Sistemi",
        "Yerə Əsaslı Əməliyyatlar",
        "Push Bildirişlər",
        "7/24 Texniki Dəstək",
        "30 Günlük Pulun Geri Qaytarılması Zəmanəti"
      ],
      "cta": "İndi Başla",
      "secondary": "Demoya Bax",
      "taxNote": "Vergi daxildir.",
      "refund": "30 Günlük Geri Ödəmə",
      "support": "7/24 Dəstək",
      "instant": "Dərhal Aktivləşdir"
    },
    "cta": {
      "title": "LiwaMenu ilə rəqəmsal menyunuzu bu gün əldə edin!",
      "subtitle": "30 günlük pul geri qaytarılması zəmanəti!",
      "button": "İndi Başla"
    },
    "footer": {
      "product": "Məhsul",
      "resources": "Resurslar",
      "company": "Şirkət",
      "features": "Xüsusiyyətlər",
      "pricing": "Qiymətlər",
      "themes": "Temalar",
      "support": "Dəstək",
      "contact": "Əlaqə",
      "wpContact": "WhatsApp Əlaqə",
      "terms": "İstifadə Şərtləri",
      "rights": "Bütün hüquqlar qorunur.",
      "desc": "Restoranlar üçün müasir rəqəmsal menyu həlli. 30+ tema, 11 dil, tam sifariş idarəetməsi.",
      "termsModal": {
        "title": "İstifadə Şərtləri",
        "intro": "LiwaMenu xidmətindən istifadə edərək aşağıdakı şərtləri qəbul etmiş sayılırsınız. Lütfən diqqətlə oxuyun.",
        "sections": [
          {
            "title": "1. Qanuni İstifadə",
            "body": "Müştəri, LiwaMenu platformundan yalnız qanuni məhsul və xidmətlərin satışı üçün istifadə etməyi qəbul edir. Qeyri-qanuni məzmun, məhsul və ya xidmətlərin təbliği; saxta, sağlamlığa zərərli və ya qaçaqmalçılıqla gətirilmiş qida satışı; lisanssız spirt və ya tütün məhsullarının təklifi; yaxud mövcud qanunvericiliyi pozan hər hansı fəaliyyət qətiyyətlə qadağandır."
          },
          {
            "title": "2. Məqsəddən Kənar İstifadənin Qadağası",
            "body": "Sistem, restoran, kafe və qida müəssisələrinin rəqəmsal menyu, sifariş, rezervasiya və müştəri əlaqəsi ehtiyacları üçün nəzərdə tutulmuşdur. Kumar, lotereyalar, kriptovalyuta əməliyyatları, maliyyə vasitəçiliyi və ya qanunlara zidd hər hansı fəaliyyət üçün istifadə edilə bilməz. Aşkar edildiyi halda müqavilə birtərəfli qaydada ləğv edilə bilər."
          },
          {
            "title": "3. Xidmətin Davamlılığı",
            "body": "LiwaMenu müasir infrastrukturdan istifadə edərək mümkün olan ən yüksək əlçatanlığı hədəfləyir. Bununla belə, bulud provayderlərinin kəsilmələri, üçüncü tərəf asılılıqları (Firebase, SMS provayderləri, ödəniş sistemləri, internet provayderlər və s.), planlaşdırılmış texniki xidmət pəncərələri və ya gözlənilməz fors-major hadisələri səbəbindən sistemdə nadir hallarda müvəqqəti fasilələr yaşana bilər."
          },
          {
            "title": "4. Məsuliyyətin Məhdudlaşdırılması",
            "body": "Müştəri, fövqəladə kəsilmə və ya texniki nasazlıq zamanı yarana biləcək birbaşa və ya dolayı kommersiya zərərlərindən, sifarişlərin itirilməsindən, rezervasiyaların ləğvindən, mənfəətin itirilməsindən və ya nüfuz zərərindən Liwa Yazılım San. Tic. Ltd. Şirketi-nin məsul tutulmamasını qəbul edir. Şirkətimiz bu müddət ərzində kompensasiya, geri ödəmə və ya hər hansı digər maliyyə öhdəliyi daşımır."
          },
          {
            "title": "5. Məlumat Təhlükəsizliyi və Hesab Məsuliyyəti",
            "body": "Müştəri məlumatları SSL şifrələməsi ilə qorunur və müntəzəm olaraq ehtiyat nüsxəsi hazırlanır. Hesab məlumatları (istifadəçi adı, şifrə, API açarları) yalnız səlahiyyətli şəxslərlə paylaşılmalıdır. İcazəsiz giriş və ya hesabdan sui-istifadə nəticəsində yaranan bütün zərərlərə görə hesab sahibi məsuldur."
          },
          {
            "title": "6. Əqli Mülkiyyət",
            "body": "LiwaMenu platformu, mənbə kodları, dizaynları, loqoları və bütün vizual elementlər Liwa Yazılım San. Tic. Ltd. Şirketi-nin əqli mülkiyyətidir. İcazəsiz surətdə çoxaldıla, yayıla və ya törəmə əsərlərdə istifadə edilə bilməz."
          },
          {
            "title": "7. Şərtlərin Yenilənməsi",
            "body": "Liwa Yazılım San. Tic. Ltd. Şirketi bu istifadə şərtlərini əvvəlcədən bildiriş vermədən yeniləmək hüququnu özündə saxlayır. Yenilənmiş şərtlər veb saytda dərc edildiyi tarixdən etibarən qüvvəyə minir və xidmətdən istifadəyə davam edən müştəri yeni şərtləri qəbul etmiş sayılır."
          }
        ],
        "footer": "Bu razılaşmanı qəbul etməklə LiwaMenu xidmətlərindən yuxarıda göstərilən şərtlər çərçivəsində istifadə edəcəyinizi təsdiq etmiş olursunuz.",
        "close": "Bağla"
      }
    }
  },
  es: {
    "nav": {
      "features": "Características",
      "themes": "Temas",
      "howItWorks": "Cómo Funciona",
      "pricing": "Precios",
      "contact": "Contacto",
      "startFree": "Empieza Gratis",
      "login": "Panel de Administración"
    },
    "hero": {
      "title1": "Acelera los Pedidos,",
      "titleHighlight": "Digitaliza tu Restaurante",
      "title2": "",
      "subtitle": "Permite que tus clientes accedan al menú al instante con un código QR. Más de 30 temas profesionales, 11 idiomas y gestión completa de pedidos.",
      "cta": "Comenzar Ahora",
      "secondary": "Ver Demo",
      "scanText": "¡Escanea y pruébalo!"
    },
    "stats": {
      "themes": "Temas Profesionales",
      "languages": "Idiomas",
      "features": "Funciones Premium",
      "uptime": "Disponibilidad"
    },
    "benefits": {
      "label": "¿POR QUÉ LIWAMENU?",
      "title": "Lleva tu restaurante a la era digital",
      "subtitle": "Todo lo que necesitas en una sola plataforma",
      "cards": [
        {
          "title": "Más Clientes",
          "desc": "Impresiona a tus clientes con un menú digital profesional. Aumenta tu visibilidad en Google."
        },
        {
          "title": "Actualizaciones Sencillas",
          "desc": "Actualiza los precios de cualquier categoría en un solo paso introduciendo un porcentaje o una cantidad fija."
        },
        {
          "title": "Recibe Más Pedidos",
          "desc": "Tus clientes pueden hacer sus pedidos directamente desde el menú. Esto agiliza el proceso de pedido, permite a los comensales pedir sin esperar y reduce la carga del servicio. Atiende con mayor eficiencia con menos personal y aumenta tus ingresos recibiendo más pedidos."
        },
        {
          "title": "Publícalo en tu Web",
          "desc": "Integra tu menú en tu propio sitio web con códigos iframe listos para usar."
        },
        {
          "title": "Sistema de Reservas",
          "desc": "Permite que los clientes hagan reservas en línea. La verificación por correo electrónico evita reservas falsas. Las opciones de reserva se adaptan a tus días y horarios de trabajo."
        },
        {
          "title": "Enlace de Reseñas en Google",
          "desc": "Comparte tu perfil de empresa de Google y tu enlace de reseñas para aumentar tu visibilidad en Google."
        }
      ]
    },
    "features": {
      "label": "CARACTERÍSTICAS",
      "title": "Funciones completas para cada necesidad",
      "subtitle": "Todas las herramientas que necesitas para digitalizar tu restaurante en una sola plataforma",
      "items": [
        {
          "title": "Más de 30 Temas Profesionales",
          "desc": "Más de 30 temas diseñados con esmero. Desde restaurantes de alta cocina hasta comida rápida, desde cafeterías hasta restaurantes de sushi — un diseño para cada concepto.",
          "icon": "palette"
        },
        {
          "title": "Soporte en 11 Idiomas",
          "desc": "Compatible con turco, inglés, alemán, francés, italiano, español, árabe (RTL), azerí, ruso, griego y chino.",
          "icon": "languages"
        },
        {
          "title": "Acceso Instantáneo por QR",
          "desc": "Los clientes escanean el código QR en la mesa para acceder al menú al instante. Sin necesidad de descargar ninguna aplicación.",
          "icon": "qrcode"
        },
        {
          "title": "Pedidos Online y Carrito",
          "desc": "Sistema de pedidos completo con opciones de porción, complementos, notas especiales y cálculo de precios.",
          "icon": "cart"
        },
        {
          "title": "Sistema de Reservas",
          "desc": "Reservas online con fecha, hora y número de comensales. Código de verificación por correo electrónico y confirmación de reserva.",
          "icon": "calendar"
        },
        {
          "title": "Llamar al Camarero",
          "desc": "Llama al camarero con un solo toque. Servicio profesional con indicación del motivo y protección contra spam.",
          "icon": "bell"
        },
        {
          "title": "Información de Alérgenos",
          "desc": "Declaración de los 14 alérgenos principales según la normativa de la UE. Cumplimiento legal con la distinción «Contiene» y «Puede contener».",
          "icon": "shield"
        },
        {
          "title": "Encuestas de Satisfacción",
          "desc": "Valoraciones con estrellas para comida, servicio, ambiente y más. Recoge opiniones valiosas de tus clientes.",
          "icon": "star"
        },
        {
          "title": "Campañas y Descuentos",
          "desc": "Precios de campaña por producto, tasas de descuento diferenciadas para mesa y pedidos online, y tarifas especiales.",
          "icon": "discount"
        },
        {
          "title": "Acciones Verificadas por Ubicación",
          "desc": "Las llamadas al camarero y los pedidos se verifican según la ubicación del restaurante. No se permiten acciones fuera del local.",
          "icon": "location"
        },
        {
          "title": "Integración con Redes Sociales",
          "desc": "Enlaza Instagram, Facebook, TikTok, YouTube y WhatsApp para llegar a más clientes.",
          "icon": "social"
        },
        {
          "title": "Pedidos para Llevar",
          "desc": "Los clientes pueden realizar pedidos para llevar con dirección de entrega, teléfono y notas especiales para facilitar el reparto. La ubicación del cliente se envía al restaurante junto con el pedido.",
          "icon": "truck"
        },
        {
          "title": "Pedidos por WhatsApp",
          "desc": "Envía pedidos por WhatsApp con un solo toque. Comunicación rápida, sencilla y directa. La ubicación del cliente se envía al restaurante junto con el pedido.",
          "icon": "whatsapp"
        },
        {
          "title": "Anuncios de Días Especiales",
          "desc": "Muestra a tus clientes anuncios personalizados para festividades, cumpleaños y eventos especiales.",
          "icon": "megaphone"
        },
        {
          "title": "Menú por Horario",
          "desc": "Muestra automáticamente los menús de desayuno, almuerzo y cena según la hora del día. Se adapta a tu horario de apertura.",
          "icon": "clock"
        },
        {
          "title": "Enlace de Reseñas en Google",
          "desc": "Comparte tu perfil de empresa en Google y tu enlace de reseñas para aumentar tu visibilidad en Google.",
          "icon": "google"
        }
      ]
    },
    "themes": {
      "label": "TEMAS",
      "title": "Más de 30 temas profesionales diseñados para tu restaurante",
      "subtitle": "Cada tema es compatible con dispositivos móviles, rápido y compatible con todas las funciones. Desde restaurantes de alta cocina hasta comida rápida — ideal para cualquier concepto.",
      "cta": "Explorar todos los temas"
    },
    "featureDetails": [
      {
        "label": "SISTEMA DE PEDIDOS",
        "title": "Desde la mesa o en línea, pedir ahora es muy fácil",
        "desc": "Los clientes pueden elegir porciones, agregar extras, escribir peticiones especiales y añadir al carrito. Pedidos en mesa y entrega a domicilio, diferentes tasas de descuento y métodos de pago para una experiencia de pedido completa.",
        "bullets": [
          "Selección de porciones y complementos",
          "Gestión del carrito",
          "Pedidos en mesa y en línea",
          "Cálculo de precios en tiempo real",
          "Aceptación de pedidos según ubicación",
          "Recepción de pedidos por WhatsApp",
          "Propina para el repartidor",
          "Agregar ubicación del cliente al pedido",
          "Función de descuento opcional en el carrito"
        ]
      },
      {
        "label": "RESERVAS",
        "title": "Reserva tu mesa con nuestro sistema de reservas en línea",
        "desc": "Los clientes pueden hacer reservas en línea sin necesidad de llamar. Seleccionan fecha, franja horaria, número de comensales y peticiones especiales. Seguro con verificación por correo electrónico y profesional con comprobante de confirmación.",
        "bullets": [
          "Selector de fecha con calendario",
          "Franjas horarias flexibles",
          "Código de verificación por correo electrónico",
          "Comprobante de confirmación imprimible",
          "Adaptado al horario del restaurante",
          "Configuración de límite de reservas"
        ]
      },
      {
        "label": "MENÚ MULTIIDIOMA",
        "title": "Llega a clientes de todo el mundo sin barreras idiomáticas",
        "desc": "Atiende a tus clientes extranjeros en su propio idioma con menús disponibles en 11 idiomas. Soporte completo de derecha a izquierda (RTL) para el árabe. Detección automática del idioma del navegador y cambio de idioma sencillo.",
        "bullets": [
          "Soporte para 11 idiomas",
          "Soporte RTL para árabe",
          "Detección automática de idioma",
          "Cambio de idioma con un solo clic"
        ]
      }
    ],
    "howItWorks": {
      "label": "CÓMO FUNCIONA",
      "title": "Tu menú digital listo en 3 pasos",
      "steps": [
        {
          "title": "Regístrate",
          "desc": "Crea una cuenta gratuita y define tu restaurante."
        },
        {
          "title": "Crea tu menú",
          "desc": "Añade tus productos, fotos y precios. Elige tu tema."
        },
        {
          "title": "Comparte tu código QR",
          "desc": "Coloca los códigos QR en tus mesas. Los clientes lo escanean para acceder al menú."
        }
      ]
    },
    "pricing": {
      "label": "PRECIOS",
      "title": "Precios transparentes y sencillos",
      "subtitle": "Un solo plan. Todos los módulos y todas las funciones incluidas. Sin tarifas ocultas.",
      "period": "Anual",
      "price": "$120",
      "currency": "$",
      "note": "Todas las funciones incluidas en el precio",
      "features": [
        "Más de 30 temas profesionales",
        "Soporte para 11 idiomas",
        "Pedidos en línea y en mesa ilimitados",
        "Sistema de reservas en línea",
        "Llamada al camarero",
        "Pedidos por WhatsApp y para llevar",
        "Gestión de campañas y descuentos",
        "Sistema de encuestas a clientes",
        "Acciones verificadas por ubicación",
        "Notificaciones push",
        "Soporte técnico 24/7",
        "Garantía de devolución de 30 días"
      ],
      "cta": "Comenzar ahora",
      "secondary": "Ver demo",
      "taxNote": "Impuestos incluidos.",
      "refund": "Devolución en 30 días",
      "support": "Soporte 24/7",
      "instant": "Activación inmediata"
    },
    "cta": {
      "title": "¡Obtén tu menú digital con LiwaMenu hoy mismo!",
      "subtitle": "¡Garantía de devolución de dinero en 30 días!",
      "button": "Comenzar ahora"
    },
    "footer": {
      "product": "Producto",
      "resources": "Recursos",
      "company": "Empresa",
      "features": "Funciones",
      "pricing": "Precios",
      "themes": "Temas",
      "support": "Soporte",
      "contact": "Contacto",
      "wpContact": "Contacto por WhatsApp",
      "terms": "Términos de servicio",
      "rights": "Todos los derechos reservados.",
      "desc": "Solución de menú digital moderno para restaurantes. Más de 30 temas, 11 idiomas, gestión completa de pedidos.",
      "termsModal": {
        "title": "Términos de servicio",
        "intro": "Al utilizar los servicios de LiwaMenu, aceptas los términos a continuación. Por favor, léelos detenidamente.",
        "sections": [
          {
            "title": "1. Uso Legal",
            "body": "El Cliente acepta utilizar la plataforma LiwaMenu únicamente para la venta legal de productos y servicios. Está estrictamente prohibido comercializar contenido, productos o servicios ilegales; vender artículos alimentarios falsificados, inseguros o de contrabando; ofrecer productos de alcohol o tabaco sin licencia; o realizar cualquier actividad que infrinja la legislación vigente."
          },
          {
            "title": "2. Prohibición de Uso Indebido",
            "body": "El sistema está diseñado para cubrir las necesidades de menú digital, pedidos, reservas e interacción con el cliente de restaurantes, cafeterías y negocios de alimentación. No puede utilizarse para juegos de azar, loterías, transacciones con criptomonedas, intermediación financiera ni ninguna actividad ilícita. En caso de detección, el contrato podrá rescindirse de forma unilateral."
          },
          {
            "title": "3. Continuidad del Servicio",
            "body": "LiwaMenu aspira a la mayor disponibilidad posible mediante una infraestructura moderna. Sin embargo, debido a interrupciones del proveedor en la nube, dependencias de terceros (Firebase, proveedores de SMS, sistemas de pago, ISP, etc.), ventanas de mantenimiento programado o eventos de fuerza mayor imprevistos, el sistema puede experimentar de forma excepcional periodos de inactividad temporal."
          },
          {
            "title": "4. Limitación de Responsabilidad",
            "body": "El Cliente reconoce que Liwa Yazılım San. Tic. Ltd. Şirketi no podrá ser considerada responsable de pérdidas comerciales directas o indirectas, pedidos perdidos, reservas canceladas, lucro cesante o daños reputacionales que pudieran producirse durante interrupciones extraordinarias o alteraciones técnicas. Nuestra empresa no asume ninguna indemnización, reembolso ni otra obligación financiera durante dichos períodos."
          },
          {
            "title": "5. Seguridad de Datos y Responsabilidad de la Cuenta",
            "body": "Los datos del cliente están protegidos con cifrado SSL y se realizan copias de seguridad de forma periódica. Las credenciales de acceso (nombre de usuario, contraseña, claves API) deben compartirse únicamente con personal autorizado. Todos los daños derivados de accesos no autorizados o del uso indebido de la cuenta son responsabilidad del titular de la misma."
          },
          {
            "title": "6. Propiedad Intelectual",
            "body": "La plataforma LiwaMenu, su código fuente, diseños, logotipos y todos los elementos visuales son propiedad intelectual de Liwa Yazılım San. Tic. Ltd. Şirketi. No pueden copiarse, distribuirse ni utilizarse en obras derivadas sin autorización."
          },
          {
            "title": "7. Actualización de los Términos",
            "body": "Liwa Yazılım San. Tic. Ltd. Şirketi se reserva el derecho de actualizar estos términos de servicio sin previo aviso. Los términos actualizados entran en vigor en la fecha de su publicación en el sitio web, y los clientes que continúen utilizando el servicio se considerarán conformes con los nuevos términos."
          }
        ],
        "footer": "Al aceptar este acuerdo, usted reconoce que utilizará los servicios de LiwaMenu conforme a los términos establecidos anteriormente.",
        "close": "Cerrar"
      }
    }
  },
  el: {
    "nav": {
      "features": "Χαρακτηριστικά",
      "themes": "Θέματα",
      "howItWorks": "Πώς Λειτουργεί",
      "pricing": "Τιμολόγηση",
      "contact": "Επικοινωνία",
      "startFree": "Ξεκινήστε Δωρεάν",
      "login": "Πίνακας Διαχείρισης"
    },
    "hero": {
      "title1": "Επιταχύνετε τις Παραγγελίες,",
      "titleHighlight": "Ψηφιοποιήστε το Εστιατόριό σας",
      "title2": "",
      "subtitle": "Δώστε στους πελάτες σας άμεση πρόσβαση στο μενού σας μέσω QR code. Πάνω από 30 επαγγελματικά θέματα, 11 γλώσσες και πλήρης διαχείριση παραγγελιών.",
      "cta": "Ξεκινήστε Τώρα",
      "secondary": "Δείτε Demo",
      "scanText": "Σαρώστε και δοκιμάστε!"
    },
    "stats": {
      "themes": "Επαγγελματικά Θέματα",
      "languages": "Γλώσσες",
      "features": "Premium Χαρακτηριστικά",
      "uptime": "Uptime"
    },
    "benefits": {
      "label": "ΓΙΑΤΙ LIWAMENU;",
      "title": "Φέρτε το εστιατόριό σας στην ψηφιακή εποχή",
      "subtitle": "Όλα όσα χρειάζεστε σε μία πλατφόρμα",
      "cards": [
        {
          "title": "Περισσότεροι Πελάτες",
          "desc": "Εντυπωσιάστε τους πελάτες σας με ένα επαγγελματικό ψηφιακό μενού. Αυξήστε την ορατότητά σας στο Google."
        },
        {
          "title": "Εύκολες Ενημερώσεις",
          "desc": "Ενημερώστε τιμές σε οποιαδήποτε κατηγορία με μία κίνηση, εισάγοντας ποσοστό ή σταθερό ποσό."
        },
        {
          "title": "Περισσότερες Παραγγελίες",
          "desc": "Οι πελάτες σας μπορούν να παραγγείλουν μόνοι τους απευθείας από το μενού. Αυτό επιταχύνει τη διαδικασία παραγγελίας, επιτρέπει στους επισκέπτες να παραγγείλουν εύκολα χωρίς αναμονή και μειώνει τον φόρτο εξυπηρέτησης. Εξυπηρετείτε πιο αποδοτικά με λιγότερο προσωπικό και αυξάνετε τα έσοδά σας δεχόμενοι περισσότερες παραγγελίες."
        },
        {
          "title": "Δημοσιεύστε στον Ιστότοπό σας",
          "desc": "Ενσωματώστε το μενού σας στον δικό σας ιστότοπο με έτοιμους κωδικούς iframe."
        },
        {
          "title": "Σύστημα Κρατήσεων",
          "desc": "Επιτρέψτε στους πελάτες να κάνουν online κρατήσεις. Η επαλήθευση μέσω email αποτρέπει ψεύτικες κρατήσεις. Οι επιλογές κρατήσεων συνάδουν με τις εργάσιμες ημέρες και ώρες σας."
        },
        {
          "title": "Σύνδεσμος Αξιολόγησης Google",
          "desc": "Μοιραστείτε το επαγγελματικό σας προφίλ στο Google και τον σύνδεσμο αξιολόγησης για να ενισχύσετε την ορατότητά σας."
        }
      ]
    },
    "features": {
      "label": "ΧΑΡΑΚΤΗΡΙΣΤΙΚΑ",
      "title": "Ολοκληρωμένα χαρακτηριστικά για κάθε ανάγκη",
      "subtitle": "Όλα τα εργαλεία για την ψηφιοποίηση του εστιατορίου σας σε μία πλατφόρμα",
      "items": [
        {
          "title": "30+ Επαγγελματικά Θέματα",
          "desc": "30+ προσεκτικά σχεδιασμένα θέματα. Από fine dining έως fast food, από καφέ έως εστιατόρια σούσι — μια σχεδίαση για κάθε concept.",
          "icon": "palette"
        },
        {
          "title": "Υποστήριξη 11 Γλωσσών",
          "desc": "Υποστήριξη Τουρκικών, Αγγλικών, Γερμανικών, Γαλλικών, Ιταλικών, Ισπανικών, Αραβικών (RTL), Αζερικών, Ρωσικών, Ελληνικών και Κινεζικών.",
          "icon": "languages"
        },
        {
          "title": "Άμεση Πρόσβαση με QR Κωδικό",
          "desc": "Οι πελάτες σκανάρουν τον QR κωδικό στο τραπέζι και αποκτούν αμέσως πρόσβαση στο μενού σας. Δεν χρειάζεται λήψη εφαρμογής.",
          "icon": "qrcode"
        },
        {
          "title": "Online Παραγγελία & Καλάθι",
          "desc": "Πλήρες σύστημα παραγγελιών με επιλογές μερίδας, πρόσθετα, ειδικές σημειώσεις και υπολογισμό τιμής.",
          "icon": "cart"
        },
        {
          "title": "Σύστημα Κρατήσεων",
          "desc": "Online κράτηση με ημερομηνία, ώρα και αριθμό επισκεπτών. Κωδικός επαλήθευσης email και απόδειξη επιβεβαίωσης.",
          "icon": "calendar"
        },
        {
          "title": "Κλήση Σερβιτόρου",
          "desc": "Κλήση σερβιτόρου με ένα άγγιγμα. Επαγγελματική εξυπηρέτηση με προσδιορισμό αιτίου και προστασία από spam.",
          "icon": "bell"
        },
        {
          "title": "Πληροφορίες Αλλεργιογόνων",
          "desc": "Δηλώσεις για τα 14 κύρια αλλεργιογόνα της ΕΕ. Νομική συμμόρφωση με διαχωρισμό «Περιέχει» και «Μπορεί να Περιέχει».",
          "icon": "shield"
        },
        {
          "title": "Έρευνες Πελατών",
          "desc": "Αξιολογήσεις με αστέρια για φαγητό, εξυπηρέτηση, ατμόσφαιρα και άλλα. Συλλέξτε πολύτιμα σχόλια.",
          "icon": "star"
        },
        {
          "title": "Εκστρατείες & Εκπτώσεις",
          "desc": "Τιμές εκστρατείας σε επίπεδο προϊόντος, ξεχωριστά ποσοστά έκπτωσης για τραπέζι/online και ειδική τιμολόγηση.",
          "icon": "discount"
        },
        {
          "title": "Ενέργειες Επαληθευμένης Τοποθεσίας",
          "desc": "Οι κλήσεις σερβιτόρων και οι παραγγελίες επαληθεύονται βάσει της τοποθεσίας του εστιατορίου. Ενέργειες εκτός τοποθεσίας δεν επιτρέπονται.",
          "icon": "location"
        },
        {
          "title": "Ενσωμάτωση Κοινωνικών Μέσων",
          "desc": "Σύνδεσμοι Instagram, Facebook, TikTok, YouTube και WhatsApp για την προσέγγιση πελατών.",
          "icon": "social"
        },
        {
          "title": "Παραγγελίες Take Away",
          "desc": "Οι πελάτες μπορούν να κάνουν παραγγελίες take away με διεύθυνση παράδοσης, τηλέφωνο και ειδικές σημειώσεις για εύκολη παράδοση. Η τοποθεσία του πελάτη αποστέλλεται στο εστιατόριο μαζί με την παραγγελία.",
          "icon": "truck"
        },
        {
          "title": "Παραγγελία μέσω WhatsApp",
          "desc": "Αποστολή παραγγελιών μέσω WhatsApp με ένα μόνο άγγιγμα. Γρήγορη, εύκολη και άμεση επικοινωνία. Η τοποθεσία του πελάτη αποστέλλεται στο εστιατόριο μαζί με την παραγγελία.",
          "icon": "whatsapp"
        },
        {
          "title": "Ανακοινώσεις Ειδικών Ημερών",
          "desc": "Εμφανίστε εξατομικευμένες ανακοινώσεις για αργίες, γενέθλια και ειδικές εκδηλώσεις στους πελάτες σας.",
          "icon": "megaphone"
        },
        {
          "title": "Μενού Βασισμένο στην Ώρα",
          "desc": "Εμφανίστε αυτόματα μενού πρωινού, μεσημεριανού και βραδινού βάσει της ώρας της ημέρας. Προσαρμόζεται στις ώρες λειτουργίας.",
          "icon": "clock"
        },
        {
          "title": "Σύνδεσμος Google Κριτικής",
          "desc": "Μοιραστείτε το επαγγελματικό προφίλ σας στο Google και τον σύνδεσμο κριτικής για να ενισχύσετε την παρουσία σας στο Google.",
          "icon": "google"
        }
      ]
    },
    "themes": {
      "label": "ΘΕΜΑΤΑ",
      "title": "30+ επαγγελματικά θέματα σχεδιασμένα για το εστιατόριό σας",
      "subtitle": "Κάθε θέμα είναι φιλικό προς κινητά, γρήγορο και υποστηρίζει όλες τις λειτουργίες. Από fine dining έως fast food — κατάλληλο για κάθε concept.",
      "cta": "Εξερευνήστε Όλα τα Θέματα"
    },
    "featureDetails": [
      {
        "label": "ΣΥΣΤΗΜΑ ΠΑΡΑΓΓΕΛΙΩΝ",
        "title": "Από το τραπέζι ή online, η παραγγελία τώρα είναι αβίαστη",
        "desc": "Οι πελάτες μπορούν να επιλέξουν μερίδες, να προσθέσουν extras, να γράψουν ειδικά αιτήματα και να προσθέσουν στο καλάθι. Παραγγελία από τραπέζι και online delivery, διαφορετικές εκπτωτικές τιμές και μέθοδοι πληρωμής για μια ολοκληρωμένη εμπειρία παραγγελίας.",
        "bullets": [
          "Επιλογή μερίδας και προσθηκών",
          "Διαχείριση καλαθιού",
          "Παραγγελίες τραπεζιού και online",
          "Υπολογισμός τιμής σε πραγματικό χρόνο",
          "Αποδοχή παραγγελιών βάσει τοποθεσίας",
          "Λήψη παραγγελίας μέσω WhatsApp",
          "Φιλοδώρημα για διανομέα",
          "Προσθήκη τοποθεσίας πελάτη στην παραγγελία",
          "Προαιρετική έκπτωση καλαθιού"
        ]
      },
      {
        "label": "ΚΡΑΤΗΣΕΙΣ",
        "title": "Κλείστε το τραπέζι σας με online κρατήσεις",
        "desc": "Οι πελάτες κάνουν κρατήσεις online χωρίς τηλεφώνημα. Επιλογή ημερομηνίας, χρονικής περιόδου, αριθμού ατόμων και ειδικών αιτημάτων. Ασφαλές με επαλήθευση email, επαγγελματικό με απόδειξη επιβεβαίωσης.",
        "bullets": [
          "Επιλογή ημερομηνίας με ημερολόγιο",
          "Ευέλικτες χρονικές ζώνες",
          "Κωδικός επαλήθευσης email",
          "Εκτυπώσιμη απόδειξη επιβεβαίωσης",
          "Εναρμονισμένο με ώρες λειτουργίας εστιατορίου",
          "Ρυθμίσεις ορίου κρατήσεων"
        ]
      },
      {
        "label": "ΠΟΛΥΓΛΩΣΣΟ ΜΕΝΟΥ",
        "title": "Προσεγγίστε παγκόσμιους πελάτες χωρίς γλωσσικά εμπόδια",
        "desc": "Εξυπηρετήστε ξένους επισκέπτες στη γλώσσα τους με μενού σε 11 γλώσσες. Πλήρης υποστήριξη δεξιά-προς-αριστερά (RTL) για Αραβικά. Αυτόματη ανίχνευση γλώσσας προγράμματος περιήγησης και εύκολη εναλλαγή γλώσσας.",
        "bullets": [
          "Υποστήριξη 11 γλωσσών",
          "Υποστήριξη Αραβικών RTL",
          "Αυτόματη ανίχνευση γλώσσας",
          "Εναλλαγή γλώσσας με ένα κλικ"
        ]
      }
    ],
    "howItWorks": {
      "label": "ΠΩΣ ΛΕΙΤΟΥΡΓΕΙ",
      "title": "Το ψηφιακό σας μενού έτοιμο σε 3 βήματα",
      "steps": [
        {
          "title": "Εγγραφή",
          "desc": "Δημιουργήστε δωρεάν λογαριασμό και ορίστε το εστιατόριό σας."
        },
        {
          "title": "Δημιουργήστε το Μενού σας",
          "desc": "Προσθέστε τα προϊόντα, τις φωτογραφίες και τις τιμές σας. Επιλέξτε το θέμα σας."
        },
        {
          "title": "Μοιραστείτε τον QR Κωδικό σας",
          "desc": "Τοποθετήστε QR κωδικούς στα τραπέζια σας. Οι πελάτες σαρώνουν για πρόσβαση στο μενού."
        }
      ]
    },
    "pricing": {
      "label": "ΤΙΜΟΛΟΓΗΣΗ",
      "title": "Διαφανής και απλή τιμολόγηση",
      "subtitle": "Ένα πακέτο. Όλες οι ενότητες, όλες οι λειτουργίες συμπεριλαμβάνονται. Χωρίς κρυφές χρεώσεις.",
      "period": "Ετήσια",
      "price": "$120",
      "currency": "$",
      "note": "Όλες οι Δυνατότητες Συμπεριλαμβάνονται στην Τιμή",
      "features": [
        "30+ Επαγγελματικά Θέματα",
        "Υποστήριξη 11 Γλωσσών",
        "Απεριόριστες Online & Επιτραπέζιες Παραγγελίες",
        "Σύστημα Online Κράτησης",
        "Κλήση Σερβιτόρου",
        "WhatsApp & Παραγγελίες για Takeaway",
        "Διαχείριση Προσφορών & Εκπτώσεων",
        "Σύστημα Έρευνας Πελατών",
        "Ενέργειες με Επαλήθευση Τοποθεσίας",
        "Push Ειδοποιήσεις",
        "Τεχνική Υποστήριξη 24/7",
        "Εγγύηση Επιστροφής Χρημάτων 30 Ημερών"
      ],
      "cta": "Ξεκινήστε Τώρα",
      "secondary": "Δείτε Demo",
      "taxNote": "Συμπεριλαμβάνεται ΦΠΑ.",
      "refund": "Επιστροφή σε 30 Ημέρες",
      "support": "Υποστήριξη 24/7",
      "instant": "Άμεση Ενεργοποίηση"
    },
    "cta": {
      "title": "Αποκτήστε το ψηφιακό σας μενού με το LiwaMenu σήμερα!",
      "subtitle": "Εγγύηση επιστροφής χρημάτων 30 ημερών!",
      "button": "Ξεκινήστε Τώρα"
    },
    "footer": {
      "product": "Προϊόν",
      "resources": "Πόροι",
      "company": "Εταιρεία",
      "features": "Δυνατότητες",
      "pricing": "Τιμολόγηση",
      "themes": "Θέματα",
      "support": "Υποστήριξη",
      "contact": "Επικοινωνία",
      "wpContact": "Επικοινωνία μέσω WhatsApp",
      "terms": "Όροι Χρήσης",
      "rights": "Με επιφύλαξη παντός δικαιώματος.",
      "desc": "Μοντέρνα λύση ψηφιακού μενού για εστιατόρια. 30+ θέματα, 11 γλώσσες, πλήρης διαχείριση παραγγελιών.",
      "termsModal": {
        "title": "Όροι Χρήσης",
        "intro": "Χρησιμοποιώντας τις υπηρεσίες του LiwaMenu, αποδέχεστε τους παρακάτω όρους. Παρακαλούμε διαβάστε τους προσεκτικά.",
        "sections": [
          {
            "title": "1. Νόμιμη Χρήση",
            "body": "Ο πελάτης συμφωνεί να χρησιμοποιεί την πλατφόρμα LiwaMenu αποκλειστικά για νόμιμη πώληση προϊόντων και υπηρεσιών. Απαγορεύεται αυστηρά η προώθηση παράνομου περιεχομένου, προϊόντων ή υπηρεσιών· η πώληση παραποιημένων, μη ασφαλών ή λαθραίων τροφίμων· η προσφορά αδειοδότητων αλκοολούχων ή καπνικών προϊόντων· ή οποιαδήποτε δραστηριότητα που παραβιάζει την ισχύουσα νομοθεσία."
          },
          {
            "title": "2. Απαγόρευση Εκτός Σκοπού Χρήσης",
            "body": "Το σύστημα έχει σχεδιαστεί για τις ανάγκες ψηφιακού μενού, παραγγελιών, κρατήσεων και αλληλεπίδρασης με πελάτες εστιατορίων, καφέ και επιχειρήσεων τροφίμων. Δεν επιτρέπεται η χρήση για τυχερά παιχνίδια, λαχεία, συναλλαγές κρυπτονομισμάτων, χρηματοοικονομική διαμεσολάβηση ή οποιαδήποτε παράνομη δραστηριότητα. Σε περίπτωση διαπίστωσης, η σύμβαση δύναται να καταγγελθεί μονομερώς."
          },
          {
            "title": "3. Συνέχεια Υπηρεσίας",
            "body": "Το LiwaMenu στοχεύει στη μέγιστη δυνατή διαθεσιμότητα χρησιμοποιώντας σύγχρονη υποδομή. Ωστόσο, λόγω διακοπών παρόχου cloud, εξαρτήσεων τρίτων (Firebase, παρόχους SMS, συστήματα πληρωμών, ISP κ.λπ.), προγραμματισμένων παραθύρων συντήρησης ή απρόβλεπτων γεγονότων ανωτέρας βίας, το σύστημα ενδέχεται σπάνια να εμφανίσει προσωρινές περιόδους εκτός λειτουργίας."
          },
          {
            "title": "4. Περιορισμός Ευθύνης",
            "body": "Ο πελάτης αναγνωρίζει ότι η Liwa Yazılım San. Tic. Ltd. Şirketi δεν φέρει ευθύνη για τυχόν άμεσες ή έμμεσες εμπορικές ζημίες, απώλεια παραγγελιών, ακυρώσεις κρατήσεων, διαφυγόντα κέρδη ή ζημία φήμης που ενδέχεται να προκύψουν κατά τη διάρκεια έκτακτων διακοπών ή τεχνικών διαταραχών. Η εταιρεία μας δεν αναλαμβάνει καμία αποζημίωση, επιστροφή χρημάτων ή άλλη οικονομική υποχρέωση κατά τις εν λόγω περιόδους."
          },
          {
            "title": "5. Ασφάλεια Δεδομένων και Ευθύνη Λογαριασμού",
            "body": "Τα δεδομένα πελατών προστατεύονται με κρυπτογράφηση SSL και δημιουργούνται αντίγραφα ασφαλείας τακτικά. Τα διαπιστευτήρια λογαριασμού (όνομα χρήστη, κωδικός πρόσβασης, κλειδιά API) πρέπει να κοινοποιούνται μόνο σε εξουσιοδοτημένο προσωπικό. Όλες οι ζημίες που προκύπτουν από μη εξουσιοδοτημένη πρόσβαση ή κατάχρηση λογαριασμού βαρύνουν τον κάτοχο του λογαριασμού."
          },
          {
            "title": "6. Πνευματική Ιδιοκτησία",
            "body": "Η πλατφόρμα LiwaMenu, ο πηγαίος κώδικας, τα σχέδια, τα λογότυπα και όλα τα οπτικά στοιχεία αποτελούν πνευματική ιδιοκτησία της Liwa Yazılım San. Tic. Ltd. Şirketi. Δεν επιτρέπεται η αντιγραφή, διανομή ή χρήση σε παράγωγα έργα χωρίς άδεια."
          },
          {
            "title": "7. Ενημερώσεις Όρων",
            "body": "Η Liwa Yazılım San. Tic. Ltd. Şirketi διατηρεί το δικαίωμα να ενημερώνει τους παρόντες όρους χρήσης χωρίς προηγούμενη ειδοποίηση. Οι ενημερωμένοι όροι τίθενται σε ισχύ από την ημερομηνία δημοσίευσής τους στον ιστότοπο, και οι πελάτες που συνεχίζουν να χρησιμοποιούν την υπηρεσία θεωρείται ότι αποδέχονται τους νέους όρους."
          }
        ],
        "footer": "Αποδεχόμενοι αυτή τη συμφωνία, συμφωνείτε να χρησιμοποιείτε τις υπηρεσίες LiwaMenu στο πλαίσιο των παραπάνω όρων.",
        "close": "Κλείσιμο"
      }
    }
  },
  it: {
    "nav": {
      "features": "Funzionalità",
      "themes": "Temi",
      "howItWorks": "Come Funziona",
      "pricing": "Prezzi",
      "contact": "Contatti",
      "startFree": "Inizia Gratis",
      "login": "Pannello Admin"
    },
    "hero": {
      "title1": "Accelera gli Ordini,",
      "titleHighlight": "Digitalizza il Tuo Ristorante",
      "title2": "",
      "subtitle": "Permetti ai tuoi clienti di accedere istantaneamente al menu tramite QR code. Oltre 30 temi professionali, 11 lingue e gestione completa degli ordini.",
      "cta": "Inizia Ora",
      "secondary": "Guarda la Demo",
      "scanText": "Scansiona e provalo!"
    },
    "stats": {
      "themes": "Temi Professionali",
      "languages": "Lingue",
      "features": "Funzionalità Premium",
      "uptime": "Disponibilità"
    },
    "benefits": {
      "label": "PERCHÉ LIWAMENU?",
      "title": "Porta il tuo ristorante nell'era digitale",
      "subtitle": "Tutto ciò di cui hai bisogno in un'unica piattaforma",
      "cards": [
        {
          "title": "Più Clienti",
          "desc": "Conquista i tuoi clienti con un menu digitale professionale. Aumenta la tua visibilità su Google."
        },
        {
          "title": "Aggiornamenti Facili",
          "desc": "Aggiorna i prezzi di qualsiasi categoria in un solo passaggio inserendo una percentuale o un importo fisso."
        },
        {
          "title": "Ricevi Più Ordini",
          "desc": "I tuoi clienti possono effettuare ordini direttamente dal menu. Questo accelera il processo di ordinazione, permette agli ospiti di ordinare facilmente senza attendere e riduce il carico del servizio. Servi in modo più efficiente con meno personale e aumenta i tuoi ricavi ricevendo più ordini."
        },
        {
          "title": "Pubblica sul Tuo Sito",
          "desc": "Incorpora il menu nel tuo sito web con codici iframe pronti all'uso."
        },
        {
          "title": "Sistema di Prenotazione",
          "desc": "Consenti ai clienti di effettuare prenotazioni online. La verifica via email previene le prenotazioni false. Le opzioni di prenotazione si adattano ai tuoi giorni e orari di lavoro."
        },
        {
          "title": "Link alle Recensioni Google",
          "desc": "Condividi il tuo profilo aziendale Google e il link alle recensioni per aumentare la tua visibilità su Google."
        }
      ]
    },
    "features": {
      "label": "FUNZIONALITÀ",
      "title": "Funzionalità complete per ogni esigenza",
      "subtitle": "Tutti gli strumenti necessari per digitalizzare il tuo ristorante in un'unica piattaforma",
      "items": [
        {
          "title": "30+ Temi Professionali",
          "desc": "30+ temi progettati con cura. Dal fine dining al fast food, dai caffè ai ristoranti di sushi — un design per ogni concept.",
          "icon": "palette"
        },
        {
          "title": "Supporto 11 Lingue",
          "desc": "Supporto per turco, inglese, tedesco, francese, italiano, spagnolo, arabo (RTL), azerbaigiano, russo, greco e cinese.",
          "icon": "languages"
        },
        {
          "title": "Accesso Istantaneo con QR",
          "desc": "I clienti scansionano il QR al tavolo e accedono subito al menu. Nessuna app da scaricare.",
          "icon": "qrcode"
        },
        {
          "title": "Ordine Online & Carrello",
          "desc": "Sistema di ordinazione completo con opzioni di porzione, aggiunte, note speciali e calcolo del prezzo.",
          "icon": "cart"
        },
        {
          "title": "Sistema di Prenotazione",
          "desc": "Prenotazione online con data, orario e numero di ospiti. Codice di verifica via email e ricevuta di conferma.",
          "icon": "calendar"
        },
        {
          "title": "Chiama il Cameriere",
          "desc": "Chiama il cameriere con un solo tocco. Servizio professionale con specifica del motivo e protezione dallo spam.",
          "icon": "bell"
        },
        {
          "title": "Informazioni sugli Allergeni",
          "desc": "Dichiarazioni sui 14 principali allergeni UE. Conformità legale con la distinzione «Contiene» e «Può Contenere».",
          "icon": "shield"
        },
        {
          "title": "Sondaggi Clienti",
          "desc": "Valutazioni a stelle per cibo, servizio, atmosfera e altro. Raccogli feedback di valore.",
          "icon": "star"
        },
        {
          "title": "Campagne & Sconti",
          "desc": "Prezzi promozionali per prodotto, tariffe di sconto separate per tavolo/online e prezzi speciali.",
          "icon": "discount"
        },
        {
          "title": "Azioni Verificate per Posizione",
          "desc": "Le chiamate al cameriere e gli ordini vengono verificati in base alla posizione del ristorante. Le azioni fuori sede non sono consentite.",
          "icon": "location"
        },
        {
          "title": "Integrazione Social Media",
          "desc": "Link a Instagram, Facebook, TikTok, YouTube e WhatsApp per raggiungere i clienti.",
          "icon": "social"
        },
        {
          "title": "Ordini da Asporto",
          "desc": "I clienti possono effettuare ordini da asporto con indirizzo di consegna, telefono e note speciali per una consegna semplice. La posizione del cliente viene inviata al ristorante insieme all'ordine.",
          "icon": "truck"
        },
        {
          "title": "Ordini via WhatsApp",
          "desc": "Invia ordini tramite WhatsApp con un solo tocco. Comunicazione rapida, semplice e diretta. La posizione del cliente viene inviata al ristorante insieme all'ordine.",
          "icon": "whatsapp"
        },
        {
          "title": "Annunci per Giorni Speciali",
          "desc": "Mostra ai tuoi clienti annunci personalizzati per festività, compleanni ed eventi speciali.",
          "icon": "megaphone"
        },
        {
          "title": "Menu in Base all'Orario",
          "desc": "Mostra automaticamente i menu di colazione, pranzo e cena in base all'ora del giorno. Si adatta agli orari di apertura.",
          "icon": "clock"
        },
        {
          "title": "Link Recensioni Google",
          "desc": "Condividi il tuo profilo aziendale su Google e il link alle recensioni per aumentare la tua visibilità su Google.",
          "icon": "google"
        }
      ]
    },
    "themes": {
      "label": "TEMI",
      "title": "30+ temi professionali progettati per il tuo ristorante",
      "subtitle": "Ogni tema è ottimizzato per mobile, veloce e supporta tutte le funzionalità. Dal fine dining al fast food — adatto a ogni concept.",
      "cta": "Esplora Tutti i Temi"
    },
    "featureDetails": [
      {
        "label": "SISTEMA ORDINI",
        "title": "Dal tavolo o online, ordinare è ora semplicissimo",
        "desc": "I clienti possono selezionare le porzioni, aggiungere extra, scrivere richieste speciali e aggiungere al carrello. Ordini al tavolo e consegna online, diverse aliquote di sconto e metodi di pagamento per un'esperienza d'ordine completa.",
        "bullets": [
          "Selezione porzioni e aggiuntivi",
          "Gestione del carrello",
          "Ordini al tavolo e online",
          "Calcolo del prezzo in tempo reale",
          "Accettazione ordini in base alla posizione",
          "Ricezione ordini via WhatsApp",
          "Mancia al corriere",
          "Aggiungi la posizione del cliente all'ordine",
          "Funzione sconto carrello opzionale"
        ]
      },
      {
        "label": "PRENOTAZIONI",
        "title": "Prenota il tuo tavolo con le prenotazioni online",
        "desc": "I clienti possono prenotare online senza dover chiamare. Selezionano data, fascia oraria, numero di ospiti e richieste speciali. Sicuro con verifica via email, professionale con ricevuta di conferma.",
        "bullets": [
          "Selettore data da calendario",
          "Fasce orarie flessibili",
          "Codice di verifica via email",
          "Ricevuta di conferma stampabile",
          "Allineato con gli orari di apertura del ristorante",
          "Impostazioni limite prenotazioni"
        ]
      },
      {
        "label": "MENU MULTILINGUE",
        "title": "Raggiungi clienti internazionali senza barriere linguistiche",
        "desc": "Servi i tuoi ospiti stranieri nella loro lingua con menu in 11 lingue. Supporto completo da destra a sinistra (RTL) per l'arabo. Rilevamento automatico della lingua del browser e cambio lingua semplice.",
        "bullets": [
          "Supporto per 11 lingue",
          "Supporto RTL per l'arabo",
          "Rilevamento automatico della lingua",
          "Cambio lingua con un clic"
        ]
      }
    ],
    "howItWorks": {
      "label": "COME FUNZIONA",
      "title": "Il tuo menu digitale pronto in 3 passaggi",
      "steps": [
        {
          "title": "Registrati",
          "desc": "Crea un account gratuito e inserisci il tuo ristorante."
        },
        {
          "title": "Crea il Tuo Menu",
          "desc": "Aggiungi i tuoi prodotti, foto e prezzi. Scegli il tuo tema."
        },
        {
          "title": "Condividi il Tuo QR Code",
          "desc": "Posiziona i QR code sui tavoli. I clienti li scansionano per accedere al menu."
        }
      ]
    },
    "pricing": {
      "label": "PREZZI",
      "title": "Prezzi trasparenti e senza sorprese",
      "subtitle": "Un solo pacchetto. Tutti i moduli, tutte le funzionalità incluse. Nessun costo nascosto.",
      "period": "Annuale",
      "price": "$120",
      "currency": "$",
      "note": "Tutte le funzionalità incluse nel prezzo",
      "features": [
        "30+ temi professionali",
        "Supporto per 11 lingue",
        "Ordini online e al tavolo illimitati",
        "Sistema di prenotazione online",
        "Chiamata cameriere",
        "Ordini via WhatsApp e asporto",
        "Gestione campagne e sconti",
        "Sistema di sondaggi clienti",
        "Azioni con verifica della posizione",
        "Notifiche push",
        "Supporto tecnico 24/7",
        "Garanzia di rimborso 30 giorni"
      ],
      "cta": "Inizia ora",
      "secondary": "Guarda la demo",
      "taxNote": "IVA inclusa.",
      "refund": "Rimborso 30 giorni",
      "support": "Supporto 24/7",
      "instant": "Attivazione immediata"
    },
    "cta": {
      "title": "Ottieni il tuo menu digitale con LiwaMenu oggi!",
      "subtitle": "Garanzia di rimborso entro 30 giorni!",
      "button": "Inizia ora"
    },
    "footer": {
      "product": "Prodotto",
      "resources": "Risorse",
      "company": "Azienda",
      "features": "Funzionalità",
      "pricing": "Prezzi",
      "themes": "Temi",
      "support": "Supporto",
      "contact": "Contatti",
      "wpContact": "Contatto WhatsApp",
      "terms": "Termini di servizio",
      "rights": "Tutti i diritti riservati.",
      "desc": "Soluzione di menu digitale moderna per ristoranti. 30+ temi, 11 lingue, gestione completa degli ordini.",
      "termsModal": {
        "title": "Termini di servizio",
        "intro": "Utilizzando i servizi LiwaMenu, accetti i termini riportati di seguito. Ti invitiamo a leggerli attentamente.",
        "sections": [
          {
            "title": "1. Uso Lecito",
            "body": "Il Cliente accetta di utilizzare la piattaforma LiwaMenu esclusivamente per la vendita legale di prodotti e servizi. Sono severamente vietati: la commercializzazione di contenuti, prodotti o servizi illegali; la vendita di alimenti contraffatti, non sicuri o di contrabbando; l'offerta di prodotti alcolici o tabacchi privi di licenza; nonché qualsiasi attività che violi le leggi vigenti."
          },
          {
            "title": "2. Divieto di Utilizzo Non Conforme",
            "body": "Il sistema è progettato per soddisfare le esigenze di menu digitale, ordinazione, prenotazione e coinvolgimento dei clienti di ristoranti, caffè e attività di ristorazione. Non può essere utilizzato per attività di gioco d'azzardo, lotterie, transazioni in criptovalute, intermediazione finanziaria o qualsiasi attività illecita. In caso di rilevamento, il contratto potrà essere risolto unilateralmente."
          },
          {
            "title": "3. Continuità del Servizio",
            "body": "LiwaMenu punta alla massima disponibilità possibile avvalendosi di infrastrutture moderne. Tuttavia, a causa di interruzioni dei provider cloud, dipendenze da terze parti (Firebase, provider SMS, sistemi di pagamento, ISP, ecc.), finestre di manutenzione programmate o eventi di forza maggiore imprevisti, il sistema potrebbe raramente subire periodi di inattività temporanea."
          },
          {
            "title": "4. Limitazione di Responsabilità",
            "body": "Il Cliente riconosce che Liwa Yazılım San. Tic. Ltd. Şirketi non potrà essere ritenuta responsabile per eventuali perdite commerciali dirette o indirette, ordini persi, prenotazioni annullate, mancati profitti o danni reputazionali che possano verificarsi durante interruzioni straordinarie o disservizi tecnici. La nostra azienda non assume alcuna responsabilità di risarcimento, rimborso o altra obbligazione finanziaria durante tali periodi."
          },
          {
            "title": "5. Sicurezza dei Dati e Responsabilità dell'Account",
            "body": "I dati del Cliente sono protetti con crittografia SSL e vengono sottoposti a backup regolari. Le credenziali dell'account (nome utente, password, chiavi API) devono essere condivise esclusivamente con il personale autorizzato. Tutti i danni derivanti da accesso non autorizzato o uso improprio dell'account sono di responsabilità del titolare dell'account."
          },
          {
            "title": "6. Proprietà Intellettuale",
            "body": "La piattaforma LiwaMenu, il codice sorgente, i design, i loghi e tutti gli elementi visivi sono proprietà intellettuale di Liwa Yazılım San. Tic. Ltd. Şirketi. Non possono essere copiati, distribuiti o utilizzati in opere derivate senza esplicita autorizzazione."
          },
          {
            "title": "7. Aggiornamento dei Termini",
            "body": "Liwa Yazılım San. Tic. Ltd. Şirketi si riserva il diritto di aggiornare i presenti termini di servizio senza preavviso. I termini aggiornati entrano in vigore alla data di pubblicazione sul sito web; i clienti che continuano a utilizzare il servizio sono da ritenersi accettanti dei nuovi termini."
          }
        ],
        "footer": "Accettando questo accordo, dichiari di utilizzare i servizi LiwaMenu nel rispetto dei termini sopra indicati.",
        "close": "Chiudi"
      }
    }
  },
  ar: {
    "nav": {
      "features": "المميزات",
      "themes": "الثيمات",
      "howItWorks": "كيف يعمل",
      "pricing": "الأسعار",
      "contact": "تواصل معنا",
      "startFree": "ابدأ مجاناً",
      "login": "لوحة التحكم"
    },
    "hero": {
      "title1": "سرّع طلباتك،",
      "titleHighlight": "حوّل مطعمك إلى الرقمي",
      "title2": "",
      "subtitle": "دع عملاءك يصلون إلى قائمتك فوراً عبر رمز QR. أكثر من 30 ثيماً احترافياً، 11 لغة، وإدارة متكاملة للطلبات.",
      "cta": "ابدأ الآن",
      "secondary": "مشاهدة العرض",
      "scanText": "امسح وجرّبها!"
    },
    "stats": {
      "themes": "ثيم احترافي",
      "languages": "لغة",
      "features": "ميزة متميزة",
      "uptime": "وقت تشغيل"
    },
    "benefits": {
      "label": "لماذا LiwaMenu؟",
      "title": "انقل مطعمك إلى العصر الرقمي",
      "subtitle": "كل ما تحتاجه في منصة واحدة",
      "cards": [
        {
          "title": "المزيد من العملاء",
          "desc": "أبهر عملاءك بقائمة طعام رقمية احترافية. ارفع ظهورك على Google."
        },
        {
          "title": "تحديثات سهلة",
          "desc": "حدّث أسعار أي فئة دفعةً واحدة بإدخال نسبة مئوية أو مبلغ ثابت."
        },
        {
          "title": "استقبل طلبات أكثر",
          "desc": "يمكن لعملائك تقديم طلباتهم بأنفسهم مباشرةً من القائمة، مما يُسرّع عملية الطلب ويتيح لهم الطلب بسهولة دون انتظار، ويخفف الضغط على الخدمة. قدّم خدمة أكثر كفاءةً بعدد أقل من الموظفين، واستقبل طلبات أكثر لتنمية إيراداتك."
        },
        {
          "title": "انشر على موقعك",
          "desc": "ادمج قائمتك في موقعك الإلكتروني بسهولة باستخدام أكواد iframe الجاهزة."
        },
        {
          "title": "نظام الحجز",
          "desc": "دع العملاء يحجزون طاولاتهم أونلاين. التحقق عبر البريد الإلكتروني يمنع الحجوزات الوهمية. تتوافق خيارات الحجز تلقائياً مع أيام وساعات عملك."
        },
        {
          "title": "رابط مراجعات Google",
          "desc": "شارك ملفك التجاري على Google ورابط المراجعات لتعزيز ظهورك في نتائج البحث."
        }
      ]
    },
    "features": {
      "label": "المميزات",
      "title": "ميزات شاملة تلبّي كل احتياج",
      "subtitle": "جميع الأدوات التي تحتاجها لرقمنة مطعمك في منصة واحدة",
      "items": [
        {
          "title": "أكثر من 30 قالبًا احترافيًا",
          "desc": "أكثر من 30 قالبًا مصمَّمًا بعناية. من المطاعم الفاخرة إلى الوجبات السريعة، ومن المقاهي إلى مطاعم السوشي — تصميم لكل مفهوم.",
          "icon": "palette"
        },
        {
          "title": "دعم 11 لغة",
          "desc": "دعم اللغات التركية والإنجليزية والألمانية والفرنسية والإيطالية والإسبانية والعربية (RTL) والأذربيجانية والروسية واليونانية والصينية.",
          "icon": "languages"
        },
        {
          "title": "وصول فوري عبر QR",
          "desc": "يمسح عملاؤك رمز QR على الطاولة ليصلوا إلى قائمتك فورًا. لا حاجة لتنزيل أي تطبيق.",
          "icon": "qrcode"
        },
        {
          "title": "الطلب الإلكتروني والسلة",
          "desc": "نظام طلب متكامل مع خيارات الحصص والإضافات والملاحظات الخاصة وحساب الأسعار.",
          "icon": "cart"
        },
        {
          "title": "نظام الحجز",
          "desc": "حجز إلكتروني بالتاريخ والوقت وعدد الضيوف. رمز تحقق بالبريد الإلكتروني وإيصال تأكيد.",
          "icon": "calendar"
        },
        {
          "title": "استدعاء النادل",
          "desc": "استدعاء النادل بلمسة واحدة. خدمة احترافية مع تحديد السبب وحماية من الإساءة.",
          "icon": "bell"
        },
        {
          "title": "معلومات المواد المسببة للحساسية",
          "desc": "إفصاح عن 14 مادة مسببة للحساسية وفق اللوائح الأوروبية. امتثال قانوني مع التمييز بين «يحتوي على» و«قد يحتوي على».",
          "icon": "shield"
        },
        {
          "title": "استطلاعات العملاء",
          "desc": "تقييمات بالنجوم للطعام والخدمة والأجواء والمزيد. اجمع آراء قيّمة من عملائك.",
          "icon": "star"
        },
        {
          "title": "الحملات والخصومات",
          "desc": "أسعار حملات على مستوى المنتج، ومعدلات خصم منفصلة للطاولات والطلبات الإلكترونية وتسعير خاص.",
          "icon": "discount"
        },
        {
          "title": "إجراءات مرتبطة بالموقع",
          "desc": "يُتحقق من استدعاءات النادل والطلبات بناءً على موقع المطعم. لا يُسمح بالإجراءات خارج النطاق الجغرافي.",
          "icon": "location"
        },
        {
          "title": "التكامل مع وسائل التواصل الاجتماعي",
          "desc": "روابط Instagram وFacebook وTikTok وYouTube وWhatsApp للوصول إلى عملائك.",
          "icon": "social"
        },
        {
          "title": "طلبات التوصيل",
          "desc": "يمكن لعملائك تقديم طلبات توصيل مع عنوان التسليم ورقم الهاتف والملاحظات الخاصة لتوصيل سهل. يُرسَل موقع العميل إلى المطعم مع الطلب.",
          "icon": "truck"
        },
        {
          "title": "الطلب عبر WhatsApp",
          "desc": "أرسل الطلبات عبر WhatsApp بنقرة واحدة. تواصل سريع وسهل ومباشر. يُرسَل موقع العميل إلى المطعم مع الطلب.",
          "icon": "whatsapp"
        },
        {
          "title": "إعلانات المناسبات الخاصة",
          "desc": "اعرض إعلانات مخصصة للأعياد وأعياد الميلاد والفعاليات الخاصة لعملائك.",
          "icon": "megaphone"
        },
        {
          "title": "قائمة طعام حسب الوقت",
          "desc": "اعرض قوائم الإفطار والغداء والعشاء تلقائيًا بحسب وقت اليوم. يتكيّف مع ساعات العمل.",
          "icon": "clock"
        },
        {
          "title": "رابط مراجعة Google",
          "desc": "شارك ملفك التجاري على Google ورابط المراجعة لتعزيز ظهورك على Google.",
          "icon": "google"
        }
      ]
    },
    "themes": {
      "label": "الثيمات",
      "title": "أكثر من 30 ثيم احترافي مصمم خصيصًا لمطعمك",
      "subtitle": "كل ثيم متوافق مع الجوّال، سريع ويدعم جميع الميزات. من المطاعم الفاخرة إلى الوجبات السريعة — مناسب لكل مفهوم.",
      "cta": "استعرض جميع الثيمات"
    },
    "featureDetails": [
      {
        "label": "نظام الطلبات",
        "title": "من الطاولة أو أونلاين، الطلب أصبح أيسر من أي وقت",
        "desc": "يمكن للعملاء اختيار الأحجام، وإضافة الإضافات، وكتابة طلبات خاصة، وإضافتها إلى السلة. خيارات الطلب على الطاولة والتوصيل الإلكتروني، مع معدلات خصم متنوعة وطرق دفع متعددة لتجربة طلب متكاملة.",
        "bullets": [
          "اختيار الحجم والإضافات",
          "إدارة سلة التسوق",
          "طلبات الطاولة والإنترنت",
          "احتساب السعر في الوقت الفعلي",
          "قبول الطلبات بناءً على الموقع الجغرافي",
          "استقبال الطلبات عبر WhatsApp",
          "إكرامية المندوب",
          "إضافة موقع العميل إلى الطلب",
          "ميزة خصم اختياري على السلة"
        ]
      },
      {
        "label": "الحجوزات",
        "title": "احجز طاولتك عبر الحجز الإلكتروني",
        "desc": "يمكن للعملاء إجراء الحجوزات أونلاين دون الحاجة إلى الاتصال. اختيار التاريخ والفترة الزمنية وعدد الضيوف والطلبات الخاصة. آمن بتحقق البريد الإلكتروني، واحترافي بإيصال تأكيد قابل للطباعة.",
        "bullets": [
          "منتقي تاريخ بالتقويم",
          "فترات زمنية مرنة",
          "رمز تحقق بالبريد الإلكتروني",
          "إيصال تأكيد قابل للطباعة",
          "متوافق مع أوقات عمل المطعم",
          "إعدادات حد الحجوزات"
        ]
      },
      {
        "label": "قائمة متعددة اللغات",
        "title": "تواصل مع العملاء العالميين بلا حواجز لغوية",
        "desc": "اخدم ضيوفك الأجانب بلغتهم مع قوائم بـ11 لغة. دعم كامل للكتابة من اليمين إلى اليسار (RTL) للغة العربية. اكتشاف تلقائي للغة المتصفح وتبديل سهل بين اللغات.",
        "bullets": [
          "دعم 11 لغة",
          "دعم العربية RTL",
          "اكتشاف اللغة تلقائيًا",
          "تبديل اللغة بنقرة واحدة"
        ]
      }
    ],
    "howItWorks": {
      "label": "كيف يعمل",
      "title": "قائمتك الرقمية جاهزة في 3 خطوات",
      "steps": [
        {
          "title": "سجّل حسابك",
          "desc": "أنشئ حسابًا مجانيًا وحدّد بيانات مطعمك."
        },
        {
          "title": "أنشئ قائمتك",
          "desc": "أضف منتجاتك وصورك وأسعارك، ثم اختر ثيمك المفضل."
        },
        {
          "title": "شارك رمز QR الخاص بك",
          "desc": "ضع رموز QR على طاولاتك. يمسحها العملاء للوصول إلى القائمة."
        }
      ]
    },
    "pricing": {
      "label": "الأسعار",
      "title": "تسعير شفاف وبسيط",
      "subtitle": "باقة واحدة. جميع الوحدات وجميع الميزات مشمولة. لا رسوم خفية.",
      "period": "سنويًا",
      "price": "$120",
      "currency": "$",
      "note": "جميع الميزات مشمولة في السعر",
      "features": [
        "أكثر من 30 قالب احترافي",
        "دعم 11 لغة",
        "طلبات غير محدودة عبر الإنترنت وعلى الطاولة",
        "نظام حجز إلكتروني",
        "استدعاء النادل",
        "طلبات عبر WhatsApp والطلبات الخارجية",
        "إدارة الحملات والخصومات",
        "نظام استطلاع العملاء",
        "إجراءات التحقق من الموقع",
        "إشعارات فورية",
        "دعم فني على مدار الساعة 24/7",
        "ضمان استرداد الأموال خلال 30 يومًا"
      ],
      "cta": "ابدأ الآن",
      "secondary": "عرض تجريبي",
      "taxNote": "الضريبة مشمولة.",
      "refund": "استرداد خلال 30 يومًا",
      "support": "دعم 24/7",
      "instant": "تفعيل فوري"
    },
    "cta": {
      "title": "احصل على قائمتك الرقمية مع LiwaMenu اليوم!",
      "subtitle": "ضمان استرداد الأموال خلال 30 يومًا!",
      "button": "ابدأ الآن"
    },
    "footer": {
      "product": "المنتج",
      "resources": "الموارد",
      "company": "الشركة",
      "features": "الميزات",
      "pricing": "الأسعار",
      "themes": "القوالب",
      "support": "الدعم",
      "contact": "تواصل معنا",
      "wpContact": "التواصل عبر WhatsApp",
      "terms": "شروط الخدمة",
      "rights": "جميع الحقوق محفوظة.",
      "desc": "حل القائمة الرقمية الحديثة للمطاعم. أكثر من 30 قالب، 11 لغة، وإدارة متكاملة للطلبات.",
      "termsModal": {
        "title": "شروط الخدمة",
        "intro": "باستخدامك لخدمات LiwaMenu، فإنك توافق على الشروط الواردة أدناه. يُرجى القراءة بعناية.",
        "sections": [
          {
            "title": "1. الاستخدام المشروع",
            "body": "يوافق العميل على استخدام منصة LiwaMenu حصراً لبيع المنتجات والخدمات المشروعة. يُحظر تماماً تسويق المحتوى أو المنتجات أو الخدمات غير القانونية، أو بيع المواد الغذائية المزيفة أو الضارة أو المهرَّبة، أو تقديم منتجات الكحول أو التبغ غير المرخَّصة، أو ممارسة أي نشاط يخالف القوانين والتشريعات النافذة."
          },
          {
            "title": "2. حظر الاستخدام خارج النطاق المقصود",
            "body": "صُمِّم النظام لتلبية احتياجات المطاعم والمقاهي ومنشآت الأغذية في مجالات القائمة الرقمية والطلبات والحجوزات والتفاعل مع العملاء. لا يجوز استخدامه في القمار أو اليانصيب أو معاملات العملات المشفرة أو الوساطة المالية أو أي نشاط مخالف للقانون. وفي حال اكتشاف ذلك، يجوز إنهاء العقد بصورة أحادية."
          },
          {
            "title": "3. استمرارية الخدمة",
            "body": "تسعى LiwaMenu إلى تحقيق أعلى معدل توافر ممكن باستخدام بنية تحتية حديثة. غير أنه بسبب انقطاعات مزود الخدمة السحابية، أو الاعتماديات على أطراف ثالثة (Firebase ومزودو الرسائل النصية وأنظمة الدفع ومزودو خدمة الإنترنت وغيرها)، أو نوافذ الصيانة المجدولة، أو أحداث القوة القاهرة غير المتوقعة، قد يتعرض النظام لفترات توقف مؤقتة نادرة."
          },
          {
            "title": "4. تحديد المسؤولية",
            "body": "يقرّ العميل بأن شركة Liwa Yazılım San. Tic. Ltd. Şirketi لا تتحمل المسؤولية عن أي خسائر تجارية مباشرة أو غير مباشرة، أو فقدان الطلبات، أو إلغاء الحجوزات، أو ضياع الأرباح، أو الأضرار التي تلحق بالسمعة والتي قد تنشأ خلال فترات الانقطاع الاستثنائية أو التعطلات التقنية. ولا تتحمل شركتنا أي تعويض أو استرداد أو التزام مالي آخر خلال هذه الفترات."
          },
          {
            "title": "5. أمن البيانات ومسؤولية الحساب",
            "body": "تُحمى بيانات العملاء بتشفير SSL وتُنسَخ احتياطياً بانتظام. يجب مشاركة بيانات اعتماد الحساب (اسم المستخدم وكلمة المرور ومفاتيح API) مع الأفراد المخوَّلين فحسب. يتحمل صاحب الحساب المسؤولية الكاملة عن جميع الأضرار الناجمة عن الوصول غير المصرح به أو إساءة استخدام الحساب."
          },
          {
            "title": "6. الملكية الفكرية",
            "body": "منصة LiwaMenu والشيفرة المصدرية والتصاميم والشعارات وجميع العناصر المرئية هي ملكية فكرية خالصة لشركة Liwa Yazılım San. Tic. Ltd. Şirketi. ولا يجوز نسخها أو توزيعها أو استخدامها في أعمال مشتقة دون الحصول على إذن مسبق."
          },
          {
            "title": "7. تحديثات الشروط",
            "body": "تحتفظ شركة Liwa Yazılım San. Tic. Ltd. Şirketi بالحق في تحديث شروط الخدمة هذه دون إشعار مسبق. تدخل الشروط المحدَّثة حيز التنفيذ اعتباراً من تاريخ نشرها على الموقع الإلكتروني، ويُعدّ العملاء المستمرون في استخدام الخدمة قابلين للشروط الجديدة."
          }
        ],
        "footer": "بقبول هذه الاتفاقية، فإنك توافق على استخدام خدمات LiwaMenu وفق الشروط المذكورة أعلاه.",
        "close": "إغلاق"
      }
    }
  },
  ru: {
    "nav": {
      "features": "Возможности",
      "themes": "Темы",
      "howItWorks": "Как это работает",
      "pricing": "Цены",
      "contact": "Контакты",
      "startFree": "Начать бесплатно",
      "login": "Панель управления"
    },
    "hero": {
      "title1": "Ускорьте приём заказов,",
      "titleHighlight": "Переведите ресторан в цифровой формат",
      "title2": "",
      "subtitle": "Дайте гостям мгновенный доступ к меню через QR-код. Более 30 профессиональных тем, 11 языков и полное управление заказами.",
      "cta": "Начать",
      "secondary": "Посмотреть демо",
      "scanText": "Сканируйте и попробуйте!"
    },
    "stats": {
      "themes": "Профессиональных тем",
      "languages": "Языков",
      "features": "Премиум-функций",
      "uptime": "Время работы"
    },
    "benefits": {
      "label": "ПОЧЕМУ LIWAMENU?",
      "title": "Переведите ваш ресторан в цифровую эпоху",
      "subtitle": "Всё необходимое в одной платформе",
      "cards": [
        {
          "title": "Больше клиентов",
          "desc": "Произведите впечатление профессиональным цифровым меню. Повысьте свою видимость в Google."
        },
        {
          "title": "Лёгкое обновление",
          "desc": "Обновляйте цены в любых категориях одним действием — задайте процент или фиксированную сумму."
        },
        {
          "title": "Принимайте больше заказов",
          "desc": "Гости могут самостоятельно оформлять заказы прямо из меню. Это ускоряет процесс, позволяет клиентам заказывать без ожидания и снижает нагрузку на персонал. Работайте эффективнее с меньшим числом сотрудников и увеличивайте выручку за счёт большего числа заказов."
        },
        {
          "title": "Разместите на своём сайте",
          "desc": "Встройте меню на ваш сайт с помощью готовых iframe-кодов."
        },
        {
          "title": "Система бронирования",
          "desc": "Принимайте онлайн-бронирования от гостей. Подтверждение по электронной почте исключает фиктивные заявки. Параметры бронирования соответствуют вашим рабочим дням и часам."
        },
        {
          "title": "Ссылка на отзыв в Google",
          "desc": "Делитесь ссылкой на бизнес-профиль Google и страницу отзывов, чтобы повысить видимость в поиске."
        }
      ]
    },
    "features": {
      "label": "ВОЗМОЖНОСТИ",
      "title": "Широкий набор функций для любых задач",
      "subtitle": "Все инструменты для цифровизации вашего ресторана в одной платформе",
      "items": [
        {
          "title": "30+ профессиональных тем",
          "desc": "30+ тщательно продуманных тем. От ресторанов высокой кухни до фастфуда, от кафе до суши-баров — дизайн для любой концепции.",
          "icon": "palette"
        },
        {
          "title": "Поддержка 11 языков",
          "desc": "Поддержка турецкого, английского, немецкого, французского, итальянского, испанского, арабского (RTL), азербайджанского, русского, греческого и китайского языков.",
          "icon": "languages"
        },
        {
          "title": "Мгновенный доступ по QR-коду",
          "desc": "Гости сканируют QR-код на столике и сразу открывают ваше меню. Скачивать приложение не нужно.",
          "icon": "qrcode"
        },
        {
          "title": "Онлайн-заказ и корзина",
          "desc": "Полнофункциональный заказ с выбором порций, дополнениями, особыми пожеланиями и автоматическим расчётом стоимости.",
          "icon": "cart"
        },
        {
          "title": "Система бронирования",
          "desc": "Онлайн-бронирование с указанием даты, времени и числа гостей. Подтверждение по email и квитанция о резервации.",
          "icon": "calendar"
        },
        {
          "title": "Вызов официанта",
          "desc": "Один касанием — и официант уже идёт. Профессиональный сервис с указанием причины вызова и защитой от спама.",
          "icon": "bell"
        },
        {
          "title": "Информация об аллергенах",
          "desc": "Декларация 14 основных аллергенов по стандарту ЕС. Юридическое соответствие с разграничением «Содержит» и «Может содержать».",
          "icon": "shield"
        },
        {
          "title": "Опросы гостей",
          "desc": "Звёздный рейтинг блюд, сервиса, атмосферы и других параметров. Собирайте ценные отзывы.",
          "icon": "star"
        },
        {
          "title": "Акции и скидки",
          "desc": "Акционные цены на уровне позиций, раздельные скидки для зала и онлайн-заказов, специальное ценообразование.",
          "icon": "discount"
        },
        {
          "title": "Действия с проверкой локации",
          "desc": "Вызовы официанта и заказы верифицируются по геолокации ресторана. Действия за пределами заведения не допускаются.",
          "icon": "location"
        },
        {
          "title": "Интеграция с социальными сетями",
          "desc": "Ссылки на Instagram, Facebook, TikTok, YouTube и WhatsApp для привлечения гостей.",
          "icon": "social"
        },
        {
          "title": "Заказы навынос",
          "desc": "Гости могут оформить заказ навынос с указанием адреса доставки, телефона и особых пожеланий. Местоположение клиента передаётся в ресторан вместе с заказом.",
          "icon": "truck"
        },
        {
          "title": "Заказ через WhatsApp",
          "desc": "Отправьте заказ через WhatsApp одним нажатием. Быстрое, удобное и прямое общение. Местоположение клиента передаётся в ресторан вместе с заказом.",
          "icon": "whatsapp"
        },
        {
          "title": "Объявления в особые дни",
          "desc": "Показывайте персонализированные сообщения гостям в праздники, дни рождения и по случаю специальных мероприятий.",
          "icon": "megaphone"
        },
        {
          "title": "Меню по времени суток",
          "desc": "Меню завтрака, обеда и ужина автоматически переключается в зависимости от времени. Адаптируется к часам работы.",
          "icon": "clock"
        },
        {
          "title": "Ссылка на отзывы в Google",
          "desc": "Делитесь профилем вашего заведения в Google и ссылкой на отзывы, чтобы повысить видимость в поиске.",
          "icon": "google"
        }
      ]
    },
    "themes": {
      "label": "ТЕМЫ",
      "title": "30+ профессиональных тем, созданных для вашего ресторана",
      "subtitle": "Каждая тема адаптирована для мобильных устройств, работает быстро и поддерживает все функции. От изысканной кухни до фастфуда — подходит для любой концепции.",
      "cta": "Смотреть все темы"
    },
    "featureDetails": [
      {
        "label": "СИСТЕМА ЗАКАЗОВ",
        "title": "С места или онлайн — заказывать теперь проще простого",
        "desc": "Гости могут выбирать порции, добавлять опции, оставлять особые пожелания и складывать всё в корзину. Заказы за столиком и онлайн-доставка, разные ставки скидок и способы оплаты — полноценный опыт заказа.",
        "bullets": [
          "Выбор порции и дополнений",
          "Управление корзиной",
          "Заказы за столиком и онлайн",
          "Расчёт цены в реальном времени",
          "Приём заказов с учётом геолокации",
          "Приём заказов через WhatsApp",
          "Чаевые для курьера",
          "Добавление адреса клиента к заказу",
          "Необязательная скидка на корзину"
        ]
      },
      {
        "label": "БРОНИРОВАНИЕ",
        "title": "Резервируйте столик онлайн без звонков",
        "desc": "Гости бронируют столик онлайн, не снимая трубку. Выбор даты, временного слота, количества гостей и особых пожеланий. Верификация по электронной почте обеспечивает безопасность, а подтверждение с квитанцией — профессионализм.",
        "bullets": [
          "Выбор даты через календарь",
          "Гибкие временные слоты",
          "Код подтверждения на email",
          "Квитанция бронирования для печати",
          "Синхронизация с режимом работы ресторана",
          "Настройка лимита бронирований"
        ]
      },
      {
        "label": "МНОГОЯЗЫЧНОЕ МЕНЮ",
        "title": "Привлекайте гостей со всего мира без языкового барьера",
        "desc": "Обслуживайте иностранных гостей на их родном языке — меню доступно на 11 языках. Полная поддержка письма справа налево (RTL) для арабского. Автоматическое определение языка браузера и удобное переключение.",
        "bullets": [
          "Поддержка 11 языков",
          "Поддержка RTL для арабского",
          "Автоматическое определение языка",
          "Смена языка в один клик"
        ]
      }
    ],
    "howItWorks": {
      "label": "КАК ЭТО РАБОТАЕТ",
      "title": "Ваше цифровое меню за 3 шага",
      "steps": [
        {
          "title": "Зарегистрируйтесь",
          "desc": "Создайте бесплатный аккаунт и добавьте свой ресторан."
        },
        {
          "title": "Создайте меню",
          "desc": "Добавьте блюда, фотографии и цены. Выберите тему оформления."
        },
        {
          "title": "Поделитесь QR-кодом",
          "desc": "Разместите QR-коды на столиках. Гости сканируют и сразу открывают меню."
        }
      ]
    },
    "pricing": {
      "label": "ТАРИФЫ",
      "title": "Прозрачные и простые цены",
      "subtitle": "Один тариф. Все модули, все функции включены. Никаких скрытых платежей.",
      "period": "В год",
      "price": "$120",
      "currency": "$",
      "note": "Все функции включены в стоимость",
      "features": [
        "30+ профессиональных тем",
        "Поддержка 11 языков",
        "Неограниченные онлайн-заказы и заказы за столиком",
        "Система онлайн-бронирования",
        "Вызов официанта",
        "Заказы через WhatsApp и навынос",
        "Управление акциями и скидками",
        "Система опросов клиентов",
        "Действия с проверкой местоположения",
        "Push-уведомления",
        "Техническая поддержка 24/7",
        "Гарантия возврата денег в течение 30 дней"
      ],
      "cta": "Начать",
      "secondary": "Смотреть демо",
      "taxNote": "Налог включён.",
      "refund": "Возврат за 30 дней",
      "support": "Поддержка 24/7",
      "instant": "Мгновенная активация"
    },
    "cta": {
      "title": "Получите цифровое меню с LiwaMenu уже сегодня!",
      "subtitle": "Гарантия возврата денег в течение 30 дней!",
      "button": "Начать"
    },
    "footer": {
      "product": "Продукт",
      "resources": "Ресурсы",
      "company": "Компания",
      "features": "Возможности",
      "pricing": "Цены",
      "themes": "Темы",
      "support": "Поддержка",
      "contact": "Контакты",
      "wpContact": "Связаться через WhatsApp",
      "terms": "Условия использования",
      "rights": "Все права защищены.",
      "desc": "Современное решение цифрового меню для ресторанов. 30+ тем, 11 языков, полное управление заказами.",
      "termsModal": {
        "title": "Условия использования",
        "intro": "Используя сервис LiwaMenu, вы соглашаетесь с приведёнными ниже условиями. Пожалуйста, внимательно прочитайте их.",
        "sections": [
          {
            "title": "1. Законное использование",
            "body": "Клиент соглашается использовать платформу LiwaMenu исключительно для законной продажи товаров и услуг. Категорически запрещается: продвигать незаконный контент, товары или услуги; продавать контрафактные, небезопасные или контрабандные продукты питания; предлагать алкоголь или табачную продукцию без лицензии; а также осуществлять любую деятельность, нарушающую действующее законодательство."
          },
          {
            "title": "2. Запрет нецелевого использования",
            "body": "Система разработана для удовлетворения потребностей ресторанов, кафе и предприятий общественного питания в области цифровых меню, приёма заказов, бронирования и взаимодействия с клиентами. Использование системы в целях организации азартных игр, лотерей, операций с криптовалютой, финансового посредничества или иной незаконной деятельности недопустимо. При выявлении подобных фактов договор может быть расторгнут в одностороннем порядке."
          },
          {
            "title": "3. Непрерывность обслуживания",
            "body": "LiwaMenu стремится обеспечить максимально возможную доступность сервиса, используя современную инфраструктуру. Тем не менее из-за сбоев у облачных провайдеров, зависимостей от сторонних сервисов (Firebase, SMS-провайдеры, платёжные системы, интернет-провайдеры и пр.), плановых технических работ или непредвиденных обстоятельств непреодолимой силы в редких случаях возможны временные перебои в работе системы."
          },
          {
            "title": "4. Ограничение ответственности",
            "body": "Клиент принимает к сведению, что Liwa Yazılım San. Tic. Ltd. Şirketi не несёт ответственности за прямые или косвенные коммерческие убытки, потерю заказов, отмену бронирований, упущенную выгоду или ущерб деловой репутации, которые могут возникнуть в период чрезвычайных сбоев или технических неполадок. Компания не принимает на себя никаких обязательств по возмещению ущерба, возврату средств или иной финансовой ответственности в подобных случаях."
          },
          {
            "title": "5. Безопасность данных и ответственность за аккаунт",
            "body": "Данные клиентов защищены SSL-шифрованием и регулярно резервируются. Учётные данные аккаунта (имя пользователя, пароль, ключи API) должны передаваться исключительно уполномоченным сотрудникам. Весь ущерб, причинённый вследствие несанкционированного доступа или злоупотребления аккаунтом, лежит на ответственности владельца аккаунта."
          },
          {
            "title": "6. Интеллектуальная собственность",
            "body": "Платформа LiwaMenu, исходный код, дизайн, логотипы и все визуальные элементы являются интеллектуальной собственностью Liwa Yazılım San. Tic. Ltd. Şirketi. Их копирование, распространение или использование в производных работах без разрешения запрещено."
          },
          {
            "title": "7. Обновление условий",
            "body": "Liwa Yazılım San. Tic. Ltd. Şirketi оставляет за собой право вносить изменения в настоящие условия использования без предварительного уведомления. Обновлённые условия вступают в силу с даты их публикации на сайте; клиенты, продолжающие пользоваться сервисом, считаются принявшими новые условия."
          }
        ],
        "footer": "Принимая это соглашение, вы подтверждаете, что будете пользоваться сервисами LiwaMenu в соответствии с изложенными выше условиями.",
        "close": "Закрыть"
      }
    }
  },
  bg: {
    "nav": {
      "features": "Функции",
      "themes": "Теми",
      "howItWorks": "Как работи",
      "pricing": "Ценообразуване",
      "contact": "Контакт",
      "startFree": "Започнете безплатно",
      "login": "Административен панел"
    },
    "hero": {
      "title1": "Ускорете поръчките,",
      "titleHighlight": "Дигитализирайте своя ресторант",
      "title2": "",
      "subtitle": "Нека клиентите ви достигат до менюто мигновено чрез QR код. 30+ професионални теми, 11 езика и пълно управление на поръчките.",
      "cta": "Започнете сега",
      "secondary": "Вижте демото",
      "scanText": "Сканирайте и изпробвайте!"
    },
    "stats": {
      "themes": "Професионални теми",
      "languages": "Езика",
      "features": "Премиум функции",
      "uptime": "Безпрекъсната работа"
    },
    "benefits": {
      "label": "ЗАЩО LIWAMENU?",
      "title": "Въведете своя ресторант в дигиталната ера",
      "subtitle": "Всичко необходимо в една единствена платформа",
      "cards": [
        {
          "title": "Повече клиенти",
          "desc": "Впечатлете клиентите си с професионално дигитално меню. Повишете видимостта си в Google."
        },
        {
          "title": "Лесно актуализиране",
          "desc": "Актуализирайте цените за всяка категория с едно действие, като въведете процент или фиксирана сума."
        },
        {
          "title": "Приемайте повече поръчки",
          "desc": "Клиентите ви могат сами да правят поръчки директно от менюто. Това ускорява процеса на поръчване, позволява на гостите да поръчват лесно без чакане и намалява натоварването на персонала. Обслужвате по-ефективно с по-малко служители и увеличавате приходите, като приемате повече поръчки."
        },
        {
          "title": "Публикувайте на своя сайт",
          "desc": "Вградете менюто си в собствения си уебсайт с готови iframe кодове."
        },
        {
          "title": "Система за резервации",
          "desc": "Позволете на клиентите да правят онлайн резервации. Имейл верификацията предотвратява фалшиви резервации. Опциите за резервация са съобразени с работните ви дни и часове."
        },
        {
          "title": "Връзка към Google отзиви",
          "desc": "Споделете своя бизнес профил в Google и връзката за отзиви, за да повишите видимостта си в Google."
        }
      ]
    },
    "features": {
      "label": "ФУНКЦИИ",
      "title": "Изчерпателни функции за всяка потребност",
      "subtitle": "Всички инструменти, необходими за дигитализиране на вашия ресторант, в една платформа",
      "items": [
        {
          "title": "30+ Професионални Теми",
          "desc": "30+ внимателно разработени теми. От изисканата кухня до бързото хранене, от кафенета до суши ресторанти — дизайн за всяка концепция.",
          "icon": "palette"
        },
        {
          "title": "Поддръжка на 11 Езика",
          "desc": "Поддръжка на турски, английски, немски, френски, италиански, испански, арабски (RTL), азербайджански, руски, гръцки и китайски.",
          "icon": "languages"
        },
        {
          "title": "Незабавен Достъп чрез QR Код",
          "desc": "Клиентите сканират QR кода на масата и незабавно достигат до менюто ви. Не е необходимо изтегляне на приложение.",
          "icon": "qrcode"
        },
        {
          "title": "Онлайн Поръчка и Количка",
          "desc": "Пълнофункционална система за поръчки с опции за порции, добавки, специални бележки и изчисляване на цената.",
          "icon": "cart"
        },
        {
          "title": "Система за Резервации",
          "desc": "Онлайн резервация с дата, час и брой гости. Код за потвърждение по имейл и разписка за потвърждение.",
          "icon": "calendar"
        },
        {
          "title": "Повикване на Сервитьор",
          "desc": "Повикайте сервитьор с едно докосване. Професионално обслужване с посочване на причина и защита от нежелани заявки.",
          "icon": "bell"
        },
        {
          "title": "Информация за Алергени",
          "desc": "Декларации за 14-те основни алергена съгласно изискванията на ЕС. Правно съответствие с разграничение «Съдържа» и «Може да съдържа».",
          "icon": "shield"
        },
        {
          "title": "Анкети за Клиенти",
          "desc": "Оценки с звезди за храна, обслужване, атмосфера и още. Събирайте ценна обратна връзка.",
          "icon": "star"
        },
        {
          "title": "Кампании и Отстъпки",
          "desc": "Промоционални цени на ниво продукт, отделни нива на отстъпки за маса и онлайн поръчки, и специално ценообразуване.",
          "icon": "discount"
        },
        {
          "title": "Действия с Проверка на Местоположение",
          "desc": "Повикванията на сервитьор и поръчките се верифицират спрямо местоположението на ресторанта. Действия извън обекта не са разрешени.",
          "icon": "location"
        },
        {
          "title": "Интеграция със Социални Медии",
          "desc": "Връзки към Instagram, Facebook, TikTok, YouTube и WhatsApp за достигане до повече клиенти.",
          "icon": "social"
        },
        {
          "title": "Поръчки за Вкъщи",
          "desc": "Клиентите могат да направят поръчка за вкъщи с адрес за доставка, телефон и специални бележки за лесна доставка. Местоположението на клиента се изпраща на ресторанта заедно с поръчката.",
          "icon": "truck"
        },
        {
          "title": "Поръчка чрез WhatsApp",
          "desc": "Изпратете поръчките си чрез WhatsApp с едно докосване. Бърза, лесна и директна комуникация. Местоположението на клиента се изпраща на ресторанта заедно с поръчката.",
          "icon": "whatsapp"
        },
        {
          "title": "Обяви за Специални Дни",
          "desc": "Показвайте персонализирани съобщения на клиентите си за празници, рождени дни и специални събития.",
          "icon": "megaphone"
        },
        {
          "title": "Меню по Час на Деня",
          "desc": "Показвайте автоматично менютата за закуска, обяд и вечеря според часа на деня. Адаптира се спрямо работното време.",
          "icon": "clock"
        },
        {
          "title": "Връзка за Google Отзиви",
          "desc": "Споделете профила на бизнеса си в Google и линка за отзиви, за да увеличите видимостта си в Google.",
          "icon": "google"
        }
      ]
    },
    "themes": {
      "label": "ТЕМИ",
      "title": "30+ професионални теми, създадени за вашия ресторант",
      "subtitle": "Всяка тема е адаптивна за мобилни устройства, бърза и поддържа всички функции. От фин ресторант до бърза храна — подходяща за всяка концепция.",
      "cta": "Разгледайте всички теми"
    },
    "featureDetails": [
      {
        "label": "СИСТЕМА ЗА ПОРЪЧКИ",
        "title": "От масата или онлайн — поръчването вече е лесно",
        "desc": "Клиентите могат да избират порции, да добавят екстри, да пишат специални заявки и да добавят в количката. Поръчки на маса и онлайн доставка, различни отстъпки и методи на плащане за пълноценно изживяване при поръчка.",
        "bullets": [
          "Избор на порция и добавки",
          "Управление на количката",
          "Поръчки на маса и онлайн",
          "Изчисляване на цената в реално време",
          "Приемане на поръчки по местоположение",
          "Приемане на поръчки чрез WhatsApp",
          "Бакшиш за куриер",
          "Добавяне на местоположение на клиента към поръчката",
          "Опционална отстъпка в количката"
        ]
      },
      {
        "label": "РЕЗЕРВАЦИИ",
        "title": "Запазете маса с онлайн резервация",
        "desc": "Клиентите могат да правят резервации онлайн, без да се налага да се обаждат. Избор на дата, час, брой гости и специални заявки. Сигурност чрез потвърждение по имейл, професионализъм с разписка за потвърждение.",
        "bullets": [
          "Избор на дата чрез календар",
          "Гъвкави часови интервали",
          "Код за потвърждение по имейл",
          "Разписка за потвърждение за печат",
          "Съобразено с работното време на ресторанта",
          "Настройки за лимит на резервации"
        ]
      },
      {
        "label": "МНОГОЕЗИЧНО МЕНЮ",
        "title": "Достигнете до глобални клиенти без езикова бариера",
        "desc": "Обслужвайте чуждестранни гости на техния език с менюта на 11 езика. Пълна поддръжка на дясно-ляво (RTL) за арабски. Автоматично разпознаване на езика на браузъра и лесна смяна на езика.",
        "bullets": [
          "Поддръжка на 11 езика",
          "Поддръжка на арабски RTL",
          "Автоматично разпознаване на езика",
          "Смяна на езика с едно кликване"
        ]
      }
    ],
    "howItWorks": {
      "label": "КАК РАБОТИ",
      "title": "Вашето дигитално меню е готово в 3 стъпки",
      "steps": [
        {
          "title": "Регистрирайте се",
          "desc": "Създайте безплатен акаунт и добавете своя ресторант."
        },
        {
          "title": "Изградете менюто си",
          "desc": "Добавете продукти, снимки и цени. Изберете своята тема."
        },
        {
          "title": "Споделете своя QR код",
          "desc": "Поставете QR кодове на масите. Клиентите сканират и отварят менюто."
        }
      ]
    },
    "pricing": {
      "label": "ЦЕНООБРАЗУВАНЕ",
      "title": "Прозрачно и просто ценообразуване",
      "subtitle": "Един пакет. Всички модули, всички функции включени. Без скрити такси.",
      "period": "Годишно",
      "price": "$120",
      "currency": "$",
      "note": "Всички функции са включени в цената",
      "features": [
        "30+ професионални теми",
        "Поддръжка на 11 езика",
        "Неограничени онлайн поръчки и поръчки на маса",
        "Онлайн система за резервации",
        "Повикване на сервитьор",
        "Поръчки чрез WhatsApp и за вкъщи",
        "Управление на кампании и отстъпки",
        "Система за клиентски анкети",
        "Действия с проверка на местоположение",
        "Push известия",
        "Техническа поддръжка 24/7",
        "30-дневна гаранция за връщане на парите"
      ],
      "cta": "Започнете сега",
      "secondary": "Вижте демото",
      "taxNote": "Данъкът е включен.",
      "refund": "Връщане за 30 дни",
      "support": "Поддръжка 24/7",
      "instant": "Незабавно активиране"
    },
    "cta": {
      "title": "Вземете своето цифрово меню с LiwaMenu още днес!",
      "subtitle": "30-дневна гаранция за връщане на парите!",
      "button": "Започнете сега"
    },
    "footer": {
      "product": "Продукт",
      "resources": "Ресурси",
      "company": "Компания",
      "features": "Функции",
      "pricing": "Ценообразуване",
      "themes": "Теми",
      "support": "Поддръжка",
      "contact": "Контакт",
      "wpContact": "Контакт чрез WhatsApp",
      "terms": "Условия за ползване",
      "rights": "Всички права запазени.",
      "desc": "Модерно решение за цифрово меню за ресторанти. 30+ теми, 11 езика, пълно управление на поръчки.",
      "termsModal": {
        "title": "Условия за ползване",
        "intro": "С използването на услугите на LiwaMenu вие се съгласявате с посочените по-долу условия. Моля, прочетете ги внимателно.",
        "sections": [
          {
            "title": "1. Законосъобразно ползване",
            "body": "Клиентът се съгласява да използва платформата LiwaMenu единствено за законни продажби на продукти и услуги. Строго е забранено предлагането на незаконно съдържание, продукти или услуги; продажбата на фалшиви, опасни или контрабандни хранителни продукти; предлагането на нелицензирани алкохолни или тютюневи изделия; или извършването на каквато и да е дейност, нарушаваща приложимото законодателство."
          },
          {
            "title": "2. Забрана за използване извън предназначението",
            "body": "Системата е предназначена за дигитални менюта, поръчки, резервации и ангажиране на клиенти на ресторанти, кафенета и заведения за хранене. Тя не може да се използва за хазарт, томболи, криптовалутни транзакции, финансово посредничество или каквато и да е незаконна дейност. При установяване на нарушение договорът може да бъде прекратен едностранно."
          },
          {
            "title": "3. Непрекъснатост на услугата",
            "body": "LiwaMenu се стреми към максимално възможна наличност, използвайки съвременна инфраструктура. Въпреки това, поради прекъсвания при доставчиците на облачни услуги, зависимости от трети страни (Firebase, SMS доставчици, платежни системи, интернет доставчици и др.), планирани прозорци за поддръжка или непредвидени форсмажорни обстоятелства, системата може рядко да изпита временни периоди на недостъпност."
          },
          {
            "title": "4. Ограничаване на отговорността",
            "body": "Клиентът признава, че Liwa Yazılım San. Tic. Ltd. Şirketi не носи отговорност за преки или косвени търговски загуби, пропуснати поръчки, отменени резервации, пропуснати приходи или увреждане на репутацията, настъпили по време на извънредни прекъсвания или технически смущения. Дружеството не поема никакво обезщетение, възстановяване на суми или друга финансова отговорност за такива периоди."
          },
          {
            "title": "5. Сигурност на данните и отговорност за акаунта",
            "body": "Данните на клиентите са защитени с SSL криптиране и се архивират редовно. Идентификационните данни за акаунта (потребителско име, парола, API ключове) трябва да се споделят само с упълномощен персонал. Всички вреди, произтичащи от неоторизиран достъп или злоупотреба с акаунт, са отговорност на притежателя на акаунта."
          },
          {
            "title": "6. Интелектуална собственост",
            "body": "Платформата LiwaMenu, изходният код, дизайните, логата и всички визуални елементи са интелектуална собственост на Liwa Yazılım San. Tic. Ltd. Şirketi. Те не могат да бъдат копирани, разпространявани или използвани в производни произведения без разрешение."
          },
          {
            "title": "7. Актуализации на условията",
            "body": "Liwa Yazılım San. Tic. Ltd. Şirketi си запазва правото да актуализира настоящите условия за ползване без предварително уведомление. Актуализираните условия влизат в сила от датата на публикуването им на уебсайта, като клиентите, които продължават да използват услугата, се считат за приели новите условия."
          }
        ],
        "footer": "С приемането на това споразумение вие се съгласявате да използвате услугите на LiwaMenu в рамките на горепосочените условия.",
        "close": "Затвори"
      }
    }
  },
  fr: {
    "nav": {
      "features": "Fonctionnalités",
      "themes": "Thèmes",
      "howItWorks": "Comment ça marche",
      "pricing": "Tarifs",
      "contact": "Contact",
      "startFree": "Commencer gratuitement",
      "login": "Panneau d'administration"
    },
    "hero": {
      "title1": "Accélérez les commandes,",
      "titleHighlight": "Digitalisez votre restaurant",
      "title2": "",
      "subtitle": "Permettez à vos clients d'accéder instantanément à votre menu via QR. Plus de 30 thèmes professionnels, 11 langues et une gestion complète des commandes.",
      "cta": "Commencer",
      "secondary": "Voir la démo",
      "scanText": "Scannez et essayez !"
    },
    "stats": {
      "themes": "Thèmes professionnels",
      "languages": "Langues",
      "features": "Fonctionnalités premium",
      "uptime": "Disponibilité"
    },
    "benefits": {
      "label": "POURQUOI LIWAMENU ?",
      "title": "Faites entrer votre restaurant dans l'ère numérique",
      "subtitle": "Tout ce dont vous avez besoin sur une seule plateforme",
      "cards": [
        {
          "title": "Plus de clients",
          "desc": "Impressionnez vos clients avec un menu numérique professionnel. Boostez votre visibilité sur Google."
        },
        {
          "title": "Mises à jour faciles",
          "desc": "Mettez à jour les prix de n'importe quelle catégorie en une seule action, en saisissant un pourcentage ou un montant fixe."
        },
        {
          "title": "Prenez plus de commandes",
          "desc": "Vos clients peuvent passer leurs propres commandes directement depuis le menu. Cela accélère le processus de commande, permet aux clients de commander facilement sans attendre et allège la charge du service. Vous servez plus efficacement avec moins de personnel et augmentez vos revenus en prenant davantage de commandes."
        },
        {
          "title": "Publiez sur votre site web",
          "desc": "Intégrez votre menu sur votre propre site web grâce à des codes iframe prêts à l'emploi."
        },
        {
          "title": "Système de réservation",
          "desc": "Permettez à vos clients de faire des réservations en ligne. La vérification par e-mail empêche les fausses réservations. Les options de réservation s'adaptent à vos jours et horaires de travail."
        },
        {
          "title": "Lien d'avis Google",
          "desc": "Partagez votre profil d'entreprise Google et votre lien d'avis pour renforcer votre visibilité sur Google."
        }
      ]
    },
    "features": {
      "label": "FONCTIONNALITÉS",
      "title": "Des fonctionnalités complètes pour chaque besoin",
      "subtitle": "Tous les outils pour digitaliser votre restaurant réunis sur une seule plateforme",
      "items": [
        {
          "title": "Plus de 30 thèmes professionnels",
          "desc": "Plus de 30 thèmes soigneusement conçus. De la gastronomie au fast-food, des cafés aux restaurants de sushis — un design adapté à chaque concept.",
          "icon": "palette"
        },
        {
          "title": "Support de 11 langues",
          "desc": "Support du turc, anglais, allemand, français, italien, espagnol, arabe (RTL), azerbaïdjanais, russe, grec et chinois.",
          "icon": "languages"
        },
        {
          "title": "Accès instantané par QR",
          "desc": "Vos clients scannent le QR code à la table pour accéder instantanément à votre menu. Aucune application à télécharger.",
          "icon": "qrcode"
        },
        {
          "title": "Commande en ligne & panier",
          "desc": "Système de commande complet avec options de portion, suppléments, notes spéciales et calcul automatique du prix.",
          "icon": "cart"
        },
        {
          "title": "Système de réservation",
          "desc": "Réservation en ligne avec date, heure et nombre de convives. Code de vérification par e-mail et reçu de confirmation.",
          "icon": "calendar"
        },
        {
          "title": "Appel de serveur",
          "desc": "Appelez un serveur en un seul geste. Service professionnel avec motif de la demande et protection contre les abus.",
          "icon": "bell"
        },
        {
          "title": "Informations allergènes",
          "desc": "Déclaration des 14 allergènes majeurs selon la réglementation européenne. Conformité légale avec la distinction «Contient» et «Peut contenir».",
          "icon": "shield"
        },
        {
          "title": "Enquêtes clients",
          "desc": "Évaluations par étoiles pour la cuisine, le service, l'ambiance et plus encore. Collectez des retours précieux.",
          "icon": "star"
        },
        {
          "title": "Promotions & réductions",
          "desc": "Prix promotionnels par produit, taux de remise distincts sur place/en ligne et tarification spéciale.",
          "icon": "discount"
        },
        {
          "title": "Actions vérifiées par localisation",
          "desc": "Les appels de serveur et les commandes sont vérifiés selon la localisation du restaurant. Les actions hors site ne sont pas autorisées.",
          "icon": "location"
        },
        {
          "title": "Intégration réseaux sociaux",
          "desc": "Liens Instagram, Facebook, TikTok, YouTube et WhatsApp pour atteindre vos clients.",
          "icon": "social"
        },
        {
          "title": "Commandes à emporter",
          "desc": "Vos clients peuvent passer des commandes à emporter avec adresse de livraison, téléphone et notes spéciales. La localisation du client est transmise au restaurant avec la commande.",
          "icon": "truck"
        },
        {
          "title": "Commande via WhatsApp",
          "desc": "Envoyez vos commandes via WhatsApp en un seul tap. Une communication rapide, simple et directe. La localisation du client est transmise au restaurant avec la commande.",
          "icon": "whatsapp"
        },
        {
          "title": "Annonces occasions spéciales",
          "desc": "Affichez des annonces personnalisées pour les fêtes, anniversaires et événements spéciaux auprès de vos clients.",
          "icon": "megaphone"
        },
        {
          "title": "Menu selon l'heure",
          "desc": "Affichez automatiquement les menus du petit-déjeuner, du déjeuner et du dîner selon l'heure de la journée. S'adapte à vos horaires d'ouverture.",
          "icon": "clock"
        },
        {
          "title": "Lien avis Google",
          "desc": "Partagez votre fiche Google Business et votre lien d'avis pour booster votre visibilité sur Google.",
          "icon": "google"
        }
      ]
    },
    "themes": {
      "label": "THÈMES",
      "title": "Plus de 30 thèmes professionnels conçus pour votre restaurant",
      "subtitle": "Chaque thème est adapté aux mobiles, rapide et prend en charge toutes les fonctionnalités. De la gastronomie à la restauration rapide — adapté à tous les concepts.",
      "cta": "Explorer tous les thèmes"
    },
    "featureDetails": [
      {
        "label": "SYSTÈME DE COMMANDE",
        "title": "En salle ou en ligne, commander devient un jeu d'enfant",
        "desc": "Vos clients peuvent choisir les portions, ajouter des extras, formuler des demandes spéciales et ajouter au panier. Commandes à table et livraison en ligne, taux de remise et modes de paiement variés pour une expérience de commande complète.",
        "bullets": [
          "Sélection de portions et d'options",
          "Gestion du panier",
          "Commandes à table et en ligne",
          "Calcul du prix en temps réel",
          "Acceptation des commandes selon la localisation",
          "Prise de commandes via WhatsApp",
          "Pourboire pour le livreur",
          "Ajout de la localisation du client à la commande",
          "Remise panier en option"
        ]
      },
      {
        "label": "RÉSERVATIONS",
        "title": "Réservez votre table en ligne en toute simplicité",
        "desc": "Vos clients réservent en ligne sans avoir à appeler. Ils choisissent la date, le créneau horaire, le nombre de convives et indiquent leurs demandes spéciales. Sécurisé par vérification par e-mail, professionnel avec un reçu de confirmation.",
        "bullets": [
          "Sélection de date via calendrier",
          "Créneaux horaires flexibles",
          "Code de vérification par e-mail",
          "Reçu de confirmation imprimable",
          "Synchronisé avec les horaires d'ouverture du restaurant",
          "Paramétrage des limites de réservation"
        ]
      },
      {
        "label": "MENU MULTILINGUE",
        "title": "Touchez une clientèle mondiale sans barrière linguistique",
        "desc": "Accueillez vos clients étrangers dans leur propre langue grâce à des menus disponibles en 11 langues. Prise en charge complète de l'écriture de droite à gauche (RTL) pour l'arabe. Détection automatique de la langue du navigateur et changement de langue simplifié.",
        "bullets": [
          "Prise en charge de 11 langues",
          "Support RTL pour l'arabe",
          "Détection automatique de la langue",
          "Changement de langue en un clic"
        ]
      }
    ],
    "howItWorks": {
      "label": "COMMENT ÇA MARCHE",
      "title": "Votre menu numérique prêt en 3 étapes",
      "steps": [
        {
          "title": "Inscrivez-vous",
          "desc": "Créez un compte gratuit et définissez votre restaurant."
        },
        {
          "title": "Créez votre menu",
          "desc": "Ajoutez vos produits, photos et prix. Choisissez votre thème."
        },
        {
          "title": "Partagez votre QR Code",
          "desc": "Placez des QR codes sur vos tables. Vos clients les scannent pour accéder au menu."
        }
      ]
    },
    "pricing": {
      "label": "TARIFICATION",
      "title": "Une tarification transparente et simple",
      "subtitle": "Un seul forfait. Tous les modules, toutes les fonctionnalités inclus. Sans frais cachés.",
      "period": "Annuel",
      "price": "$120",
      "currency": "$",
      "note": "Toutes les fonctionnalités incluses dans le prix",
      "features": [
        "30+ thèmes professionnels",
        "Support de 11 langues",
        "Commandes en ligne et en table illimitées",
        "Système de réservation en ligne",
        "Appel serveur",
        "Commandes WhatsApp & à emporter",
        "Gestion des campagnes et remises",
        "Système de sondage client",
        "Actions vérifiées par géolocalisation",
        "Notifications push",
        "Support technique 24h/24 et 7j/7",
        "Garantie de remboursement 30 jours"
      ],
      "cta": "Commencer",
      "secondary": "Voir la démo",
      "taxNote": "Taxes incluses.",
      "refund": "Remboursement 30 jours",
      "support": "Support 24h/24 7j/7",
      "instant": "Activation instantanée"
    },
    "cta": {
      "title": "Obtenez votre menu numérique avec LiwaMenu dès aujourd'hui !",
      "subtitle": "Garantie de remboursement 30 jours !",
      "button": "Commencer"
    },
    "footer": {
      "product": "Produit",
      "resources": "Ressources",
      "company": "Entreprise",
      "features": "Fonctionnalités",
      "pricing": "Tarifs",
      "themes": "Thèmes",
      "support": "Support",
      "contact": "Contact",
      "wpContact": "Contact WhatsApp",
      "terms": "Conditions d'utilisation",
      "rights": "Tous droits réservés.",
      "desc": "Solution de menu numérique moderne pour les restaurants. 30+ thèmes, 11 langues, gestion complète des commandes.",
      "termsModal": {
        "title": "Conditions d'utilisation",
        "intro": "En utilisant les services LiwaMenu, vous acceptez les conditions ci-dessous. Veuillez les lire attentivement.",
        "sections": [
          {
            "title": "1. Utilisation légale",
            "body": "Le client accepte d'utiliser la plateforme LiwaMenu uniquement pour la vente légale de produits et services. Il est strictement interdit de commercialiser des contenus, produits ou services illicites ; de vendre des denrées alimentaires contrefaites, dangereuses pour la santé ou introduites en contrebande ; de proposer des produits alcoolisés ou tabagiques sans licence ; ou de se livrer à toute activité contraire à la législation en vigueur."
          },
          {
            "title": "2. Interdiction d'utilisation détournée",
            "body": "Le système est conçu pour répondre aux besoins des restaurants, cafés et établissements de restauration en matière de menu numérique, de commande, de réservation et d'engagement client. Il ne peut être utilisé pour des jeux d'argent, des loteries, des transactions en cryptomonnaie, de l'intermédiation financière ou toute activité contraire à la loi. En cas de constatation, le contrat pourra être résilié unilatéralement."
          },
          {
            "title": "3. Continuité de service",
            "body": "LiwaMenu vise le niveau de disponibilité le plus élevé possible grâce à une infrastructure moderne. Cependant, en raison de pannes chez les fournisseurs cloud, de dépendances tierces (Firebase, prestataires SMS, systèmes de paiement, FAI, etc.), de fenêtres de maintenance planifiée ou de circonstances de force majeure imprévisibles, le système peut exceptionnellement connaître des interruptions temporaires."
          },
          {
            "title": "4. Limitation de responsabilité",
            "body": "Le client reconnaît que Liwa Yazılım San. Tic. Ltd. Şirketi ne saurait être tenue responsable des pertes commerciales directes ou indirectes, des commandes perdues, des réservations annulées, des manques à gagner ou des préjudices réputationnels pouvant survenir lors de pannes exceptionnelles ou de perturbations techniques. Notre société n'assume aucune obligation d'indemnisation, de remboursement ou autre engagement financier durant ces périodes."
          },
          {
            "title": "5. Sécurité des données et responsabilité du compte",
            "body": "Les données clients sont protégées par chiffrement SSL et sauvegardées régulièrement. Les identifiants de compte (nom d'utilisateur, mot de passe, clés API) ne doivent être partagés qu'avec le personnel autorisé. Tout dommage résultant d'un accès non autorisé ou d'une utilisation abusive du compte est de la responsabilité du titulaire du compte."
          },
          {
            "title": "6. Propriété intellectuelle",
            "body": "La plateforme LiwaMenu, son code source, ses designs, ses logos et tous ses éléments visuels sont la propriété intellectuelle de Liwa Yazılım San. Tic. Ltd. Şirketi. Ils ne peuvent être copiés, distribués ou utilisés dans des œuvres dérivées sans autorisation préalable."
          },
          {
            "title": "7. Mise à jour des conditions",
            "body": "Liwa Yazılım San. Tic. Ltd. Şirketi se réserve le droit de mettre à jour les présentes conditions d'utilisation sans préavis. Les conditions mises à jour entrent en vigueur à la date de leur publication sur le site web, et les clients qui continuent à utiliser le service sont réputés avoir accepté les nouvelles conditions."
          }
        ],
        "footer": "En acceptant cet accord, vous vous engagez à utiliser les services LiwaMenu dans le cadre des conditions mentionnées ci-dessus.",
        "close": "Fermer"
      }
    }
  },
} as const

export const SITE_LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: 'tr', label: 'Türkçe', flag: 'tr' },
  { code: 'en', label: 'English', flag: 'gb' },
  { code: 'az', label: 'Azərbaycan', flag: 'az' },
  { code: 'es', label: 'Español', flag: 'es' },
  { code: 'el', label: 'Ελληνικά', flag: 'gr' },
  { code: 'it', label: 'Italiano', flag: 'it' },
  { code: 'ar', label: 'العربية', flag: 'sa' },
  { code: 'ru', label: 'Русский', flag: 'ru' },
  { code: 'bg', label: 'Български', flag: 'bg' },
  { code: 'fr', label: 'Français', flag: 'fr' },
]

const SUPPORTED = SITE_LANGS.map((l) => l.code)

export function detectLang(): Lang {
  const stored = localStorage.getItem('liwamenu-lang') as Lang | null
  if (stored && SUPPORTED.includes(stored)) return stored
  // Map the browser language (e.g. "es-ES", "ar") to a supported locale; fall back to EN.
  const two = (navigator.language || '').toLowerCase().split('-')[0]
  return SUPPORTED.find((l) => l === two) || 'en'
}

export function setLang(lang: Lang) {
  localStorage.setItem('liwamenu-lang', lang)
}

export function t(lang: Lang) {
  return translations[lang]
}

// Per-language SEO metadata for the marketing site. The site is a single-URL
// SPA, so applySiteSeo() updates <title>/description/OG/<html lang> at runtime
// based on the active language (detected or user-selected).
export const SEO_META: Record<Lang, { title: string; description: string; ogLocale: string }> = {
  tr: {
    title: 'LiwaMenu — Restoranlar için Dijital QR Menü Sistemi',
    description: 'Restoranlar, kafeler ve barlar için modern QR menü ve dijital sipariş sistemi. 30+ tema, çok dilli menü, online sipariş, rezervasyon, garson çağırma ve POS entegrasyonu.',
    ogLocale: 'tr_TR',
  },
  en: {
    title: 'LiwaMenu — Digital QR Menu System for Restaurants',
    description: 'Modern QR menu and digital ordering system for restaurants, cafés and bars. 30+ themes, multi-language menus, online ordering, reservations, waiter call and POS integration.',
    ogLocale: 'en_US',
  },
  az: {
    title: 'LiwaMenu — Restoranlar üçün Rəqəmsal QR Menyu Sistemi',
    description: 'Restoranlar, kafelər və barlar üçün müasir QR menyu və rəqəmsal sifariş sistemi. 30+ tema, çoxdilli menyu, onlayn sifariş, rezervasiya, ofisiant çağırışı və POS inteqrasiyası.',
    ogLocale: 'az_AZ',
  },
  es: {
    title: 'LiwaMenu — Sistema de Menú QR Digital para Restaurantes',
    description: 'Sistema moderno de menú QR y pedidos digitales para restaurantes, cafeterías y bares. Más de 30 temas, menús multilingües, pedidos online, reservas, llamada al camarero e integración con TPV.',
    ogLocale: 'es_ES',
  },
  el: {
    title: 'LiwaMenu — Ψηφιακό Σύστημα Μενού QR για Εστιατόρια',
    description: 'Σύγχρονο σύστημα ψηφιακού μενού QR και παραγγελιών για εστιατόρια, καφετέριες και μπαρ. 30+ θέματα, πολύγλωσσα μενού, ηλεκτρονικές παραγγελίες, κρατήσεις, κλήση σερβιτόρου και ενσωμάτωση POS.',
    ogLocale: 'el_GR',
  },
  it: {
    title: 'LiwaMenu — Sistema di Menu QR Digitale per Ristoranti',
    description: 'Sistema moderno di menu QR e ordinazioni digitali per ristoranti, caffè e bar. Oltre 30 temi, menu multilingue, ordini online, prenotazioni, chiamata cameriere e integrazione POS.',
    ogLocale: 'it_IT',
  },
  ar: {
    title: 'LiwaMenu — نظام قائمة QR الرقمي للمطاعم',
    description: 'نظام حديث لقوائم QR والطلب الرقمي للمطاعم والمقاهي والبارات. أكثر من 30 سمة، قوائم متعددة اللغات، الطلب عبر الإنترنت، الحجوزات، نداء النادل، وتكامل نقاط البيع.',
    ogLocale: 'ar_AR',
  },
  ru: {
    title: 'LiwaMenu — Цифровая система QR-меню для ресторанов',
    description: 'Современная система QR-меню и цифровых заказов для ресторанов, кафе и баров. 30+ тем, многоязычные меню, онлайн-заказы, бронирование, вызов официанта и интеграция с POS.',
    ogLocale: 'ru_RU',
  },
  bg: {
    title: 'LiwaMenu — Дигитална система за QR меню за ресторанти',
    description: 'Модерна система за QR меню и дигитални поръчки за ресторанти, кафенета и барове. Над 30 теми, многоезични менюта, онлайн поръчки, резервации, повикване на сервитьор и POS интеграция.',
    ogLocale: 'bg_BG',
  },
  fr: {
    title: 'LiwaMenu — Système de Menu QR Numérique pour Restaurants',
    description: 'Système moderne de menu QR et de commande numérique pour restaurants, cafés et bars. Plus de 30 thèmes, menus multilingues, commande en ligne, réservations, appel du serveur et intégration POS.',
    ogLocale: 'fr_FR',
  },
}

function upsertMeta(key: { name?: string; property?: string }, content: string) {
  const sel = key.name ? `meta[name="${key.name}"]` : `meta[property="${key.property}"]`
  let el = document.head.querySelector(sel) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    if (key.name) el.setAttribute('name', key.name)
    else el.setAttribute('property', key.property as string)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export function applySiteSeo(lang: Lang) {
  if (typeof document === 'undefined') return
  const m = SEO_META[lang] || SEO_META.en
  document.documentElement.lang = lang
  document.title = m.title
  upsertMeta({ name: 'description' }, m.description)
  upsertMeta({ property: 'og:title' }, m.title)
  upsertMeta({ property: 'og:description' }, m.description)
  upsertMeta({ property: 'og:locale' }, m.ogLocale)
  upsertMeta({ name: 'twitter:title' }, m.title)
  upsertMeta({ name: 'twitter:description' }, m.description)
}
