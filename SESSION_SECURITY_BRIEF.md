# Oturum & Güvenlik (Çoklu Cihaz) — Backend Brief

> Backend ekibine (veya backend Claude'una) doğrudan yapıştırılmak üzere
> hazırlanmış, kendi içinde yeterli görev tanımı. Frontend'in gördüğü mevcut
> uçlardan yola çıkar; yalnızca eksik olanları ister.

---

## GÖREV
Admin panelinde kullanıcı oturum güvenliği için 3 davranış:

1. **Aktif oturumları gör:** Kullanıcı, hangi cihaz ve konumlardan oturum
   açtığını (şu anki dahil) görebilsin.
2. **Diğer cihazları kapat:** Bir oturumu tek tek veya hepsini birden ("bu
   cihaz hariç") kapatabilsin.
3. **Şifre değiştirince diğerleri düşsün:** Kullanıcı şifresini değiştirdiğinde
   **diğer** cihazlardaki oturumlar otomatik kapansın; şifreyi değiştirdiği
   **mevcut cihaz açık kalsın**.

---

## MEVCUT DURUM (frontend'den görünen)
- **Login:** `POST Auth/login` `{ emailOrPhone, password, pushToken, deviceType:"web" }`
  → yanıt `{ token, user, sessionId }`. FE bunu localStorage'a yazıyor.
- **Logout:** `DELETE UserSessions/DeleteUserSessionById?userSessionId=…`
  (şu an yalnızca mevcut oturumu silmek için kullanılıyor).
- **Şifre değiştir:** `PUT Users/UpdateUserPasswordByUserId` `{ newPassword, newPasswordConfirm }`.

Yani **`UserSessions` tablosu zaten var**, login her girişte bir oturum kaydı
oluşturup `sessionId` dönüyor ve `deviceType` zaten gönderiliyor. Bu brief o
temelin üstüne kurulur.

---

## ⚠️ EN KRİTİK GEREKSİNİM — Token ↔ Oturum bağlama (enforcement)
Şu an JWT büyük olasılıkla **stateless** (imzalı, `exp` dolana dek geçerli). Bu
durumda bir `UserSession` satırını silmek, o cihazdaki token'ı **geçersiz
kılmaz** — token süresi dolana kadar çalışmaya devam eder. Dolayısıyla aşağıdaki
2, 3, 4 maddeleri ancak şu yapılırsa **gerçekten** işe yarar:

- JWT'ye **`sessionId` claim'i** gömülmeli.
- Her authenticated istekte, token'daki `sessionId`'nin `UserSessions`'ta hâlâ
  **aktif** olduğu doğrulanmalı; değilse **401** dönülmeli. (Tek DB lookup;
  istenirse kısa süreli cache.)

> Frontend zaten **401 alınca otomatik logout + `/login` yönlendirmesi** yapıyor
> (`src/redux/api.js` response interceptor). Yani backend kapatılan oturum için
> 401 döndüğü an, o cihaz kendiliğinden düşer — FE tarafında ek işe gerek yok.

Bu enforcement olmadan "diğer cihazları çıkış yaptır" ve "şifre değişince düşsün"
özellikleri yalnızca **görsel** kalır, gerçek güvenlik sağlamaz.

---

## EKLENECEK / GÜNCELLENECEK UÇLAR

### 1) Aktif oturumları listele — **YENİ**
`GET UserSessions/GetMyUserSessions` (userId JWT'den alınır)

Yanıt: standart `ResponsBase { data: UserSessionDto[] }`, her satır:
```json
{
  "userSessionId": "guid",
  "deviceType": "web",
  "deviceName": "Chrome • Windows",      // User-Agent'tan parse
  "ipAddress": "88.x.x.x",
  "city": "İstanbul",
  "country": "Türkiye",
  "createdAt": "2026-06-18T10:00:00Z",   // giriş zamanı (UTC)
  "lastSeenAt": "2026-06-18T12:30:00Z",  // son aktivite (UTC)
  "isCurrent": true                       // bu isteğin token'ına ait oturum mu
}
```
- `isCurrent`: satırın `sessionId`'si, isteği yapan JWT'nin `sessionId` claim'i
  ile eşleşiyorsa `true`. (FE "Bu cihaz" rozetini ve "kapat" butonunun gizlenmesini
  buna göre yapacak.)
- `lastSeenAt`: isteklerde (throttle'lı, örn. dakikada bir) güncellensin ki
  "son aktif" anlamlı olsun.
- Yalnızca **aktif** oturumlar dönsün (silinen/iptal edilenler değil).

### 2) Tek oturumu kapat — **VAR (doğrulanmalı)**
`DELETE UserSessions/DeleteUserSessionById?userSessionId=…` zaten mevcut.
- Yalnızca **JWT sahibinin kendi** oturumlarından biri silinebilmeli (başka
  kullanıcının `userSessionId`'si gönderilse bile reddedilmeli — yetki kontrolü).
- Silinen oturumun token'ı **bir sonraki istekte 401** almalı (kritik gereksinim).
- İdempotent: zaten silinmiş bir id hata vermesin.

### 3) Diğer tüm oturumları kapat — **YENİ**
`DELETE UserSessions/DeleteOtherUserSessions` (gövde yok; "mevcut" oturum
JWT'deki `sessionId`'den bulunur)
- Kullanıcının, **isteği yapan oturum hariç** tüm oturumlarını siler/pasifler.
- Yanıt: `ResponsBase` (örn. `data`: kapatılan oturum sayısı — opsiyonel).

### 4) Şifre değiştirince diğer oturumları kapat — **GÜNCELLEME**
`PUT Users/UpdateUserPasswordByUserId` — şifre başarıyla değiştikten **sonra**:
- Kullanıcının **mevcut oturum (istekteki `sessionId`) hariç** tüm oturumlarını
  sil/pasifle.
- **Mevcut cihaz açık kalsın** — kullanıcı şifre değiştirdiği cihazdan
  atılmamalı. (Bu, daha önce tespit edilen "şifre değişince kullanıcının kendisi
  de çıkıyor" davranışını da düzeltir.)
- Alternatif politika (istenirse): "mevcut dahil hepsini kapat + yeniden giriş
  iste". Ancak **istenen davranış: mevcut kalsın, diğerleri düşsün.**

---

## VERİ MODELİ — `UserSession`'da gereken alanlar
Çoğu zaten olabilir; eksikse eklenmeli:
`deviceType`, `deviceName`/`userAgent`, `ipAddress`, `city`, `country`,
`createdAt`, `lastSeenAt`, `isActive` (veya `revokedAt`). JWT'ye `sessionId` claim'i.

## KONUM ÇÖZÜMLEME (IP → şehir/ülke)
- Login sırasında isteğin IP'si yakalanıp şehir/ülkeye çözümlenmeli (backend
  tarafında IP-geo).
- Reverse-proxy/CDN arkasındaysa `X-Forwarded-For`'un ilk IP'si kullanılmalı.
- Çözümlenemezse `city`/`country` `null` bırakılsın (FE "Bilinmeyen konum" gösterir).

## YENİ CİHAZ/KONUM BİLDİRİMİ ("bilgilendirme" — opsiyonel)
- Login'de cihaz/IP/konum bu kullanıcı için daha önce görülmemişse:
  - Oturuma `isNewDevice`/`isNewLocation` flag'i koymak, ve/veya
  - Güvenlik e-postası/push: *"Yeni cihazdan giriş: {deviceName}, {city/country},
    {time}. Siz değilseniz şifrenizi değiştirin."*
- **Asgari kapsam:** liste UI'si zaten kullanıcıyı bilgilendiriyor. E-posta/push
  ek güvence (nice-to-have) — backend kapsamı netleştirsin.

---

## KABUL KRİTERLERİ
1. `GetMyUserSessions` kullanıcının tüm **aktif** oturumlarını cihaz + konum +
   zaman ile döner; `isCurrent` doğru işaretlenir.
2. `DeleteUserSessionById` ile kapatılan oturumun token'ı **bir sonraki istekte
   401** alır (sadece görsel değil, gerçek geçersizleme).
3. `DeleteOtherUserSessions` mevcut hariç hepsini kapatır; mevcut oturum
   çalışmaya devam eder.
4. `UpdateUserPasswordByUserId` sonrası **diğer** cihazlar 401 alır; şifreyi
   değiştiren cihaz açık kalır.
5. Bir kullanıcı **başka** kullanıcının oturumunu listeleyemez/kapatamaz.

## TEST PLANI
```
# İki ayrı tarayıcı (A ve B) ile aynı kullanıcıya giriş yap → 2 oturum.
GET UserSessions/GetMyUserSessions            → 2 kayıt, biri isCurrent:true

# A'dan B'nin oturumunu kapat
DELETE UserSessions/DeleteUserSessionById?userSessionId={B}
→ B'nin BİR SONRAKİ isteği 401 (B otomatik /login'e düşer)

# "Diğerlerini kapat"
(yeniden çok oturum aç) DELETE UserSessions/DeleteOtherUserSessions
→ yalnızca isteği yapan oturum sağ kalır; diğerleri 401

# Şifre değiştir
PUT Users/UpdateUserPasswordByUserId {…}
→ diğer cihazlar 401; şifreyi değiştiren cihaz çalışmaya devam eder

# Yetki
A, B kullanıcısının userSessionId'sini göndererek silmeye çalışır → reddedilir
```

---

## FRONTEND TARAFI (uç sözleşmesi netleşince devreye alınır)
- `src/redux/userSessions/` slice'ları: `getMyUserSessions`, `deleteUserSession`
  (mevcut `DeleteUserSessionById`'a bağlanır), `deleteOtherUserSessions`.
- **Profil** sayfasına "Güvenlik / Aktif Oturumlar" bölümü: liste (cihaz, konum,
  son aktif zaman, "Bu cihaz" rozeti) + her satırda "Kapat" + üstte "Diğer tüm
  cihazları çıkış yaptır" (onay penceresiyle).
- Birden fazla / yeni konumdan oturum varsa bilgilendirici uyarı şeridi.
- Şifre değiştirme ekranına "Diğer cihazlar çıkış yapılacak" bilgi notu.
- 401 enforcement sayesinde kapatılan cihaz **kendiliğinden** `/login`'e düşer
  (ek FE işine gerek yok).

## AÇIK SORULAR (backend netleştirsin)
1. JWT şu an stateless mı? `sessionId` claim'i eklenip her istekte oturum-aktif
   doğrulaması yapılabilir mi? (Bu özelliğin temel taşı.)
2. `UserSession` tablosunda hangi alanlar zaten var (deviceName, ipAddress,
   city/country, lastSeenAt)?
3. IP→konum için kullanılan/önerilen bir servis var mı?
4. "Kapat" için **hard delete** mi yoksa **pasifleme (`revokedAt`)** mi tercih
   edilir? (Audit için pasifleme daha iyi olabilir.)
5. Token'ın doğal son kullanma süresi (`exp`) nedir?
