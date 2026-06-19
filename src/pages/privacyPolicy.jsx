import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const headingClass = "text-base sm:text-lg font-semibold text-slate-900 mb-2";

// Top-level: pick TR for Turkish users, EN for everyone else. The terms
// text is hand-authored per legal-tone requirements; using `i18n.t` for each
// paragraph would balloon the translation files and make legal review
// awkward, so we keep the prose embedded.
//
// We subscribe to i18n's `languageChanged` event explicitly because
// `useTranslation()`'s auto-subscription doesn't always re-render components
// rendered inside the popup portal — the JSX gets captured at openPrivacy()
// time and the inner component reads a stale i18n language until something
// else triggers a re-render. The explicit listener forces a state update on
// every language change, which reliably swaps TR ↔ EN even with the popup
// already open.
const PrivacyPolicy = () => {
  const { i18n } = useTranslation();
  const [lang, setLang] = useState(i18n.language);
  useEffect(() => {
    const handler = (next) => setLang(next);
    i18n.on("languageChanged", handler);
    return () => i18n.off("languageChanged", handler);
  }, [i18n]);
  const isTurkish = (lang || "tr").toLowerCase().startsWith("tr");
  return isTurkish ? <TermsTR /> : <TermsEN />;
};

const TermsTR = () => (
  <article className="text-sm leading-relaxed text-slate-600 space-y-4">
    <p className="font-medium text-slate-700">
      LiwaMenu hizmetini kullanarak aşağıdaki şartları kabul etmiş sayılırsınız.
      Lütfen dikkatlice okuyunuz.
    </p>

    <div>
      <h3 className={headingClass}>1. Yasal Kullanım</h3>
      <p>
        Müşteri, LiwaMenu platformunu yalnızca yasal ürün ve hizmet satışları
        için kullanmayı kabul eder. Yasalara aykırı içerik, ürün veya hizmet
        pazarlamak; sahte ürün, sağlığa zararlı ya da kaçak gıda satmak;
        lisanssız alkol veya tütün ürünü sunmak veya yürürlükteki mevzuata
        aykırı her türlü faaliyet kesinlikle yasaktır.
      </p>
      <p className="mt-2 font-medium text-rose-700">
        Uyarılara rağmen kanun dışı kullanım ve yasal olmayan ürün satışından
        dolayı oluşabilecek cezai durumlar kullanıcıya aittir!
      </p>
    </div>

    <div>
      <h3 className={headingClass}>2. Amaç Dışı Kullanım Yasağı</h3>
      <p>
        Sistem, restoran, kafe ve gıda işletmelerinin dijital menü, sipariş,
        rezervasyon ve müşteri etkileşim ihtiyaçları için tasarlanmıştır. Bu
        kapsam dışında kumar, çekiliş, kripto işlemleri, finansal aracılık veya
        kanunlara aykırı her türlü faaliyet için kullanılamaz. Tespit halinde
        sözleşme tek taraflı feshedilir.
      </p>
    </div>

    <div>
      <h3 className={headingClass}>3. Hizmet Sürekliliği</h3>
      <p>
        LiwaMenu mümkün olan en yüksek erişilebilirlik oranını hedefler ve
        bunun için modern altyapı kullanır. Ancak bulut sağlayıcı kesintileri,
        üçüncü taraf bağımlılıkları (Firebase, SMS sağlayıcıları, ödeme
        sistemleri, internet servis sağlayıcıları vb.), planlı bakım pencereleri
        veya öngörülemeyen mücbir sebepler nedeniyle çok nadir de olsa sistemin
        geçici olarak çevrimdışı kalabileceği durumlar yaşanabilir.
      </p>
    </div>

    <div>
      <h3 className={headingClass}>4. Sorumluluk Sınırı</h3>
      <p>
        Müşteri, olağanüstü bir kesinti veya teknik aksaklık sırasında
        oluşabilecek dolaylı veya doğrudan ticari kayıplardan, sipariş
        kaybından, rezervasyon iptalinden, kar kaybından veya itibar zararından
        Liwa Yazılım San. Tic. Ltd. Şirketi'nin sorumlu tutulamayacağını kabul
        eder. Şirketimiz bu süreçte tazminat, geri ödeme veya başka bir mali
        yükümlülük altına girmez.
      </p>
    </div>

    <div>
      <h3 className={headingClass}>5. Veri Güvenliği ve Hesap Sorumluluğu</h3>
      <p>
        Müşteri verileri SSL şifreleme ile korunur ve düzenli olarak
        yedeklenir. Hesap bilgileri (kullanıcı adı, şifre, API anahtarları)
        yalnızca yetkili kişilerle paylaşılmalıdır. Yetkisiz erişim veya hesap
        kötüye kullanımı sonucu doğan tüm zararlardan hesap sahibi sorumludur.
      </p>
    </div>

    <div>
      <h3 className={headingClass}>6. Fikri Mülkiyet</h3>
      <p>
        LiwaMenu platformu, kaynak kodları, tasarımları, logoları ve tüm görsel
        ögeleri Liwa Yazılım San. Tic. Ltd. Şirketi'nin fikri mülkiyetidir.
        İzinsiz çoğaltılamaz, dağıtılamaz veya türev çalışmalarda kullanılamaz.
      </p>
    </div>

    <div>
      <h3 className={headingClass}>7. Şartların Güncellenmesi</h3>
      <p>
        Liwa Yazılım San. Tic. Ltd. Şirketi, işbu kullanım şartlarını önceden
        bildirim yapmaksızın güncelleme hakkını saklı tutar. Güncellenmiş
        şartlar, web sitesinde yayımlandığı tarihte yürürlüğe girer ve hizmeti
        kullanmaya devam eden müşteri yeni şartları kabul etmiş sayılır.
      </p>
    </div>

    <p className="font-medium text-slate-700">
      Bu sözleşmeyi onaylayarak LiwaMenu hizmetini yukarıdaki şartlar
      çerçevesinde kullanacağınızı kabul etmiş olursunuz.
    </p>
  </article>
);

