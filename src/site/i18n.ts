export type Lang = 'tr' | 'en'

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
} as const

export function detectLang(): Lang {
  const stored = localStorage.getItem('liwamenu-lang') as Lang | null
  if (stored && (stored === 'tr' || stored === 'en')) return stored
  const browserLang = navigator.language.toLowerCase()
  if (browserLang.startsWith('tr')) return 'tr'
  return 'en'
}

export function setLang(lang: Lang) {
  localStorage.setItem('liwamenu-lang', lang)
}

export function t(lang: Lang) {
  return translations[lang]
}
