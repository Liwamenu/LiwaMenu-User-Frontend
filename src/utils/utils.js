import toast from "react-hot-toast";
import i18n from "../config/i18n";
// import licenseTypeIds from "../enums/licenseTypeIds";

export function formatDateString({
  dateString,
  letDay = true,
  letMonth = true,
  letYear = true,
  hour = false,
  min = false,
  sec = false,
  joint = "-",
}) {
  const date = new Date(dateString);

  // Extract the month, day, and year
  const day = date.getDate();
  const month = date.getMonth() + 1; // getMonth() returns 0-based month
  const year = date.getFullYear().toString(); //.slice(-2); // Get the last 2 digits of the year
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  let formattedDate = "";

  if (letDay || letMonth || letYear) {
    let dateString = "";

    if (letDay) {
      dateString = day;
    }

    if (letMonth) {
      dateString += joint + month + joint;
    }

    if (letYear) {
      dateString += year;
    }
    formattedDate = dateString;
  }

  if (hour || min || sec) {
    let timeString = "";

    if (hour) {
      timeString += `${hours.toString().padStart(2, "0")}`;
    }

    if (min) {
      timeString += `:${minutes.toString().padStart(2, "0")}`;
    }

    if (sec) {
      timeString += `:${seconds.toString().padStart(2, "0")}`;
    }

    // Append the time to the date
    formattedDate += ` ${timeString.trim()}`;
  }

  return formattedDate;
}

export const formatDate = (date) => {
  const formattedDate = new Date(date);
  const month = (formattedDate.getMonth() + 1).toString().padStart(2, "0");
  const day = formattedDate.getDate().toString().padStart(2, "0");
  const year = formattedDate.getFullYear().toString().padStart(4, "0");
  const hours = formattedDate.getHours().toString().padStart(2, "0");
  const minutes = formattedDate.getMinutes().toString().padStart(2, "0");
  const seconds = formattedDate.getSeconds().toString().padStart(2, "0");
  return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
};

export const formatToIso = (date) => {
  return date ? new Date(date).toISOString() : "";
};

export function getRemainingDays(endDateTime) {
  const start = new Date();
  const end = new Date(endDateTime);

  // Calculate the difference in milliseconds
  const diff = end - start;

  // Convert milliseconds to days
  const remainingDays = Math.ceil(diff / (1000 * 60 * 60 * 24));

  return remainingDays;
}

export const maxInput = (e) => {
  const { value, type, name } = e.target;
  const maxAllowed = e.target?.maxLength;

  let useVal = value;

  // Live sanitization for price inputs: digits + at most one '.' and one ','.
  // Always runs (regardless of maxLength) so the user can never type more
  // than one of each separator. Display is intentionally NOT formatted with
  // thousands separators while typing — the cursor jumping users can't keep
  // up. Locale-aware formatted display is only used in read-only cells via
  // formatPrice() below.
  if (name === "price") {
    useVal = sanitizePriceInput(useVal);
  }

  // Enforce max length
  if (maxAllowed && maxAllowed !== -1 && useVal?.length > maxAllowed) {
    if (type === "number" || name === "digit") {
      useVal = useVal.replace(/[^\d]/g, "");
    }
    return useVal.slice(0, maxAllowed);
  }

  return useVal;
};

// Allow only digits, at most one '.' and at most one ','. First occurrence
// of each separator wins; subsequent ones are dropped. Letters / currency
// symbols are stripped. Empty input passes through as "".
export function sanitizePriceInput(value) {
  if (value === null || value === undefined) return "";
  const s = String(value);
  let dotSeen = false;
  let commaSeen = false;
  let out = "";
  for (const ch of s) {
    if (ch >= "0" && ch <= "9") {
      out += ch;
    } else if (ch === ".") {
      if (!dotSeen) {
        out += ch;
        dotSeen = true;
      }
    } else if (ch === ",") {
      if (!commaSeen) {
        out += ch;
        commaSeen = true;
      }
    }
  }
  return out;
}

// Parse a user-entered price string to a canonical Number. Accepts any
// combination of '.' and ',' as decimal/thousands separators using the
// "last separator wins" heuristic — same approach as Stripe / Shopify:
//   "12,50"     → 12.5     (single comma → decimal, common in TR/EU)
//   "12.50"     → 12.5     (single dot → decimal, common in US)
//   "1,234.56"  → 1234.56  (US: comma thousands, dot decimal)
//   "1.234,56"  → 1234.56  (TR: dot thousands, comma decimal)
//   "1.234.56"  → 1234.56  (ambiguous → last separator is decimal)
//   ""          → 0
export function parsePrice(input) {
  if (input === null || input === undefined || input === "") return 0;
  if (typeof input === "number") return Number.isFinite(input) ? input : 0;
  const s = String(input).trim().replace(/[^\d.,-]/g, "");
  if (!s) return 0;

  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");
  const decimalIdx =
    lastDot < 0 && lastComma < 0
      ? -1
      : Math.max(lastDot, lastComma);

  let normalized;
  if (decimalIdx === -1) {
    normalized = s.replace(/[.,]/g, "");
  } else {
    const intPart = s.slice(0, decimalIdx).replace(/[.,]/g, "");
    const decPart = s.slice(decimalIdx + 1).replace(/[.,]/g, "");
    normalized = `${intPart}.${decPart}`;
  }

  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : 0;
}