const TermsEN = () => (
  <article className="text-sm leading-relaxed text-slate-600 space-y-4">
    <p className="font-medium text-slate-700">
      By using the LiwaMenu service, you are deemed to have accepted the
      following terms. Please read them carefully.
    </p>

    <div>
      <h3 className={headingClass}>1. Lawful Use</h3>
      <p>
        The Customer agrees to use the LiwaMenu platform solely for the sale of
        lawful products and services. Marketing any content, product, or service
        that violates the law; selling counterfeit, health-hazardous, or
        smuggled food; offering unlicensed alcohol or tobacco products; or
        engaging in any activity contrary to applicable legislation is strictly
        prohibited.
      </p>
      <p className="mt-2 font-medium text-rose-700">
        Any criminal liability arising from unlawful use or the sale of illegal
        products despite these warnings belongs to the user!
      </p>
    </div>

    <div>
      <h3 className={headingClass}>2. Prohibition of Off-Purpose Use</h3>
      <p>
        The system is designed for the digital menu, ordering, reservation, and
        customer-interaction needs of restaurants, cafes, and food businesses.
        It may not be used outside this scope for gambling, raffles, crypto
        transactions, financial intermediation, or any activity contrary to
        law. If detected, the contract is unilaterally terminated.
      </p>
    </div>

    <div>
      <h3 className={headingClass}>3. Service Continuity</h3>
      <p>
        LiwaMenu aims for the highest possible availability and uses modern
        infrastructure to that end. However, due to cloud-provider outages,
        third-party dependencies (Firebase, SMS providers, payment systems,
        internet service providers, etc.), planned maintenance windows, or
        unforeseen force-majeure events, there may be — albeit very rarely —
        situations in which the system temporarily goes offline.
      </p>
    </div>

    <div>
      <h3 className={headingClass}>4. Limitation of Liability</h3>
      <p>
        The Customer accepts that Liwa Yazılım San. Tic. Ltd. Şirketi cannot be
        held liable for any indirect or direct commercial losses, loss of
        orders, reservation cancellations, loss of profit, or reputational
        damage that may occur during an extraordinary outage or technical
        malfunction. Our company shall bear no obligation of compensation,
        refund, or any other financial liability in this process.
      </p>
    </div>

    <div>
      <h3 className={headingClass}>5. Data Security and Account Responsibility</h3>
      <p>
        Customer data is protected with SSL encryption and is backed up
        regularly. Account information (username, password, API keys) must be
        shared only with authorized persons. The account holder is responsible
        for all damages arising from unauthorized access or account misuse.
      </p>
    </div>

    <div>
      <h3 className={headingClass}>6. Intellectual Property</h3>
      <p>
        The LiwaMenu platform, its source code, designs, logos, and all visual
        elements are the intellectual property of Liwa Yazılım San. Tic. Ltd.
        Şirketi. They may not be reproduced, distributed, or used in derivative
        works without permission.
      </p>
    </div>

    <div>
      <h3 className={headingClass}>7. Updates to the Terms</h3>
      <p>
        Liwa Yazılım San. Tic. Ltd. Şirketi reserves the right to update these
        terms of use without prior notice. The updated terms take effect on the
        date they are published on the website, and a customer who continues to
        use the service is deemed to have accepted the new terms.
      </p>
    </div>

    <p className="font-medium text-slate-700">
      By approving this agreement, you accept that you will use the LiwaMenu
      service within the framework of the terms above.
    </p>
  </article>
);

export default PrivacyPolicy;
