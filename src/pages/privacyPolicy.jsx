import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const linkClass =
  "text-[--primary-1] underline-offset-2 hover:underline break-all";
const headingClass = "text-base sm:text-lg font-semibold text-slate-900 mb-2";

const Site = () => (
  <a
    href="https://www.liwamenu.com"
    target="_blank"
    rel="noreferrer"
    className={linkClass}
  >
    www.liwamenu.com
  </a>
);

// Top-level: pick TR for Turkish users, EN for everyone else. The
// terms text is hand-translated per legal-tone requirements; using
// `i18n.t` for each paragraph would balloon the translation files
// and make legal review awkward, so we keep the prose embedded.
//
// We subscribe to i18n's `languageChanged` event explicitly because
// `useTranslation()`'s auto-subscription doesn't always re-render
// components rendered inside the popup portal — the JSX gets captured
// at openPrivacy() time and the inner component reads a stale i18n
// language until something else triggers a re-render. The explicit
// listener forces a state update on every language change, which
// reliably swaps TR ↔ EN even with the popup already open.
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
    <div>
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
        LiwaMenu Kullanım Şartları
      </h2>
      <p className="mb-3">
        LiwaMenu ürünü online sipariş platformlarına entegre olarak çalışan
        ve çok yönlü olarak tarafların teknik sorunları nedeni ile zaman zaman
        aksaklıklar yaşanabilecek bir hizmettir. Bu kriterler aşağıdaki gibidir.
      </p>
      <ul className="list-decimal pl-5 space-y-1.5 mb-3 marker:text-[--primary-1] marker:font-semibold">
        <li>Ürünü/Hizmeti kullanan işletmedeki donanımsal sebepler</li>
        <li>Ürünü/Hizmeti kullanan işletmedeki kişisel kullanıcı hataları</li>
        <li>İnternet servis sağlayıcıdan kaynaklanabilecek kesinti sorunları</li>
        <li>
          Online sipariş platformlarından kaynaklanan teknik sorunlar veya
          güncellemeye dayalı sorunlar
        </li>
        <li>
          LiwaMenu sunucularında yaşanabilecek teknik veya güncellemeye
          bağlı sorunlar.
        </li>
      </ul>
      <p>
        Yukarıda sayılan sebeplerden dolayı hizmetler bazen tamamen veya
        kısmen çalışmayabilir. Sorun yaşanan süre zarfında oluşabilecek maddi
        kayıplardan dolayı Liwa Yazılım San. Tic. Ltd. Şti. sorumlu tutulamaz.
        Hizmeti satın alan her müşteri bu şartları kabul etmiş sayılır.
      </p>
    </div>

    <div>
      <h3 className={headingClass}>
        Diğer Kullanıma Dayalı Aydınlatma ve KVKK Metni
      </h3>
      <p>
        İşbu Gizlilik ve Kullanım Şartları Politikası ile LİWA YAZILIM San.
        Tic. Ltd. Şti.'ne ("LİWA YAZILIM") aktarılan kişisel verilerin
        korunması konusundaki temel bilgilere yer verileceği gibi, Liwa
        Yazılıma ait <Site /> web sitesi ziyaretçilerine, çerez politikası ve
        politikanın nasıl yönetilebileceği konularında bilgilendirme
        yapılacaktır. Web sitesinde yer alan çerez kullanım uyarısının
        kapatılması ya da web sitesi kullanımına devam edilmesi halinde
        çerezlere onay verildiği kabul edilir. Çerez kullanımını
        onaylamıyorsanız web sitesine devam etmemenizi ya da tarayıcınızdan
        çerez tercihlerinizi değiştirmenizi rica ederiz. Çerezlere izin
        verilmemesi halinde web sitesinin bazı özelliklerinin işlevselliğini
        yitirebileceğini hatırlatmak isteriz. LİWASOFT Yazılım, 6698 sayılı
        Kişisel Verilerin Korunması Kanunu ("6698 sayılı Kanun") m. 10'da
        belirtilen aydınlatma yükümlülüğünü yerine getirmek amacıyla aşağıdaki
        sunulan açıklamaları <Site /> web-sitemizi ve/veya mobil
        uygulamalarımızı kullanan 3. kişilerin dikkatine sunar.
      </p>
    </div>

    <div>
      <h3 className={headingClass}>
        1- Liwa Yazılımın kişisel verileri toplamasının yasal dayanağı nedir?
      </h3>
      <p>
        Müşterilerimizin kişisel verilerinin korunması konusunda en temel
        düzenleme 6698 sayılı Kişisel Verilerin Korunması Kanununda
        yapılmıştır. Ayrıca 6563 Sayılı Elektronik Ticaretin Düzenlenmesi
        Hakkında Kanunu da kişisel verilerin korunmasına ilişkin hüküm
        içermektedir. 5237 Sayılı Türk Ceza Kanununda ise, kişisel verilerin
        hukuka aykırı olarak, kaydedilmesi, ele geçirilmesi, yayılması ve
        saklama sürelerinin dolmasına rağmen sistem içerisinde silinmesi, yok
        edilmesi ya da anonim hale getirilmemesi halinde, cezai yaptırımlar
        öngörülmüştür. Diğer yandan, 6502 sayılı Tüketicinin Korunması
        Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği'nden doğan
        yükümlülüklerimizin ifası amacıyla verilerin toplanması ve
        kullanılması gerekmektedir.
      </p>
    </div>

    <div>
      <h3 className={headingClass}>
        2- Liwa Yazılım kişisel verilerin toplanmasında hangi yöntemleri
        kullanıyor?
      </h3>
      <p>
        <Site /> web sitesinden veya mobil uygulamalardan işlem yapan
        müşterilerimizin kişisel verileri, müşterilerimizin açık rızaları ve
        mevzuat hükümleri uyarınca Liwa Yazılım tarafından işlenmektedir.
        Kullanıcıların kişisel bilgileri, adı - soyadı, doğum tarihi,
        yüklediği dosyalardaki kişilerin bilgileri telefon numarası, e-posta
        adresi, T.C kimlik numarası gibi kullanıcıyı doğrudan ya da dolaylı
        olarak tanımlamaya yönelik her türlü kişisel bilgi olup, bu gizlilik
        politikasında "kişisel bilgiler" olarak anılacaktır. Bu Gizlilik
        Bildirimi, kişisel verilerinizin tarafımızca toplanması, kullanımı,
        paylaşımı, muhafaza edilmesi ve korunması konularını ve bunlar ile
        ilgili haklarınızı açıklamaktadır. Bu Gizlilik Bildirimi mobil
        cihazlar da dahil olmak üzere, erişim veya kullanım yönteminize
        bakılmaksızın, internet sitemiz de dahil olmak üzere, bu Gizlilik
        Bildirimine atıfta bulunulan her tür uygulama ve hizmet sunumuna
        (birlikte, "Hizmetler") uygulanacaktır. Hizmetlerimizi kullanarak
        ve/veya hesap oluşturarak bu Gizlilik Bildirimi ve Kullanıcı
        Sözleşmemizi kabul etmekte ve bu Gizlilik Bildirimi'nde açıklandığı
        üzere, kişisel verilerinizi toplamamıza, kullanmamıza, gerektiğinde
        üçüncü kişilerle paylaşmamıza, muhafaza etmemize ve korumamıza rıza
        göstermektesiniz. Liwa Yazılıma ait olan <Site /> web sitesi çerez
        (cookie) kullanan bir sitedir. Çerez; kullanılmakta olan cihazın
        internet tarayıcısına ya da sabit diskine depolanarak söz konusu
        cihazın tespit edilmesine imkân tanıyan, çoğunlukla harf ve sayılardan
        oluşan bir dosyadır. <Site /> ziyaretçilerine daha iyi hizmet
        verebilmek amacıyla ve yasal yükümlülüğü çerçevesinde, işbu Kişisel
        Verilerin Korunması Hakkında Açıklama metninde belirlenen amaçlar ve
        kapsam dışında kullanılmamak kaydı ile gezinme bilgilerinizi
        toplayacak, işleyecek, üçüncü kişilerle paylaşacak ve güvenli olarak
        saklayacaktır. <Site /> çerezleri; günlük dosyaları, boş gif dosyaları
        ve/veya üçüncü taraf kaynakları yoluyla topladığı bilgileri
        tercihlerinizle ilgili bir özet oluşturmak amacıyla depolar. <Site />{" "}
        size özel tanıtım yapmak, promosyonlar ve pazarlama teklifleri sunmak,
        web sitesinin veya mobil uygulamanın içeriğini size göre iyileştirmek
        ve/veya tercihlerinizi belirlemek amacıyla; site üzerinde gezinme
        bilgilerinizi ve/veya site üzerindeki kullanım geçmişinizi
        izleyebilmektedir. <Site /> çevrimiçi ve çevrimdışı olarak toplanan
        bilgiler gibi farklı yöntemlerle veya farklı zamanlarda site üzerinde
        sizden toplanan bilgileri eşleştirebilir ve bu bilgileri üçüncü
        taraflar gibi başka kaynaklardan alınan bilgilerle birlikte
        kullanabilir. <Site /> mobil uygulamasında oturum çerezleri ve kalıcı
        çerezler kullanmaktadır. Oturum kimliği çerezi, tarayıcınızı
        kapattığınızda sona erer. Kalıcı çerez ise sabit diskinizde uzun bir
        süre kalır. İnternet tarayıcınızın "yardım" dosyasında verilen
        talimatları izleyerek veya "www.allaboutcookies.org" veya
        "www.youronlinechoices.eu" adresini ziyaret ederek kalıcı çerezleri
        kaldırabilir ve hem oturum çerezlerini hem de kalıcı çerezleri
        reddedebilirsiniz. Kalıcı çerezleri veya oturum çerezlerini
        reddederseniz, web sitesini, mobil uygulamayı kullanmaya devam
        edebilirsiniz fakat web sitesinin, mobil uygulamanın tüm işlevlerine
        erişemeyebilirsiniz veya erişiminiz sınırlı olabilir. <Site />,
        internet sayfasını kullanan kullanıcıların istatistiksel bilgileri ve
        yaptığı işlemler sistem tarafından kayıt altında tutulur. Kullanıcı,
        sistem kayıtlarındaki hareketlerinden sorumludur. <Site /> web
        sitesinde sunulan hizmetlerden yararlananlar bütün bu şartları okumuş
        ve kabul etmiş sayılırlar. Liwa Yazılım San. Tic. Ltd. Şti. ait{" "}
        <Site />, Gizlilik Politikası hükümlerini önceden haber vermeksizin
        değiştirme hakkını saklı tutar. Güncel Gizlilik Politikası,
        Kullanıcıya herhangi bir yöntemle sunulduğu tarihte yürürlük kazanır.
      </p>
    </div>

    <div>
      <h3 className={headingClass}>
        3- İnternet Sitesi Çerezleri Nasıl Kullanılmaktadır?
      </h3>
      <p className="mb-3">
        Liwa Yazılıma ait olan <Site /> web sitesi çerez (cookie) kullanan bir
        sitedir. Çerez; kullanılmakta olan cihazın internet tarayıcısına ya da
        sabit diskine depolanarak söz konusu cihazın tespit edilmesine olanak
        tanıyan, çoğunlukla harf ve sayılardan oluşan bir dosyadır. <Site />{" "}
        çerezleri; günlük dosyaları, boş gif dosyaları ve/veya üçüncü taraf
        kaynakları yoluyla topladığı bilgileri tercihlerinizle ilgili bir özet
        oluşturmak amacıyla depolar. Oturum çerezleri (session cookies) ve
        kalıcı çerezler (persistent cookies) olmak üzere sitelerimiz genelinde
        iki tür çerez kullanmaktayız. Oturum çerezleri geçici çerezler olup
        sadece tarayıcınızı kapatıncaya kadar geçerlidirler. Kalıcı çerezler
        siz silinceye veya süreleri doluncaya (bu şekilde çerezlerin cihazında
        ne kadar kalacağı, çerezlerin "kullanım ömürlerine" bağlı olacaktır)
        kadar sabit diskinizde kalırlar. <Site /> çerezleri; yaptığınız
        tercihleri hatırlamak ve web sitesi/mobil uygulama kullanımınızı
        kişiselleştirmek için kullanır. Bu kullanım parolanızı kaydeden ve web
        sitesi/mobil uygulama oturumunuzun sürekli açık kalmasını sağlayan,
        böylece her ziyaretinizde birden fazla kez parola girme zahmetinden
        kurtaran çerezleri ve web sitesi/mobil uygulamaya daha sonraki
        ziyaretlerinizde sizi hatırlayan ve tanıyan çerezleri içerir. <Site />{" "}
        web sitesine nereden bağlandığınız, web sitesi/mobil uygulama üzerinde
        hangi içeriği görüntülediğiniz ve ziyaretinizin süresi gibi web
        sitesini/mobil uygulamayı nasıl kullandığınızın ölçümlenmesi dahil
        olmak üzere web sitesini/mobil uygulamayı nasıl kullandığınızı tespit
        etmek için kullanır. <Site /> web sitesi çerezleri ayrıca; arama
        motorlarını, web sitesi, mobil uygulamasını ve/veya web sitesinin
        reklam verdiği internet sitelerini ziyaret ettiğinizde ilginizi
        çekebileceğini düşündüğü reklamları size sunabilmek için "reklam
        teknolojisini" devreye sokmak amacıyla kullanabilir. Reklam
        teknolojisi, size özel reklamlar sunabilmek için web sitesine/mobil
        uygulamaya ve web sitesinin reklam verdiği web sitelerine/mobil
        uygulamalarına yaptığınız önceki ziyaretlerle ilgili bilgileri
        kullanır. Bu reklamları sunarken, web sitesinin sizi tanıyabilmesi
        amacıyla tarayıcınıza benzersiz bir üçüncü taraf çerezi
        yerleştirilebilir. Liwa Yazılım ayrıca Google, Inc. tarafından
        sağlanan bir web analizi hizmeti olan Google Analytics kullanmaktadır.
        Google Analytics, çerezleri kullanıcıların web sitesini, mobil
        uygulamayı ve/veya mobil sitesini nasıl kullandıklarını istatistiki
        bilgiler/raporlar ile analiz etmek amacıyla kullanır.
      </p>
      <p>
        Liwa Yazılımda yer alan çerezlere ilişkin bilgiler aşağıdaki tabloda
        yer almaktadır:
      </p>
      <CookieTable
        columns={["Sağlayıcı", "Cookie İsmi", "Tipi", "Süresi"]}
        rows={[
          ["Google", "_gat", "Persistent", "2 Yıl"],
          ["Liwa Yazılım", "ASP.NET_SessionId", "Persistent", "30 Dakika"],
        ]}
      />
    </div>

    <div>
      <h3 className={headingClass}>
        4- Liwa Yazılım kişisel verileri hangi amaçlarla kullanıyor?
      </h3>
      <p className="mb-3">
        Liwa Yazılım, mevzuatın izin verdiği durumlarda amacına uygun olarak
        ve ölçülü bir şekilde kişisel bilgilerinizi işleyebilecek,
        kaydedebilecek, güvenli bir biçimde saklayabilecek, güncelleyebilecek,
        üçüncü kişilere açıklayabilecek, devredebilecek, sınıflandırabilecektir.
        Liwa Yazılımda kişisel verileriniz şu amaçlarla kullanılmaktadır:
      </p>
      <ul className="list-disc pl-5 space-y-1.5 marker:text-[--primary-1]">
        <li>
          Web sitesi/mobil uygulamalar üzerinden alışveriş yapanın/yaptıranın
          kimlik bilgilerini teyit etmek,
        </li>
        <li>İletişim için adres ve diğer gerekli bilgileri kaydetmek,</li>
        <li>
          Mesafeli satış sözleşmesi ve Tüketicinin Korunması Hakkında Kanun'un
          ilgili maddeleri tahtında akdettiğimiz sözleşmelerin koşulları,
          güncel durumu ve güncellemeler ile ilgili müşterilerimiz ile
          iletişime geçmek, gerekli bilgilendirmeleri yapabilmek,
        </li>
        <li>
          Elektronik (internet/mobil vs.) veya kâğıt ortamında işleme dayanak
          olacak tüm kayıt ve belgeleri düzenlemek,
        </li>
        <li>
          Mesafeli satış sözleşmesi ve Tüketicinin Korunması Hakkında Kanun'un
          ilgili maddeleri tahtında akdettiğimiz sözleşmeler uyarınca
          üstlenilen yükümlülükleri ifa etmek,
        </li>
        <li>
          Kamu güvenliğine ilişkin hususlarda talep halinde ve mevzuat gereği
          kamu görevlilerine bilgi verebilmek,
        </li>
        <li>
          Müşterilerimize daha iyi bir alışveriş deneyimini sağlamak,
          müşterilerimizin ilgi alanlarını dikkate alarak ilgilenebileceği
          ürünlerimiz hakkında bilgi verebilmek, kampanyaları aktarmak,
        </li>
        <li>
          Müşteri memnuniyetini artırmak, müşteri çevresi analizinde
          kullanabilmek, çeşitli pazarlama ve reklam faaliyetlerinde
          kullanabilmek ve bu kapsamda anlaşmalı kuruluşlar aracılığıyla
          anketler düzenlemek,
        </li>
        <li>
          Anlaşmalı kurumlarımız ve çözüm ortaklarımız tarafından önerilerde
          bulunabilmek, hizmetlerimizle ilgili bilgilendirebilmek,
        </li>
        <li>
          Hizmetlerimiz ile ilgili müşteri şikâyet ve önerilerini
          değerlendirebilmek,
        </li>
        <li>
          Yasal yükümlülüklerimizi yerine getirebilmek ve yürürlükteki
          mevzuattan doğan haklarımızı kullanabilmek.
        </li>
      </ul>
    </div>

    <div>
      <h3 className={headingClass}>
        5- Liwa Yazılım kişisel verilerinizi nasıl koruyor?
      </h3>
      <p>
        Liwa Yazılım ile paylaşılan kişisel veriler, Liwa Yazılım gözetimi ve
        kontrolü altındadır. Liwa Yazılım, yürürlükteki ilgili mevzuat
        hükümleri gereğince bilginin gizliliğinin ve bütünlüğünün korunması
        amacıyla gerekli organizasyonu kurmak ve teknik önlemleri almak ve
        uyarlamak konusunda veri sorumlusu sıfatıyla sorumluluğu üstlenmiştir.
        Bu konudaki yükümlülüğümüzün bilincinde olarak veri gizliliğini konu
        alan uluslararası ve ulusal teknik standartlara uygun surette periyodik
        aralıklarda sızma testleri yaptırılmakta ve bu kapsamda veri işleme
        politikalarımızı her zaman güncellediğimizi bilginize sunarız.
      </p>
    </div>

    <div>
      <h3 className={headingClass}>
        6- Liwa Yazılım kişisel verilerinizi paylaşıyor mu?
      </h3>
      <p>
        Müşterilerimize ait kişisel verilerin üçüncü kişiler ile paylaşımı,
        müşterilerin izni çerçevesinde gerçekleşmekte ve kural olarak
        müşterimizin onayı olmaksızın kişisel verileri üçüncü kişilerle
        paylaşılmamaktadır. Bununla birlikte, yasal yükümlülüklerimiz nedeniyle
        ve bunlarla sınırlı olmak üzere mahkemeler ve diğer kamu kurumları ile
        kişisel veriler paylaşılmaktadır. Ayrıca, taahhüt ettiğimiz hizmetleri
        sağlayabilmek ve verilen hizmetlerin kalite kontrolünü yapabilmek için
        anlaşmalı üçüncü kişilere kişisel veri aktarımı yapılmaktadır. Üçüncü
        kişilere veri aktarımı sırasında hak ihlallerini önlemek için gerekli
        teknik ve hukuki önlemler alınmaktadır. Bununla birlikte, kişisel
        verileri alan üçüncü kişinin veri koruma politikalarından dolayı ve
        üçüncü kişinin sorumluluğundaki risk alanında meydana gelen
        ihlallerden Liwa Yazılım sorumlu değildir. Kişisel verileriniz Liwa
        Yazılımın hissedarlarıyla, doğrudan/dolaylı yurtiçi/yurtdışı
        faaliyetlerimizi yürütebilmek için işbirliği yaptığımız program ortağı
        kurum, kuruluşlarla, verilerin bulut ortamında saklanması hizmeti
        aldığımız yurtiçi/yurtdışı kişi ve kurumlarla, müşterilerimize ticari
        elektronik iletilerin gönderilmesi konusunda anlaşmalı olduğumuz
        yurtiçi/yurtdışındaki kuruluşlarla, Bankalar arası Kart Merkeziyle,
        anlaşmalı olduğumuz bankalarla ve sizlere daha iyi hizmet sunabilmek ve
        müşteri memnuniyetini sağlayabilmek için çeşitli pazarlama
        faaliyetleri kapsamında yurtiçi ve yurtdışındaki çeşitli ajans, reklam
        şirketleri ve anket şirketleriyle ve yurtiçi/yurtdışı diğer üçüncü
        kişilerle ve ilgili iş ortaklarımızla paylaşılabilmektedir.
      </p>
    </div>

    <div>
      <h3 className={headingClass}>
        7- Kişisel Verilerin Korunması Kanunu'ndan doğan haklarınız nelerdir?
      </h3>
      <p className="mb-3">6698 sayılı Kanun uyarınca kişisel verilerinizin;</p>
      <ul className="list-[lower-alpha] pl-5 space-y-1.5 marker:text-[--primary-1] marker:font-semibold">
        <li>İşlenip işlenmediğini öğrenme,</li>
        <li>İşlenmişse bilgi talep etme,</li>
        <li>
          İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını
          öğrenme,
        </li>
        <li>Yurt içinde / yurt dışında aktarıldığı 3. kişileri bilme,</li>
        <li>Eksik / yanlış işlenmişse düzeltilmesini isteme,</li>
        <li>
          6698 sayılı Kanun'un 7. maddesinde öngörülen şartlar çerçevesinde
          silinmesini / yok edilmesini isteme,
        </li>
        <li>
          Aktarıldığı 3. kişilere yukarıda sayılan (d) ve (e) bentleri uyarınca
          yapılan işlemlerin bildirilmesini isteme,
        </li>
        <li>
          Münhasıran otomatik sistemler ile analiz edilmesi nedeniyle aleyhinize
          bir sonucun ortaya çıkmasına itiraz etme,
        </li>
        <li>
          6698 sayılı Kişisel Verilerin Korunması Kanunu'na aykırı olarak
          işlenmesi sebebiyle zarara uğramanız hâlinde zararın giderilmesini
          talep etme haklarına sahip olduğunuzu hatırlatmak isteriz,
        </li>
        <li>Başvuru formu.</li>
      </ul>
    </div>

    <div>
      <h3 className={headingClass}>
        8- Kişisel verilerle ilgili mevzuat değişikliklerinden nasıl haberdar
        olabilirim?
      </h3>
      <p>
        6698 sayılı Kanun uyarınca, sahip olduğunuz haklar Liwa Yazılım
        yükümlülükleridir. Kişisel verilerinizi bu bilinçle ve mevzuatın
        gerektirdiği ölçüde işlediğimizi, yasal değişikliklerin olması halinde
        sayfamızda yer alan bu bilgileri yeni mevzuata uygun güncelleyeceğimizi,
        yapılan güncellemeleri de bu sayfa üzerinden her zaman kolaylıkla takip
        edebileceğinizi size bildirmek isteriz.
      </p>
    </div>

    <div>
      <h3 className={headingClass}>
        9- Verinin güncel ve doğru tutulduğundan nasıl emin olabilirim?
      </h3>
      <p>
        6698 sayılı Kanun'un 4. maddesi uyarınca Liwa Yazılımın kişisel
        verilerinizi doğru ve güncel olarak tutma yükümlülüğü bulunmaktadır.
        Bu kapsamda Liwa Yazılımın yürürlükteki mevzuattan doğan
        yükümlülüklerini yerine getirebilmesi için müşterilerimizin Liwa
        Yazılım doğru ve güncel verilerini paylaşması gerekmektedir.
        Verilerinizin herhangi bir surette değişikliğe uğraması halinde aşağıda
        belirtilen iletişim kanallarından bizimle iletişime geçerek
        verilerinizi güncellemenizi rica ederiz.
      </p>
    </div>

    <div>
      <h3 className={headingClass}>
        10- Liwa Yazılıma kişisel verilerinizle ilgili soru sormak ister
        misiniz?
      </h3>
      <p>
        Kişisel verilerinizle ilgili her türlü soru ve görüşleriniz için{" "}
        <a
          href="mailto:support@liwamenu.com"
          className={linkClass}
        >
          support@liwamenu.com
        </a>{" "}
        posta adresinden dilediğiniz zaman bize ulaşabilirsiniz.
      </p>
    </div>
  </article>
);

