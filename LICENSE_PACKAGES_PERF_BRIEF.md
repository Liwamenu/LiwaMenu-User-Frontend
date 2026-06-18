# Lisans Uzatma / Satın Alma Sayfası Yavaş Açılıyor — Performans Brief

> Backend ekibine (veya backend Claude'una) doğrudan yapıştırılmak üzere.
> Frontend tarafı analiz edildi; darboğaz büyük olasılıkla backend uç
> noktasının yanıt süresi. Aşağıda kanıt + istenen ölçüm/iyileştirmeler var.

---

## SEMPTOM
Kullanıcı **Lisans Uzat** veya **Lisans Al (satın alma)** sayfasına geçtiğinde
sayfa **~5–6 saniye** boş/spinner ile bekliyor, sonra açılıyor. Her girişte
tekrarlıyor (ilk sefere özgü değil).

## FRONTEND İZİ (neden tüm sayfa kilitleniyor)
- Sayfa açılır açılmaz ilk adım (FirstStep) şu çağrıları yapıyor:
  - **`GET LicensePackages/GetLicensePackages`** (hem uzatma hem satın almada).
  - **`GET Restaurants/GetmyRestaurants`** (yalnızca satın almada, restoran
    seçici için).
- Bu çağrılar **global tam-ekran loader**'ı tetikliyor (loadingMiddleware),
  yani **istek dönene kadar tüm sayfa spinner arkasında bekliyor**.
- **İstemci tarafı cache yok**: her ziyarette `GetLicensePackages` baştan
  çekiliyor (paket kataloğu nadiren değişse de).
- Sonuç: algılanan 5–6 sn = bu uç noktaların **sunucu yanıt süresi**.

> Frontend mount'ta başka ağır iş yapmıyor; tek mount-time iş bu GET'ler.
> Dolayısıyla gecikme uç noktanın kendisinde.

## BİRİNCİL ŞÜPHELİ
**`LicensePackages/GetLicensePackages`** (her iki sayfada ortak). Lütfen
önce bunun **sıcak** (cold-start değil) sunucu işleme süresini ölçün.

## İSTENEN İNCELEME / ÖLÇÜM
1. `GetLicensePackages` için **sunucu tarafı süre** (DB + işleme) loglansın.
   Tutarlı 5–6 sn mi, yoksa yalnızca **cold-start**'ta mı yavaş?
2. **Cold-start mı?** Uygulama havuzu / sunucu boştayken ilk istek 5–6 sn
   sürüp sonrakiler hızlıysa, bu endpoint'e özgü değil — warmup sorunudur
   (aşağıdaki "Cold-start" notuna bakın).
3. Endpoint'e özgü yavaşlıksa olası nedenler:
   - **Kullanıcıya özel fiyat (`userPrice`) hesabı** her paket için ayrı
     sorgu/iş yapıyor olabilir (N+1).
   - Eksik **index**ler (paket/fiyat/kullanıcı join'leri).
   - Tüm paketlerin ağır **include**'larla / gereksiz alanlarla dönmesi.
   - Büyük yanıt gövdesi / yavaş serialization.

## İSTENEN İYİLEŞTİRMELER
- `GetLicensePackages`'i **tek sorgu / projection** ile döndürün; N+1'i
  giderin (özellikle `userPrice`).
- Paket kataloğu nadir değiştiği için **sunucu tarafı cache** (in-memory /
  output cache, kısa TTL veya değişimde invalidasyon) ekleyin.
- Gerekli index'leri ekleyin.
- Yanıtı yalnızca gereken alanlarla küçültün (FE şu an `data[].{ id,
  licenseTypeId, licensePackageType, timeId, time, userPrice, description,
  isActive, isCourier }` kullanıyor).

## COLD-START İSE
Backend IIS/serverless'ta boşta kalıp warmup yaşıyorsa:
- Always-On / app-pool idle-timeout ayarı, preload/warmup isteği veya
  periyodik health-ping ile sıcak tutun. Bu, sadece lisans sayfasını değil
  **ilk authenticated isteği** hızlandırır.

## (Varsa) İKİNCİL: `GetmyRestaurants`
Satın alma sayfası restoran seçici için `GetmyRestaurants`'i de çekiyor.
Bu da yavaşsa aynı ölçüm/iyileştirme uygulanmalı. (Restoranlar liste sayfası
da bunu kullanıyor; orası hızlıysa sorun büyük olasılıkla yalnızca
`GetLicensePackages`.)

## KABUL KRİTERİ
- `GetLicensePackages` **sıcak** p95 < ~500 ms.
- Lisans uzat/satın al sayfası anında açılır (uç nokta + FE düzeltmeleriyle).

## TEST PLANI
```
# Sıcak ölçüm (auth token ile), ardışık 10 çağrı süresi:
GET /api/LicensePackages/GetLicensePackages   → her birinin server süresi
# Cold-start kontrolü: app pool'u recycle et, ilk çağrı vs sonraki çağrılar.
# GetmyRestaurants için aynı ölçüm.
```

## NOT — Frontend tarafı (paralel iyileştirme)
Backend hızlansa da hızlanmasa da FE şu iki iyileştirmeyi yapabilir (öneri):
1. `GetLicensePackages` fetch'ini **global loader'dan çıkarmak** (sayfa
   anında açılsın, yalnızca paket listesi alanında satır-içi spinner dönsün).
   → "sayfa 5–6 sn bekliyor" algısını hemen giderir.
2. Paket kataloğunu **istemcide cache**lemek (stale-while-revalidate) → tekrar
   ziyaretlerde anında. Asıl gecikme yine de uç nokta süresi olduğundan,
   kalıcı çözüm backend tarafındadır.
