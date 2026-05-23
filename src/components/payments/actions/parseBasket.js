// Normalize a Payment.basketItems blob into the unified basket shape:
//
//   {
//     type: "NewLicense" | "ExtendLicense" | string,
//     username: string,
//     items: [
//       {
//         restaurantId, restaurantName, licenseId,
//         licensePackageIds: [],
//         packages: [
//           { licenseId, licensePackageId, licensePackageName,
//             licensePackageType, licensePackageTypeId,
//             licensePackageTime, licensePackageTimeUnitId,
//             licensePackagePrice }
//         ]
//       }
//     ],
//     faturaBilgileri: { ... } | null,
//   }
//
// `basketItems` can arrive as:
//   • The JSON string of the unified shape (modern).
//   • A `[obj]` array wrapper of the unified shape (some flows).
//   • The legacy capitalized flat object
//     `{ Username, RestaurantName, Licenses: [...] }` (pre-unification
//     payments still in the DB). Wrapped into a single-item unified
//     shape, with packages[] derived from Licenses[].
//
// `fallbacks` lets the caller pass payment-row fields (userName,
// restaurantName, licenseType) used when the basket itself doesn't
// carry them.
//
// Never throws. On malformed JSON returns `null` so the caller can
// render a "Sepet bilgisi okunamadı" placeholder instead of crashing.

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const isUnifiedShape = (o) =>
  o &&
  typeof o === "object" &&
  (Array.isArray(o.items) || typeof o.username === "string");

const isLegacyShape = (o) =>
  o && typeof o === "object" && Array.isArray(o.Licenses);

const normalizePackage = (p, legacyParent) => {
  if (!p || typeof p !== "object") return null;
  // Tolerate both casing conventions — legacy items used capitalized
  // PascalCase keys; the unified shape uses lowerCamelCase.
  return {
    licenseId: p.licenseId ?? p.LicenseId ?? legacyParent?.LicenseId ?? null,
    licensePackageId: p.licensePackageId ?? p.LicensePackageId ?? null,
    licensePackageName: p.licensePackageName ?? p.LicensePackageName ?? "",
    licensePackageType: p.licensePackageType ?? p.LicensePackageType ?? "",
    licensePackageTypeId: num(p.licensePackageTypeId ?? p.LicensePackageTypeId),
    licensePackageTime: num(p.licensePackageTime ?? p.LicensePackageTime),
    licensePackageTimeUnitId: num(
      p.licensePackageTimeUnitId ?? p.LicensePackageTimeUnitId,
    ),
    licensePackagePrice: num(p.licensePackagePrice ?? p.LicensePackagePrice),
  };
};

const normalizeItem = (it) => {
  if (!it || typeof it !== "object") return null;
  const packages = Array.isArray(it.packages)
    ? it.packages.map((p) => normalizePackage(p)).filter(Boolean)
    : [];
  return {
    restaurantId: it.restaurantId ?? null,
    restaurantName: it.restaurantName ?? "",
    licenseId: it.licenseId ?? null,
    licensePackageIds: Array.isArray(it.licensePackageIds)
      ? it.licensePackageIds
      : [],
    packages,
  };
};

// Wrap a legacy flat blob into a single-item unified shape.
const fromLegacy = (legacy, fallbacks) => {
  const Licenses = Array.isArray(legacy.Licenses)
    ? legacy.Licenses
    : legacy.Licenses
      ? [legacy.Licenses]
      : [];
  const packages = Licenses.map((p) => normalizePackage(p, legacy)).filter(
    Boolean,
  );
  return {
    type: fallbacks?.type ?? "NewLicense",
    username: legacy.Username ?? fallbacks?.userName ?? "",
    items: [
      {
        restaurantId: legacy.RestaurantId ?? null,
        restaurantName:
          legacy.RestaurantName ?? fallbacks?.restaurantName ?? "",
        licenseId: legacy.LicenseId ?? null,
        licensePackageIds: [],
        packages,
      },
    ],
    faturaBilgileri: legacy.FaturaBilgileri ?? null,
  };
};

const fromUnified = (u, fallbacks) => {
  const items = Array.isArray(u.items)
    ? u.items.map(normalizeItem).filter(Boolean)
    : [];
  // Single-restaurant baskets sometimes ship without items[] populated
  // — fall back to fallbacks.restaurantName so the summary card isn't
  // empty.
  if (items.length === 0 && fallbacks?.restaurantName) {
    items.push({
      restaurantId: null,
      restaurantName: fallbacks.restaurantName,
      licenseId: null,
      licensePackageIds: [],
      packages: [],
    });
  }
  return {
    type: u.type ?? fallbacks?.type ?? "NewLicense",
    username: u.username ?? fallbacks?.userName ?? "",
    items,
    faturaBilgileri:
      u.faturaBilgileri && typeof u.faturaBilgileri === "object"
        ? u.faturaBilgileri
        : null,
  };
};

export function parsePaymentBasket(basketItems, fallbacks) {
  if (basketItems == null) return null;
  let raw = basketItems;
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  // Some flows wrap the unified object in a single-element array.
  if (Array.isArray(raw)) {
    raw = raw[0];
  }
  if (!raw || typeof raw !== "object") return null;

  if (isUnifiedShape(raw)) return fromUnified(raw, fallbacks);
  if (isLegacyShape(raw)) return fromLegacy(raw, fallbacks);

  // Unknown shape: surface a minimal envelope with whatever the
  // payment row knew so the modal can still show user/restaurant.
  return fromUnified({ items: [] }, fallbacks);
}

export const basketGrandTotal = (basket) => {
  if (!basket?.items) return 0;
  let sum = 0;
  for (const it of basket.items) {
    for (const p of it.packages || []) {
      sum += num(p.licensePackagePrice);
    }
  }
  return sum;
};

export const basketHasInvoice = (basket) => {
  const f = basket?.faturaBilgileri;
  if (!f || typeof f !== "object") return false;
  return Object.values(f).some(
    (v) => v != null && String(v).trim().length > 0,
  );
};