const TermsEN = () => (
  <article className="text-sm leading-relaxed text-slate-600 space-y-4">
    <div>
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
        LiwaMenu Terms of Service
      </h2>
      <p className="mb-3">
        LiwaMenu is a service that operates by integrating with online order
        platforms and may experience disruptions from time to time due to
        technical issues affecting any of the parties involved. The
        applicable conditions are listed below.
      </p>
      <ul className="list-decimal pl-5 space-y-1.5 mb-3 marker:text-[--primary-1] marker:font-semibold">
        <li>
          Hardware-related causes at the business using the product/service
        </li>
        <li>
          Personal user errors at the business using the product/service
        </li>
        <li>Outage issues that may originate from the internet service provider</li>
        <li>
          Technical or update-related issues originating from online order
          platforms
        </li>
        <li>
          Technical or update-related issues that may occur on LiwaMenu
          servers.
        </li>
      </ul>
      <p>
        Due to the reasons listed above, the services may be fully or partially
        unavailable from time to time. Liwa Yazılım San. Tic. Ltd. Şti. cannot
        be held liable for any financial losses that may occur during such
        disruptions. Every customer who purchases the service is deemed to
        have accepted these terms.
      </p>
    </div>

    <div>
      <h3 className={headingClass}>
        Other Usage-Based Disclosure and Personal Data Protection Notice
      </h3>
      <p>
        This Privacy and Terms of Use Policy provides essential information
        about the protection of personal data shared with LİWA YAZILIM San.
        Tic. Ltd. Şti. ("LİWA YAZILIM") and informs visitors of Liwa
        Yazılım's <Site /> website about the cookie policy and how this
        policy is managed. By dismissing the cookie usage notice on the
        website or continuing to use the website, you are deemed to have
        consented to the use of cookies. If you do not consent to the use of
        cookies, please discontinue use of the website or change your cookie
        preferences in your browser. Note that some features of the website
        may lose functionality if cookies are not allowed. To fulfill the
        disclosure obligation set forth in Article 10 of the Turkish
        Personal Data Protection Law No. 6698 ("Law No. 6698"), LİWASOFT
        Yazılım presents the following statements to the attention of third
        parties using our <Site /> website and/or mobile applications.
      </p>
    </div>

    <div>
      <h3 className={headingClass}>
        1- What is the legal basis for Liwa Yazılım collecting personal data?
      </h3>
      <p>
        The most fundamental regulation regarding the protection of our
        customers' personal data is the Turkish Personal Data Protection Law
        No. 6698. Additionally, Law No. 6563 on the Regulation of Electronic
        Commerce contains provisions regarding the protection of personal
        data. The Turkish Penal Code No. 5237 prescribes criminal sanctions
        for the unlawful recording, acquisition, dissemination of personal
        data, and the failure to delete, destroy, or anonymize them within
        the system after their retention periods have expired. Additionally,
        data must be collected and used to fulfill obligations arising from
        Law No. 6502 on Consumer Protection and the Distance Sales
        Regulation.
      </p>
    </div>

    <div>
      <h3 className={headingClass}>
        2- What methods does Liwa Yazılım use to collect personal data?
      </h3>
      <p>
        Personal data of customers transacting through the <Site /> website
        or mobile applications is processed by Liwa Yazılım in accordance
        with our customers' explicit consent and the provisions of the
        legislation. Users' personal information includes any personal
        information intended to identify the user directly or indirectly,
        such as name, surname, date of birth, the information of persons in
        uploaded files, phone number, email address, and Turkish identity
        number, and is referred to in this privacy policy as "personal
        information." This Privacy Notice describes how we collect, use,
        share, retain, and protect your personal data, as well as your
        related rights. This Privacy Notice applies to any application and
        service offering (collectively, the "Services") that references this
        Privacy Notice, including our website, regardless of how it is
        accessed or used (including from mobile devices). By using our
        Services and/or creating an account, you accept this Privacy Notice
        and our User Agreement and consent to our collecting, using,
        sharing with third parties when necessary, retaining, and protecting
        your personal data as described in this Privacy Notice. Liwa
        Yazılım's <Site /> website is a site that uses cookies. A cookie is
        a file, mostly composed of letters and numbers, that allows the
        device in use to be identified by being stored in the internet
        browser or hard disk of that device. To provide better service to{" "}
        <Site /> visitors and within the framework of legal obligations,{" "}
        <Site /> will collect, process, share with third parties, and
        securely store your browsing information, provided that it is not
        used outside the purposes and scope set forth in this Personal Data
        Protection Notice. <Site /> cookies store information collected
        through log files, blank gif files, and/or third-party sources for
        the purpose of building a summary of your preferences. <Site /> may
        track your browsing information and/or usage history on the site to
        provide you with personalized promotions and marketing offers, to
        improve the content of the website or mobile application for you,
        and/or to determine your preferences. <Site /> may match information
        collected from you on the site at different times or by different
        methods (such as information collected online and offline) and may
        use this information together with information obtained from other
        sources such as third parties. The <Site /> mobile application uses
        session cookies and persistent cookies. The session ID cookie expires
        when you close your browser. Persistent cookies remain on your hard
        disk for a long time. You can remove persistent cookies and reject
        both session cookies and persistent cookies by following the
        instructions in your internet browser's "help" file or by visiting
        "www.allaboutcookies.org" or "www.youronlinechoices.eu". If you
        reject persistent cookies or session cookies, you may continue to
        use the website and mobile application, but you may not be able to
        access all features, or your access may be limited. <Site /> records
        statistical information about users using the website and the
        operations they perform. The user is responsible for their actions
        in the system records. Anyone who benefits from the services
        offered on the <Site /> website is deemed to have read and accepted
        all of these terms. Liwa Yazılım San. Tic. Ltd. Şti., owner of{" "}
        <Site />, reserves the right to change the provisions of the Privacy
        Policy without prior notice. The current Privacy Policy takes effect
        on the date it is presented to the User by any method.
      </p>
    </div>

    <div>
      <h3 className={headingClass}>3- How are website cookies used?</h3>
      <p className="mb-3">
        Liwa Yazılım's <Site /> website uses cookies. A cookie is a file,
        mostly composed of letters and numbers, that allows the device in
        use to be identified by being stored in the internet browser or hard
        disk of that device. <Site /> cookies store information collected
        through log files, blank gif files, and/or third-party sources for
        the purpose of building a summary of your preferences. We use two
        types of cookies across our sites: session cookies and persistent
        cookies. Session cookies are temporary and only valid until you
        close your browser. Persistent cookies remain on your hard disk
        until you delete them or they expire (the duration that cookies
        remain on the device depends on the cookies' "lifetimes"). <Site />{" "}
        cookies are used to remember your preferences and personalize your
        use of the website/mobile application. This includes cookies that
        save your password and keep your website/mobile application session
        continuously open — saving you from re-entering your password on
        every visit — and cookies that remember and recognize you on
        subsequent visits. <Site /> uses these cookies to determine how you
        use the website/mobile application, including measuring where you
        connected from, what content you viewed, and the duration of your
        visit. <Site /> cookies may also be used to enable "advertising
        technology" to deliver advertisements that may interest you when you
        visit search engines, the website, the mobile application, and/or
        other websites where the website advertises. Advertising technology
        uses information about your previous visits to the website/mobile
        application and the websites where the website advertises to deliver
        personalized advertisements. When delivering these ads, a unique
        third-party cookie may be placed in your browser so the website can
        recognize you. Liwa Yazılım also uses Google Analytics, a web
        analytics service provided by Google, Inc. Google Analytics uses
        cookies to analyze how users interact with the website, mobile
        application, and/or mobile site through statistical information and
        reports.
      </p>
      <p>Information about cookies on Liwa Yazılım is provided in the table below:</p>
      <CookieTable
        columns={["Provider", "Cookie Name", "Type", "Duration"]}
        rows={[
          ["Google", "_gat", "Persistent", "2 Years"],
          ["Liwa Yazılım", "ASP.NET_SessionId", "Persistent", "30 Minutes"],
        ]}
      />
    </div>

    <div>
      <h3 className={headingClass}>
        4- For what purposes does Liwa Yazılım use personal data?
      </h3>
      <p className="mb-3">
        Liwa Yazılım may process, record, securely store, update, disclose
        to third parties, transfer, and classify your personal information
        in accordance with its purpose and in a measured manner, in cases
        permitted by legislation. At Liwa Yazılım, your personal data is
        used for the following purposes:
      </p>
      <ul className="list-disc pl-5 space-y-1.5 marker:text-[--primary-1]">
        <li>
          To verify the identity of the person making or initiating a
          purchase through the website/mobile applications,
        </li>
        <li>
          To record address and other information necessary for
          communication,
        </li>
        <li>
          To contact our customers and provide necessary information about
          the conditions, current status, and updates of contracts entered
          into under the relevant articles of the Distance Sales Contract
          and the Consumer Protection Law,
        </li>
        <li>
          To organize all records and documents that will form the basis
          for processing in electronic (internet/mobile, etc.) or paper
          form,
        </li>
        <li>
          To fulfill the obligations undertaken under the contracts entered
          into in accordance with the relevant articles of the Distance
          Sales Contract and the Consumer Protection Law,
        </li>
        <li>
          To provide information to public officials upon request and as
          required by legislation in matters concerning public security,
        </li>
        <li>
          To provide our customers with a better shopping experience, to
          inform them about products that may be of interest based on their
          interests, and to convey campaigns,
        </li>
        <li>
          To increase customer satisfaction, to use in customer environment
          analysis, to use in various marketing and advertising activities,
          and to organize surveys through contracted institutions in this
          scope,
        </li>
        <li>
          To make recommendations through our contracted institutions and
          solution partners and to inform customers about our services,
        </li>
        <li>
          To evaluate customer complaints and suggestions regarding our
          services,
        </li>
        <li>
          To fulfill our legal obligations and exercise our rights arising
          from the legislation in force.
        </li>
      </ul>
    </div>

    <div>
      <h3 className={headingClass}>
        5- How does Liwa Yazılım protect your personal data?
      </h3>
      <p>
        Personal data shared with Liwa Yazılım is under the supervision and
        control of Liwa Yazılım. As the data controller, Liwa Yazılım has
        assumed responsibility for establishing the necessary organization
        and adopting and adapting technical measures to protect the
        confidentiality and integrity of information in accordance with the
        provisions of the relevant legislation in force. Aware of this
        obligation, we conduct periodic penetration tests in accordance with
        international and national technical standards on data privacy, and
        we continually update our data processing policies in this scope.
      </p>
    </div>

    <div>
      <h3 className={headingClass}>
        6- Does Liwa Yazılım share your personal data?
      </h3>
      <p>
        The sharing of our customers' personal data with third parties
        takes place within the framework of the customers' consent, and as
        a rule, personal data is not shared with third parties without our
        customer's approval. However, due to and limited by our legal
        obligations, personal data is shared with courts and other public
        institutions. Additionally, personal data is transferred to
        contracted third parties to provide the services we have committed
        to and to perform quality control of the services provided.
        Necessary technical and legal measures are taken to prevent rights
        violations during data transfer to third parties. However, Liwa
        Yazılım is not responsible for breaches resulting from the data
        protection policies of the third party receiving the personal data
        or occurring within the third party's area of responsibility. Your
        personal data may be shared with Liwa Yazılım's shareholders;
        partner institutions and organizations with which we cooperate to
        carry out our direct/indirect domestic/international activities;
        domestic/international persons and institutions from which we
        receive cloud storage services; domestic/international
        organizations with which we have agreements regarding sending
        commercial electronic messages to our customers; the Interbank
        Card Center; banks with which we have agreements; and various
        agencies, advertising companies, and survey companies in domestic
        and international markets within the scope of various marketing
        activities — and other domestic/international third parties and
        relevant business partners — to provide better service to you and
        ensure customer satisfaction.
      </p>
    </div>

    <div>
      <h3 className={headingClass}>
        7- What are your rights under the Personal Data Protection Law?
      </h3>
      <p className="mb-3">Pursuant to Law No. 6698, you have the right to:</p>
      <ul className="list-[lower-alpha] pl-5 space-y-1.5 marker:text-[--primary-1] marker:font-semibold">
        <li>Learn whether your personal data is being processed,</li>
        <li>Request information if it is being processed,</li>
        <li>
          Learn the purpose of processing and whether it is used in
          accordance with that purpose,
        </li>
        <li>
          Know the third parties to whom it has been transferred
          domestically or abroad,
        </li>
        <li>
          Request correction if it has been processed incompletely or
          incorrectly,
        </li>
        <li>
          Request deletion or destruction within the framework of the
          conditions stipulated in Article 7 of Law No. 6698,
        </li>
        <li>
          Request notification of the operations performed in accordance
          with subparagraphs (e) and (f) above to the third parties to whom
          your data has been transferred,
        </li>
        <li>
          Object to a result that arises against you due to the analysis of
          your data exclusively by automated systems,
        </li>
        <li>
          Request compensation for damages incurred as a result of
          processing in violation of Personal Data Protection Law No. 6698,
        </li>
        <li>Application form.</li>
      </ul>
    </div>

    <div>
      <h3 className={headingClass}>
        8- How can I be informed of legislative changes regarding personal
        data?
      </h3>
      <p>
        Pursuant to Law No. 6698, your rights are obligations of Liwa
        Yazılım. We process your personal data with this awareness and to
        the extent required by legislation, and in the event of legal
        changes, we will update the information on our page in accordance
        with the new legislation. You can easily follow these updates on
        this page at any time.
      </p>
    </div>

    <div>
      <h3 className={headingClass}>
        9- How can I be sure that the data is kept current and accurate?
      </h3>
      <p>
        Pursuant to Article 4 of Law No. 6698, Liwa Yazılım has an
        obligation to keep your personal data accurate and current. In
        order for Liwa Yazılım to fulfill its obligations arising from the
        legislation in force, our customers must share accurate and current
        data with Liwa Yazılım. If your data changes in any way, please
        contact us through the communication channels indicated below to
        update your data.
      </p>
    </div>

    <div>
      <h3 className={headingClass}>
        10- Would you like to ask Liwa Yazılım a question about your
        personal data?
      </h3>
      <p>
        For any questions or feedback regarding your personal data, you can
        reach us at any time at{" "}
        <a href="mailto:support@liwamenu.com" className={linkClass}>
          support@liwamenu.com
        </a>
        .
      </p>
    </div>
  </article>
);

// Small shared cookie table — the columns/rows differ per language but
// the visual structure is identical, so we centralise the markup here.
const CookieTable = ({ columns, rows }) => (
  <div className="mt-3 rounded-xl border border-slate-200 overflow-hidden text-xs">
    <div className="grid grid-cols-12 bg-slate-50 text-slate-700 font-semibold">
      {columns.map((c, i) => (
        <div
          key={c}
          className={`col-span-3 px-3 py-2 ${
            i < columns.length - 1 ? "border-r border-slate-200" : ""
          }`}
        >
          {c}
        </div>
      ))}
    </div>
    {rows.map((row, ri) => (
      <div key={ri} className="grid grid-cols-12 border-t border-slate-100">
        {row.map((cell, ci) => (
          <div
            key={ci}
            className={`col-span-3 px-3 py-2 ${
              ci < row.length - 1 ? "border-r border-slate-100" : ""
            }`}
          >
            {cell}
          </div>
        ))}
      </div>
    ))}
  </div>
);

export default PrivacyPolicy;
