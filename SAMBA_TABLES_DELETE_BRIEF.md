# SambaPOS Masalarını Silme — Backend Brief

> Backend ekibine (veya backend Claude'una) doğrudan yapıştırılmak üzere
> hazırlanmış, kendi içinde yeterli görev tanımı.

---

## GÖREV
Admin panelindeki **QR Kod Oluşturma > "SambaPOS Masaları"** modalına, kullanıcının **seçtiği masaları silme** özelliği eklenecek. Bunun için backend'de bir **silme uç noktası** gerekiyor. Şu an yalnızca okuma var.

## MEVCUT DURUM (frontend)
- Okuma: `GET /api/TableNames/GetByRestaurantId?restaurantId=…` → masa adları (`ResponsBase { data, message_TR, … }`; satırlar `RestaurantTableNameItemUpsertDto { sambaId, name }`, frontend `name`'leri `string[]`'e düzleştiriyor).
- Admin bu listeyi QR üretmek için gösteriyor. Ekleme/güncelleme/silme ucu frontend'de **yok**.

## EKLENECEK UÇ
**`DELETE /api/TableNames/Delete`** (veya `POST` — backend tercihine göre)

Gövde:
```json
{
  "restaurantId": "f9f7344a-bcf8-47fb-9aaf-4736341c4fa8",
  "names": ["Masa-1", "Masa-5", "Bahçe-3"]
}
```
- `restaurantId` (zorunlu): hangi restoranın masaları.
- `names` (zorunlu): silinecek masa adlarının listesi (kullanıcının modalda seçtikleri). Frontend elinde sadece `name` tutuyor; bu yüzden **ad bazlı silme** en pratiği. Backend `sambaId` ile silmeyi tercih ederse `sambaIds: number[]` alanını da kabul edebilir — ikisinden biri yeterli, lütfen hangisini beklediğinizi netleştirin.

Davranış:
- Verilen restoranın, listedeki adlara sahip masa-adı kayıtlarını siler.
- Yalnızca **o restorana ait** kayıtları etkiler (auth/token üzerinden restoran doğrulaması).
- **İdempotent**: listede olmayan/zaten silinmiş bir ad hata vermesin, sessizce atlanmalı.
- Yanıt: standart `ResponsBase` (örn. `message_TR: "Seçilen masalar silindi"`, `data`: silinen sayısı veya güncel liste — opsiyonel).

## ⚠️ SambaPOS senkronu — önemli not
Masa adları SambaPOS'tan senkron/upsert ediliyor. **Silme kalıcı mı, yoksa bir sonraki senkronda geri gelir mi?** netleştirilmeli:
- Beklenen davranış: kullanıcı bir masayı sildiğinde **kalıcı olarak silinsin** (bir sonraki SambaPOS senkronunda geri dönmesin). Bunun için ya senkron tarafında "kullanıcı tarafından silinenler" işaretlenmeli, ya da silme gerçek `DELETE` olmalı ve senkron yalnızca yeni/eksik olanları eklemeli (mevcutları ezmemeli).
- Eğer bu mümkün değilse ve silinenler senkronda geri geliyorsa, lütfen belirtin — frontend tarafında kullanıcıya "senkronda geri gelebilir" uyarısı gösteririz.

## KABUL KRİTERLERİ
1. `DELETE /api/TableNames/Delete` `{ restaurantId, names:[...] }` ile verilen masaları siler.
2. Sonraki `GET /api/TableNames/GetByRestaurantId` silinen adları **döndürmez**.
3. Başka restoranın masaları etkilenmez; geçersiz/var olmayan ad hata vermez (idempotent).
4. Silme ile SambaPOS senkronu etkileşimi (1 numaralı not) belirlenmiş ve dökümante edilmiş olur.

## TEST PLANI
```
# Önce mevcut listeyi al
GET /api/TableNames/GetByRestaurantId?restaurantId=X → ["Masa-1","Masa-2","Masa-3", ...]

# Seçilenleri sil
DELETE /api/TableNames/Delete  Body: { "restaurantId":"X", "names":["Masa-2","Masa-3"] }
→ 200, ResponsBase

# Tekrar oku
GET /api/TableNames/GetByRestaurantId?restaurantId=X → ["Masa-1", ...]  (Masa-2, Masa-3 yok)

# İdempotent kontrol
DELETE ... Body: { "restaurantId":"X", "names":["Masa-2"] }  (zaten silinmiş) → 200, hata yok
```

## NOT — Frontend tarafı
Uç hazır olduğunda admin tarafında `redux/sambaTables/deleteSambaTablesSlice.js` (thunkType örn. `TableNames/Delete`) eklenip, `SambaTablesModal`'a "Seçilenleri Sil" aksiyonu (onay penceresiyle) bağlanacak. Sözleşme netleşince uçtan uca devreye alınır.
