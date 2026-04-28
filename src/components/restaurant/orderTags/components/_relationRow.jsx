import { useMemo } from "react";
import CustomSelect from "../../../common/customSelector";
import { DeleteI } from "../../../../assets/icon";

const RelationRow = ({
  products,
  categories,
  onUpdate,
  onDelete,
  relation,
}) => {
  const filteredProducts = useMemo(() => {
    if (relation.categoryId === "*") return products;
    return products.filter((p) => p.categoryId === relation.categoryId);
  }, [relation.categoryId, products]);

  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === relation.productId);
  }, [relation.productId, products]);

  const categoryOptions = useMemo(
    () => [
      { value: "*", label: "* Tüm Kategoriler" },
      ...categories.map((c) => ({ value: c.id, label: c.name })),
    ],
    [categories],
  );

  const productOptions = useMemo(
    () => [
      { value: "*", label: "* Tüm Ürünler" },
      ...filteredProducts.map((p) => ({ value: p.id, label: p.name })),
    ],
    [filteredProducts],
  );

  const portionOptions = useMemo(() => {
    if (!selectedProduct) return [{ value: "*", label: "* Tüm Porsiyonlar" }];
    return [
      { value: "*", label: "* Tüm Porsiyonlar" },
      ...selectedProduct.portions.map((port) => ({
        value: port.id,
        label: port.name,
      })),
    ];
  }, [selectedProduct]);

  const selectedCategory =
    categoryOptions.find((opt) => opt.value === relation.categoryId) ||
    categoryOptions[0];

  const selectedProductOption =
    productOptions.find((opt) => opt.value == relation.productId) ||
    productOptions[0];

  const selectedPortion =
    portionOptions.find((opt) => opt.value == relation.portionId) ||
    portionOptions[0];

  return (
    <div className="grid grid-cols-12 gap-3 items-center p-3 rounded-lg transition-all animate-fade-in bg-[--white-1] border-[--border-1] hover:bg-[--white-2]">
      <div className="col-span-1 flex justify-center text-[--black-2]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="size-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
          />
        </svg>
      </div>

      <div className="col-span-3">
        <CustomSelect
          required
          value={selectedCategory}
          options={categoryOptions}
          onChange={(selected) =>
            onUpdate({
              categoryId: selected.value,
              productId: "*",
              portionId: "*",
            })
          }
          // Search enabled — the category list can run long and scrolling
          // through hundreds of items was the original pain point.
          isSearchable
          menuPlacement="bottom"
          // Portal to body so the menu doesn't get clipped by the parent
          // tag-group card's `overflow-hidden`.
          menuPortalTarget={document.body}
          optionStyle={{ fontSize: "0.875rem" }}
        />
      </div>

      <div className="col-span-4">
        <CustomSelect
          required
          value={selectedProductOption}
          options={productOptions}
          onChange={(selected) =>
            onUpdate({
              productId: selected.value === "*" ? "*" : selected.value,
              portionId: "*",
            })
          }
          isSearchable
          menuPlacement="bottom"
          menuPortalTarget={document.body}
          optionStyle={{ fontSize: "0.875rem" }}
        />
      </div>

      <div className="col-span-3">
        <CustomSelect
          required
          value={selectedPortion}
          options={portionOptions}
          onChange={(selected) =>
            onUpdate({
              portionId: selected.value === "*" ? "*" : selected.value,
            })
          }
          isSearchable
          menuPlacement="bottom"
          menuPortalTarget={document.body}
          disabled={relation.productId === "*"}
        />
      </div>

      <div className="col-span-1 flex justify-end">
        <button
          type="button"
          onClick={onDelete}
          className="p-2 text-[--gr-3] hover:text-[--red-1] transition-colors"
        >
          <DeleteI className="size-[1.2rem]" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
};

export default RelationRow;
