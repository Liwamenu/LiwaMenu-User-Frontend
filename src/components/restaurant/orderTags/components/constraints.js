export const NewOption = {
  id: "New-" + Date.now().toString(),
  name: "",
  price: 0,
  maxQuantity: 1,
  minQuantity: 0,
  isDefault: false,
  isMandatory: false,
};

export const NewRelation = {
  id: "New-" + Date.now().toString(),
  categoryId: "*",
  productId: "*",
  portionId: "*",
};

export const NewOrderTagGroup = {
  id: "New-" + Date.now().toString(),
  name: "",
  minSelected: 0,
  maxSelected: 1,
  freeTagging: false,
  items: [NewOption],
  relations: [],
  isNew: true,
  isDirty: true,
};
