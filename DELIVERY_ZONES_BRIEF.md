# `deliveryZones` — mesafeye göre kademeli min. tutar + teslimat ücreti

> Backend ekibine (veya backend Claude'una) doğrudan yapıştırılmak üzere
> hazırlanmış, kendi içinde yeterli görev tanımı.

---

## GÖREV
Restoran sahipleri **Paket Sipariş**te tek (düz) minimum tutar / teslimat ücreti yerine
**mesafeye göre kademeli** fiyatlandırma istiyor. Örn: 0–2 km min 100₺ ücretsiz,
2–5 km min 150₺ + 25₺, 5–10 km min 200₺ + 50₺.

Admin paneli artık bu kademeleri **`deliveryZones`** dizisi olarak gönderiyor. Backend'in
tek yapması gereken: bu diziyi restoran varlığında **saklamak** ve ilgili GET'lerde
**geri döndürmek** — `googleReviewLink` / `googleAnalytics` ile birebir aynı katkısal desen.

## VERİ MODELİ (restoran varlığında, camelCase)
Nullable bir `deliveryZones` dizisi:
```jsonc
"deliveryZones": [
  { "maxDistanceKm": 2,  "minOrderAmount": 100, "deliveryFee": 0  },
  { "maxDistanceKm": 5,  "minOrderAmount": 150, "deliveryFee": 25 },
  { "maxDistanceKm": 10, "minOrderAmount": 200, "deliveryFee": 50 }
]
```
- **Üst-sınırlı (upper-bound) model:** her eleman "şu km'ye kadar" demektir. `maxDistanceKm`
  **artan sıralı**. Mesafesi `d` olan müşteri, `d ≤ maxDistanceKm` olan **ilk** kademeye düşer.
  Son kademenin `maxDistanceKm`'i = teslimat yarıçapı; ötesi "kapsama dışı".
- Alan tipleri: `maxDistanceKm`, `minOrderAmount`, `deliveryFee` → decimal/number.
- **Opak sakla** — sunucu tarafında doğrulama/dönüşüm gerekmez (admin zaten coerce + artan
  sıralama + boş-satır temizliği yapıp gönderiyor). İstenirse hafif doğrulama: artan sıralı.

## YAPILACAKLAR (katkısal — `googleReviewLink` ile aynı)
1. **Kabul + persist:** `PUT /api/Restaurants/SetRestaurantSettings` gövdesindeki
   `deliveryZones` dizisini sakla. (Admin tüm ayar nesnesini gönderiyor; dizi içinde.)
2. **Döndür (camelCase `deliveryZones`):**
   - `GET /api/Restaurants/GetmyRestaurants` (admin ayar formu buradan okur),
   - `GET /api/Restaurants/GetRestaurantById`,
   - **`GET /api/Restaurants/GetRestaurantFullByTenant`** (müşteri menüsü teması buradan okur — kritik).
3. Mevcut satırlar için varsayılan `null` / boş dizi.

## ⚠️ Mevcut düz alanlar — KALDIRMAYIN
`deliveryFee`, `minOrderAmount`, `maxDistance` alanları **aynen kalmalı**. Admin, kademelerden
türeterek bunları da yazmaya devam ediyor (geriye dönük uyum):
- `maxDistance` = son (en uzak) kademenin `maxDistanceKm`'i,
- `deliveryFee` = ilk (en yakın) kademenin `deliveryFee`'si,
- `minOrderAmount` = ilk kademenin `minOrderAmount`'ı.

Böylece **henüz güncellenmemiş müşteri tema build'leri** taban kademeyle sorunsuz çalışmaya
devam eder; sözleşme kırılmaz. Sadece `deliveryZones` sütunu/alanı ekleniyor.

## KABUL KRİTERLERİ
1. `SetRestaurantSettings` ile gönderilen `deliveryZones` saklanır.
2. Yukarıdaki 3 GET de `deliveryZones`'u camelCase, gönderildiği sırayla döndürür.
3. Mevcut düz `deliveryFee`/`minOrderAmount`/`maxDistance` alanları çalışmaya devam eder.
4. `deliveryZones` boş/null olan eski restoranlar hata vermez.

## TEST PLANI
```
# Yaz
PUT /api/Restaurants/SetRestaurantSettings
  Body (kısaltılmış): { restaurantId:"X", ...,
    deliveryZones:[
      {maxDistanceKm:2,minOrderAmount:100,deliveryFee:0},
      {maxDistanceKm:5,minOrderAmount:150,deliveryFee:25}
    ] }
→ 200, ResponsBase

# Oku (üçü de deliveryZones'u aynı içerikle döndürmeli)
GET /api/Restaurants/GetmyRestaurants            → restoran X → deliveryZones:[...]
GET /api/Restaurants/GetRestaurantById?restaurantId=X  → deliveryZones:[...]
GET /api/Restaurants/GetRestaurantFullByTenant?tenant=... → deliveryZones:[...]

# Düz alan uyumu
Aynı yanıtlarda maxDistance=5, deliveryFee=0, minOrderAmount=100 (taban kademe) olmalı.
```

## FRONTEND TARAFI (bilgi)
- Admin: `src/components/restaurant/restaurantSettings.jsx` — `DeliveryZonesEditor` (kademe
  satırları), `seedDeliveryZones` (kayıtlı dizi yoksa düz alanlardan tek kademe türetir),
  kaydetmede coerce + artan sıralama + düz alan türetme. `setRestaurantSettings` tüm nesneyi
  gönderdiği için `deliveryZones` otomatik taşınır; ek slice değişikliği yok.
- Backend henüz döndürmüyorken admin **zarifçe** düz değerlerden seed olur (özellik bozulmaz).

---

## SONRAKİ ADIM — Müşteri menüsü teması (ayrı repo, ayrı görev)
> Bu brief'in kapsamı backend. Aşağıdaki not, müşteri temasını (`D:\LiwaMenu Temalar\Qr Menu`)
> güncelleyecek kişi/Claude içindir. Tema bugün düz değerleri uyguluyor; kademe okuması eklenecek.

Tema müşteri mesafesini zaten **km cinsinden** hesaplıyor (`src/hooks/useLocation.ts`,
Haversine). Yapılacaklar:
1. `src/types/restaurant.ts`: `deliveryZones?: { maxDistanceKm:number; minOrderAmount:number; deliveryFee:number }[]`.
2. Yardımcı `findTierByDistance(distanceKm, zones)` → `zones` (artan) içinde `distanceKm ≤
   maxDistanceKm` olan **ilk** kademe; hiçbiri yoksa `null` (= kapsama dışı).
3. `src/components/menu/CheckoutModal.tsx`:
   - Teslimat ücreti (~satır 206): düz `restaurant.deliveryFee` yerine seçilen kademenin
     `deliveryFee`'si.
   - Min. tutar kontrolü (~satır 318): düz `restaurant.minOrderAmount` yerine kademenin
     `minOrderAmount`'ı.
   - Kapsam kapısı (~satır 213–232): `deliveryZones` doluysa "hiç kademe eşleşmedi" → kapsama
     dışı; doğru kademe min/ücretini kullan.
   - **Fallback:** `deliveryZones` boş/yoksa mevcut düz değer davranışına dön.
4. Yeni müşteri-yüzü i18n anahtarları (kademe/aralık bilgisi) — `src/locales/{LANG}/translation.json`
   (11 dil). Mevcut `order.outOfRange` / `order.minOrderError` yeniden kullanılabilir.
