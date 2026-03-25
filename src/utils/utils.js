import toast from "react-hot-toast";
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

  // Enforce max length
  if (maxAllowed && maxAllowed !== -1 && useVal?.length > maxAllowed) {
    // Handle different input types
    if (type === "number" || name === "digit") {
      useVal = value.replace(/[^\d]/g, ""); // Only allow digits
    }
    // Handle the "price" input type
    if (name === "price") {
      useVal = formatToPrice(value);
    }

    return useVal.slice(0, maxAllowed);
  }

  return useVal;
};

export function formatToPrice(value) {
  if (!value) return;

  // Convert value to a string to ensure replace method works
  let useVal = String(value).replace(/[^0-9,]/g, ""); // Allow only digits and a comma

  // Ensure there's only one comma
  const commaIndex = useVal.indexOf(",");
  if (commaIndex !== -1) {
    // If there is a comma, ensure all other commas are removed
    useVal =
      useVal.slice(0, commaIndex + 1) +
      useVal.slice(commaIndex + 1).replace(/,/g, "");
  }

  // Split the value into integer and decimal parts
  const parts = useVal.split(",");

  // Format the integer part
  let formattedValue = new Intl.NumberFormat("tr-TR").format(parts[0]);

  // Add the decimal part back, if it exists
  if (parts[1] !== undefined) {
    formattedValue += "," + parts[1].slice(0, 2); // Keep only two decimal places
  }

  // console.log(formattedValue);
  return formattedValue;
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
export function googleMap(lat, lng, setLat, setLng, boundaryCoords, zoom = 15) {
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

  // Define the boundary polygon
  // eslint-disable-next-line no-undef
  const boundaryPolygon = new google.maps.Polygon({
    paths: boundaryCoords,
    strokeColor: "#0B8A00",
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: "#E9FFEF",
    fillOpacity: 0.35,
    clickable: false,
  });

  boundaryPolygon.setMap(map);

  // Helper function to check if a position is within the allowed bounds
  // function isPositionWithinBounds(lat, lng) {
  //   // eslint-disable-next-line no-undef
  //   const point = new google.maps.LatLng(lat, lng);
  //   // eslint-disable-next-line no-undef
  //   return google.maps.geometry.poly.containsLocation(point, boundaryPolygon);
  // }

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

    // if (isPositionWithinBounds(newLat, newLng)) {
    if (true) {
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
    // if (isPositionWithinBounds(latitude, longitude)) {
    if (true) {
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

export function validPrice(price) {
  return parseFloat(price.replace(/\./g, "").replace(",", "."));
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
