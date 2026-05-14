// Stable random ID factory for client-only rows. The "New-" prefix
// is the contract that `_orderTagGroupCard.jsx#isClientId` checks
// before sending to the backend (temp ids are stripped — only real
// UUIDs round-trip). Was a single timestamp computed at module
// import, which gave every "Add Option" / "Add Relation" click the
// same id — React's key collision warned in the console and
// `updateRelation(id, …)` updated multiple rows at once because the
// id-match predicate hit them all.
const newId = () =>
  `New-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

// Each call returns a fresh object — never share references between
// rows, otherwise editing one row mutates them all (React was
// re-rendering with stale references to the same in-memory object).
export const NewOption = () => ({
  id: newId(),
  name: "",
  price: 0,
  maxQuantity: 1,
  minQuantity: 0,
  isDefault: false,
  isMandatory: false,
});

export const NewRelation = () => ({
  id: newId(),
  categoryId: "*",
  productId: "*",
  portionId: "*",
});

export const NewOrderTagGroup = () => ({
  id: newId(),
  name: "",
  minSelected: 0,
  maxSelected: 1,
  freeTagging: false,
  items: [NewOption()],
  relations: [],
  isNew: true,
  isDirty: true,
});