// Format a price for read-only display in the user's active i18n locale.
// Always shows 2 decimal places. Pass `locale` to override the active one.
//   formatPrice(1234.5)            → "1.234,50" (tr) / "1,234.50" (en)
//   formatPrice("12,50")           → "12,50"   (tr) / "12.50"   (en)
//   formatPrice(null)              → "0,00"    (tr) / "0.00"    (en)
export function formatPrice(amount, locale) {
  const n = typeof amount === "number" ? amount : parsePrice(amount);
  const lang = locale || i18n?.language || "tr";
  const intlLocale =
    lang === "en" ? "en-US" : lang === "tr" ? "tr-TR" : lang;
  return new Intl.NumberFormat(intlLocale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
}

export function spacePhoneNumber(phoneNumber) {
  // console.log(phoneNumber);
  const cleaned = ("" + phoneNumber).replace(/\D/g, "");
  const number = cleaned.replace("9", "");
  // console.log(number);

  const match = number.match(/^(\d{4})(\d{3})(\d{2})(\d{2})$/);
  if (match) {
    return `${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
  }
  return phoneNumber;
}

export function formatEmail(email) {
  const validCharsRegex = /[^\w\d@._-]/g;
  let formattedEmail = email.replace(validCharsRegex, "");
  formattedEmail = formattedEmail.trim().toLowerCase();
  return formattedEmail;
}

export function toNameCase(value) {
  if (!value) return value;
  return value.replace(
    /(^|[\s\-'])(\p{L})/gu,
    (_, sep, ch) => sep + ch.toLocaleUpperCase("tr"),
  );
}

const COMMON_EMAIL_DOMAINS = [
  "gmail.com",
  "googlemail.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "yahoo.com",
  "icloud.com",
  "me.com",
  "yandex.com",
  "yandex.com.tr",
  "mail.com",
  "protonmail.com",
  "proton.me",
  "aol.com",
];

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = new Array(n + 1);
  let curr = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

export function suggestEmailDomain(email) {
  if (!email || typeof email !== "string") return null;
  const at = email.lastIndexOf("@");
  if (at < 1 || at === email.length - 1) return null;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1).toLowerCase();
  if (domain.length < 3 || !domain.includes(".")) return null;
  if (COMMON_EMAIL_DOMAINS.includes(domain)) return null;

  let best = null;
  let bestDist = Infinity;
  for (const d of COMMON_EMAIL_DOMAINS) {
    const dist = levenshtein(domain, d);
    if (dist < bestDist) {
      bestDist = dist;
      best = d;
    }
  }
  // Suggest when 1-2 edits away (typo) but not 0 (already correct, handled above)
  if (best && bestDist >= 1 && bestDist <= 2) {
    return `${local}@${best}`;
  }
  return null;
}

export const formatSelectorData = (
  data,
  withPhoneNumber = false,
  withCity = false,
) => {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }

  let sortedData;

  const dataCopy = [...data];
  let outData;

  if (data[0]?.name) {
    sortedData = dataCopy.sort((a, b) => a.name.localeCompare(b.name, "tr"));
  } else if (data[0]?.fullName) {
    sortedData = dataCopy.sort((a, b) =>
      a.fullName.localeCompare(b.fullName, "tr"),
    );
  }
  outData = sortedData.map((ent) => {
    return {
      value: ent.id,
      label:
        (ent?.name ? ent.name : ent?.fullName) +
        (withPhoneNumber && ent?.phoneNumber ? " " + ent.phoneNumber : "") +
        (withCity && ent?.city ? " " + ent.city : ""),
      id: ent.id,
      userId: ent.userId,
    };
  });
  return outData;
};

// export const formatLisansPackages = (data) => {
//   if (!Array.isArray(data) || data.length === 0) {
//     return [];
//   }

//   function CustomLabel(label, year, description, price) {
//     const bgColors = [
//       "bg-[#4682B4] border-[#4682B4]",
//       "bg-[--link-1] border-[--link-1]",
//       "bg-[--primary-1] border-[--primary-1]",
//       "bg-[--primary-2] border-[--primary-2]",
//     ];

//     const bgColor = bgColors.length > year ? bgColors[year - 1] : bgColors[0];

//     return `
//       <div class="flex justify-between">
//         <p class='w-36'>${label}</p>
//         <p class='w-20 text-[--link-1]' > ${year} Yıllık </p>
//         <p class='text-xs text-[--white-1] border rounded-full px-1.5 mx-0.5 py-1 whitespace-nowrap ${bgColor}' > ${description} </p>
//         <p class='w-12' >${price}</p>
//       </div>`;
//   }

//   const outData = data
//     .filter((ent) => ent.isActive)
//     .map((ent, index) => {
//       return {
//         ...ent,
//         value: licenseTypeIds[ent.licenseTypeId].label,
//         label: CustomLabel(
//           licenseTypeIds[ent.licenseTypeId].label,
//           ent.time,
//           ent.description,
//           ent.price,
//           index
//         ),
//         id: ent.licenseTypeId,
//         time: ent.time,
//         price: ent.price,
//         licensePackageId: ent.id,
//       };
//     });
//   return outData;
// };

export function groupedLicensePackages(data, active = true) {
  const groupedData = data.reduce((result, item) => {
    if (active && !item.isActive) {
      return result;
    }

    if (result[item.licenseTypeId]) {
      result[item.licenseTypeId].push(item);
    } else {
      result[item.licenseTypeId] = [item];
    }

    return result;
  }, {});

  const sortedArray = Object.values(groupedData).map((group) =>
    group.sort((a, b) => a.time - b.time),
  );

  return sortedArray;
}

// export function getPriceWithKDV(price, kdv) {
//   let KDV = 0;
//   if (kdv.useKDV) {
//     KDV = kdv?.kdvPercentage / 100;
//   }
//   const totalPrice = price + price * KDV;
//   return totalPrice.toFixed(2);
// }

let marker = null;
export function googleMap(
  lat,
  lng,
  setLat,
  setLng,
  boundaryCoords,
  zoom = 15,
  checkBoundary = false,
  searchInput = null,
) {
  const position = {
    lat: parseFloat(lat),
    lng: parseFloat(lng),
  };

  // eslint-disable-next-line no-undef
  const map = new google.maps.Map(document.getElementById("map"), {
    zoom,
    center: position,
    mapId: "VITE_LIWAMENU_MAP_ID",
  });

  const canUseBoundary =
    checkBoundary && Array.isArray(boundaryCoords) && boundaryCoords.length > 2;

  // Define and display boundary polygon only when boundary checks are enabled.
  // eslint-disable-next-line no-undef
  const boundaryPolygon = canUseBoundary
    ? new google.maps.Polygon({
        paths: boundaryCoords,
        strokeColor: "#0B8A00",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#E9FFEF",
        fillOpacity: 0.35,
        clickable: false,
      })
    : null;

  if (boundaryPolygon) {
    boundaryPolygon.setMap(map);
  }

  // Helper function to check if a position is within the allowed bounds.
  function isPositionWithinBounds(lat, lng) {
    if (!canUseBoundary) return true;
    // eslint-disable-next-line no-undef
    const point = new google.maps.LatLng(lat, lng);
    // eslint-disable-next-line no-undef
    return google.maps.geometry.poly.containsLocation(point, boundaryPolygon);
  }

  // Create a marker when the map initially loads
  // eslint-disable-next-line no-undef
  marker = new google.maps.marker.AdvancedMarkerElement({
    map,
    position,
    title: "Uluru",
    draggable: true,
  });

  // Update latitude and longitude state on marker drag end
  marker.addListener("dragend", (e) => {
    const newLat = e.latLng.lat();
    const newLng = e.latLng.lng();

    if (isPositionWithinBounds(newLat, newLng)) {
      setLat(newLat.toFixed(6));
      setLng(newLng.toFixed(6));
      map.panTo({ lat: newLat, lng: newLng });
    } else {
      // If the position is outside the bounds, reset the marker to the previous position
      marker.setPosition(position);
      map.panTo({ lat: position.lat, lng: position.lng });
    }
  });

  map.addListener("click", (e) => {
    const latitude = e.latLng.lat();
    const longitude = e.latLng.lng();
    //console.log(latitude, longitude);
    if (isPositionWithinBounds(latitude, longitude)) {
      if (marker) {
        marker.setMap(null);
      }

      // eslint-disable-next-line no-undef
      marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: latitude, lng: longitude },
        title: "Uluru",
        draggable: true,
      });

      // Center the map on the new marker's position
      map.panTo({ lat: latitude, lng: longitude });
      setLat(latitude.toFixed(6));
      setLng(longitude.toFixed(6));
    } else {
      toast.dismiss();
      toast("Belirlenen alan dışında konum seçemesiniz 😏.");
      map.panTo({ lat: parseFloat(lat), lng: parseFloat(lng) });
    }
  });

  // Optional: bind a Places Autocomplete to the supplied input element so the
  // user can search by place name, address, or business and have the marker
  // moved to the chosen result.
  // eslint-disable-next-line no-undef
  if (searchInput && google.maps.places?.Autocomplete) {
    // eslint-disable-next-line no-undef
    const autocomplete = new google.maps.places.Autocomplete(searchInput, {
      fields: ["geometry", "name", "formatted_address"],
    });
    autocomplete.bindTo("bounds", map);
    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place || !place.geometry || !place.geometry.location) return;
      const newLat = place.geometry.location.lat();
      const newLng = place.geometry.location.lng();

      if (!isPositionWithinBounds(newLat, newLng)) {
        toast.dismiss();
        toast("Belirlenen alan dışında konum seçemesiniz 😏.");
        return;
      }

      if (marker) marker.setMap(null);
      // eslint-disable-next-line no-undef
      marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: newLat, lng: newLng },
        draggable: true,
      });

      if (place.geometry.viewport) {
        map.fitBounds(place.geometry.viewport);
      } else {
        map.panTo({ lat: newLat, lng: newLng });
        map.setZoom(15);
      }
      setLat(newLat.toFixed(6));
      setLng(newLng.toFixed(6));
    });
  }
}

