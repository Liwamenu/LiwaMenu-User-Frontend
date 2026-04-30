// Deep object-key normalizer — converts the first character of every key
// to lowercase, recursively. Lets the frontend read camelCase fields
// regardless of whether the backend serializes responses in PascalCase
// (.NET default in some pipelines) or camelCase (the modern convention).
//
// Originally extracted from `context/ordersContext.jsx` where it was
// inlined; lifted here so OrderTags / Products / any other slice that
// hits an endpoint with mixed-case responses can normalize defensively
// at the slice boundary instead of repeating the helper.

const toCamelFirst = (key) =>
  typeof key === "string" && key.length > 0
    ? key.charAt(0).toLowerCase() + key.slice(1)
    : key;

export const normalizeKeysDeep = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeKeysDeep(item));
  }

  if (value && typeof value === "object" && !(value instanceof Date)) {
    return Object.entries(value).reduce((acc, [key, val]) => {
      acc[toCamelFirst(key)] = normalizeKeysDeep(val);
      return acc;
    }, {});
  }

  return value;
};

export default normalizeKeysDeep;
