# Deneme lisansı ÇİFT oluşuyor — idempotent yap (1 QR + 1 TV)

> Backend ekibine doğrudan yapıştırılmak üzere. TRIAL_LICENSE_BRIEF.md'nin
> devamı/düzeltmesi.

---

## DURUM
21 günlük deneme lisansı grant'ı (yeni hesabın ilk restoranında QR + TV) artık
**çalışıyor** — teşekkürler. Ancak bir hata var:

**Yeni hesap + ilk restoran oluşturulduğunda 4 lisans ekleniyor:**
- 2 × **QR Menü** lisansı
- 2 × **TV Menü** lisansı

Olması gereken: **tam olarak 1 QR + 1 TV** (her biri 21 gün, aktif).

## NEDEN (muhtemel)
Aşağıdakilerden biri:
1. Deneme-grant kodu **iki kez** çalışıyor (örn. `CreateRestaurant` içinde + bir
   event/hook'ta tekrar), veya
2. Grant döngüsü her tür için iki kayıt ekliyor, veya
3. İdempotency/`trialGranted` bayrağı kontrol edilmeden insert yapılıyor.

> Not: Frontend `Restaurants/AddRestaurant`'ı **tek sefer** çağırıyor (gönder butonu
> istek sırasında devre dışı). Yani çift kayıt FE kaynaklı değil — grant mantığı
> sunucu tarafında duplike üretiyor.

## YAPILACAK
1. **İlk restoran grant'ını idempotent yap:** Bir restorana / hesaba deneme lisansı
   verirken, **aynı türden aktif deneme lisansı zaten varsa yeniden ekleme.** Sonuç
   her zaman türünde **tek** kayıt olmalı (1 QR + 1 TV).
2. **Hesap düzeyinde `trialGranted` bayrağı** (TRIAL_LICENSE_BRIEF #5): grant yalnızca
   bir kez koşmalı; bayrak set'liyse tekrar grant yok.
3. **Mevcut bozuk kayıtların temizliği:** halihazırda 2'şer lisans almış test/canlı
   hesaplardaki fazlalıkları temizleyin (her türden 1 aktif kalsın). Tek bir cleanup
   sorgusu yeterli (aynı restaurantId + aynı licensePackageType + aktif + deneme olan
   kayıtların en yenisi/eskisi hariç sil).

## KABUL KRİTERLERİ
1. Yeni hesap + ilk restoran → `Licenses/GetLicensesByRestaurantId` **2 kayıt** döndürür
   (1 QR + 1 TV), 4 değil.
2. `CreateRestaurant` retry / çift tetikleme durumunda bile tür başına tek kayıt kalır.
3. İkinci ve sonraki restoranlar deneme lisansı **almaz** (mevcut davranış korunur).

## TEST
```
1. Yeni hesap aç → ilk restoranı oluştur.
2. GET Licenses/GetLicensesByRestaurantId?restaurantId=<yeni> → tam 2 kayıt
   (licensePackageType: QRLicensePackage ×1, TVLicensePackage ×1), her biri ~21 gün, aktif.
3. (Varsa) idempotency: aynı oluşturmayı tekrar tetikle → yine 2 kayıt.
```

## FRONTEND TARAFI (bilgi)
- İlk restoran oluşturulunca admin artık bir **karşılama modalı** gösteriyor
  (`src/components/restaurants/trialWelcomeModal.jsx`): yeni restoranın lisanslarını
  çeker, **türe göre tekilleştirip** (4 kayıt gelse bile "QR Menü + TV Menü" gösterir)
  21 günlük deneme bilgisini + bitiş tarihini sunar.
- Yani bu dup, kullanıcı arayüzünde maskeleniyor; ama **veritabanında 4 kayıt** var —
  asıl düzeltme backend'de (yukarıdaki cleanup + idempotency).