export function getDateRange(years) {
  const startDateTime = new Date().toISOString();

  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + years);
  const endDateTime = endDate.toISOString();

  return {
    startDateTime,
    endDateTime,
  };
}

export function sumCartPrices(data) {
  const formattedNumber = new Intl.NumberFormat("tr-TR", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(data.reduce((acc, item) => acc + parseFloat(item.price), 0));
  return formattedNumber;
}

export function groupByRestaurantId(data) {
  const groupedData = data.reduce((result, item) => {
    // If restaurantId doesn't exist in the result, create a new array for it
    if (!result[item.restaurantId]) {
      result[item.restaurantId] = [];
    }

    // Push the current item into the corresponding restaurantId array
    result[item.restaurantId].push(item);

    return result;
  }, {});

  // Convert the grouped data object into an array
  return Object.values(groupedData);
}

export function sortByCreatedDateTime(data, direction = "asc") {
  //desc -> new to old
  if (!Array.isArray(data) || data.length === 0) return [];

  const sorted = [...data].sort((a, b) => {
    const aTime = a?.createdDateTime
      ? new Date(a.createdDateTime).getTime()
      : 0;
    const bTime = b?.createdDateTime
      ? new Date(b.createdDateTime).getTime()
      : 0;

    return direction === "asc" ? aTime - bTime : bTime - aTime;
  });

  return sorted;
}


export function isValidCardNumber(cardNumber) {
  const cleaned = cardNumber.replace(/\D/g, "");
  let sum = 0;
  let shouldDouble = false;
  if (cleaned.length !== 16) {
    return true;
  }

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i]);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

export function getCardProvider(cardNumber, src) {
  const cleaned = cardNumber.replace(/\D/g, ""); // Remove non-numeric characters

  // Get the first 4 or 6 digits to identify the provider
  const firstFourDigits = cleaned.substring(0, 4);
  const firstSixDigits = cleaned.substring(0, 6);

  // Known provider patterns based on IIN range
  if (/^4/.test(firstFourDigits)) {
    return { name: "Visa", ...src[1] }; // Visa starts with 4
  } else if (/^5[1-5]/.test(firstFourDigits)) {
    return { name: "MasterCard", ...src[2] }; // MasterCard starts with 51-55
  } else if (/^3[47]/.test(firstFourDigits)) {
    return { name: "AmericanExpress", ...src[3] }; // AmEx starts with 34 or 37
  } else if (/^6(?:011|5)/.test(firstSixDigits)) {
    return { name: "Discover", ...src[4] }; // Discover starts with 6011 or 65
  } else if (/^3(?:0[0-5]|[68])/.test(firstFourDigits)) {
    return { name: "DinersClub", ...src[5] }; // Diners Club starts with 300-305, 36, or 38
  } else if (/^(2131|1800|35)/.test(firstSixDigits)) {
    return { name: "JCB", ...src[6] }; // JCB starts with 2131, 1800, or 35
  } else if (/^9792/.test(firstFourDigits)) {
    return { name: "Troy", ...src[7] }; // Troy starts with 9792
  }

  return { name: "Default", ...src[0] };
}

// Handle copy to clipboard
export function copyToClipboard({ text, setStatus, msg }) {
  navigator.clipboard.writeText(text).then(() => {
    if (setStatus) {
      setStatus(true);
      setTimeout(() => setStatus(false), 2000);
    } else toast.success(msg || "Bağlantı kopyalandı!", { id: "TEXT_COPIED" });
  });
}
