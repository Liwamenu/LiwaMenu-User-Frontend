//MODULES
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

//COMP
import { DeleteI } from "../../../assets/icon";
import CustomInput from "../../common/customInput";
import CustomToggle from "../../common/customToggle";
import CustomSelect from "../../common/customSelector";
import CustomFileInput from "../../common/customFileInput";

//FUNC
import { parsePrice } from "../../../utils/utils";

//DUMMy DATA
import categories from "../../../assets/js/Categories.json";
import subCategories from "../../../assets/js/SubCategories.json";
import orderTags from "../../../assets/js/OrderTags.json";
import orderTagItems from "../../../assets/js/OrderTagItems.json";
import ProductsHeader from "./header";

const AddProducts = ({ data: restaurant }) => {
  const { id } = useParams();
  const [previews, setPreviews] = useState([]);
  const [prodsData, setProdsData] = useState([
    {
      // match Products.json fields for a new product
      id: undefined,
      sortOrder: 0,
      name: "",
      image: null, // File
      url: "", // optional url
      description: "",
      recommendation: false,
      hide: false,
      categoryId: "",
      categoryName: "",
      categoryImage: "",
      categorySortOrder: 0,
      subCategoryId: "",
      subCategoryName: "",
      subCategorySortOrder: 0,
      portions: [
        {
          id: undefined,
          productId: undefined,
          name: "Normal",
          price: 0,
          orderTags: [],
        },
      ],
    },
  ]);

  // prepare select options
  const formattedCatsForSelect = (categories?.categories || []).map((cat) => ({
    value: cat.id,
    label: cat.name,
    ...cat,
  }));

  const formattedOrderTagsForSelect = orderTags.orderTags.map((tag) => ({
    value: tag.id,
    label: tag.name,
    ...tag,
  }));

  const getSubcatOptions = (categoryId) =>
    (subCategories?.subCategories || [])
      .filter((s) => s.categoryId === categoryId)
      .map((sc) => ({ value: sc.id, label: sc.name, ...sc }));

  // ---- PRODUCT LEVEL ----
  const addProduct = () => {
    setProdsData([
      ...prodsData,
      {
        id: undefined,
        sortOrder: 0,
        name: "",
        image: null,
        url: "",
        description: "",
        recommendation: false,
        hide: false,
        categoryId: "",
        categoryName: "",
        categoryImage: "",
        categorySortOrder: 0,
        subCategoryId: "",
        subCategoryName: "",
        subCategorySortOrder: 0,
        portions: [
          {
            id: undefined,
            productId: undefined,
            name: "Normal",
            price: 0,
            orderTags: [],
          },
        ],
      },
    ]);
  };

  const deleteProduct = (index) => {
    const updated = [...prodsData];
    updated.splice(index, 1);
    setProdsData(updated);
  };

  // ---- PORTIONS ----
  const addPortion = (pIndex) => {
    const updated = [...prodsData];
    updated[pIndex].portions.push({
      id: undefined,
      productId: undefined,
      name: "",
      price: 0,
      orderTags: [],
    });
    setProdsData(updated);
  };

  const deletePortion = (pIndex, portionIndex) => {
    const updated = [...prodsData];
    updated[pIndex].portions.splice(portionIndex, 1);
    setProdsData(updated);
  };

  // ---- ORDER TAGS ----
  const addOrderTag = (pIndex, portionIndex) => {
    const updated = [...prodsData];
    updated[pIndex].portions[portionIndex].orderTags.push({
      id: undefined,
      name: "",
      minSelected: 0,
      maxSelected: 0,
      orderTagItems: [],
    });
    setProdsData(updated);
  };

  const deleteOrderTag = (pIndex, portionIndex, tagIndex) => {
    const updated = [...prodsData];
    updated[pIndex].portions[portionIndex].orderTags.splice(tagIndex, 1);
    setProdsData(updated);
  };

  // ---- ORDER TAG ITEMS ----
  const addOrderTagItem = (pIndex, portionIndex, tagIndex) => {
    const updated = [...prodsData];
    updated[pIndex].portions[portionIndex].orderTags[
      tagIndex
    ].orderTagItems.push({
      id: undefined,
      name: "",
      price: "",
      maxQuantity: "",
    });
    setProdsData(updated);
  };

  const deleteOrderTagItem = (pIndex, portionIndex, tagIndex, itemIndex) => {
    const updated = [...prodsData];
    updated[pIndex].portions[portionIndex].orderTags[
      tagIndex
    ].orderTagItems.splice(itemIndex, 1);
    setProdsData(updated);
  };

  // -- Handle Submit ---
  const handleProductsSubmit = (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      // Convert products array to JSON string and append it
      // Map internal product shape to Products.json-like payload (exclude File in image)
      const productsData = prodsData.map((product) => {
        const {
          image, // File
          url,
          ...rest
        } = product;

        // ensure portions have numeric price
        const portions = (rest.portions || []).map((pt) => ({
          id: pt.id,
          productId: pt.productId,
          name: pt.name,
          price: parsePrice(pt.price),
          orderTags: pt.orderTags || [],
        }));

        return {
          ...rest,
          image: url || null, // if you want to upload file, api should accept file separately
          portions,
        };
      });

      formData.append("productsData", JSON.stringify(productsData));

      // Append each image file separately with index
      prodsData.forEach((product, index) => {
        if (product.image) {
          formData.append(`image_${index}`, product.image);
        }
      });

      // debug: show payload
      console.log(productsData);
    } catch (error) {
      console.error("Error preparing form data:", error);
    }
  };

  //PREVIEW
  useEffect(() => {
    const addProdsPeviews = prodsData.map((p) =>
      p.image ? URL.createObjectURL(p.image) : p.url || null
    );

    setPreviews(addProdsPeviews);
    return () =>
      addProdsPeviews.forEach((url) => url && URL.revokeObjectURL(url));
  }, [prodsData]);

  return (
    <section className="w-full pb-5 mt-1 bg-[--white-1] rounded-lg text-[--black-2]">
      <div className="px-4 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold bg-indigo-800 text-white py-4 -mx-4 px-4 sm:px-14 rounded-t-lg">
          Ürünler {restaurant?.name} Restoranı
        </h1>

        <ProductsHeader />

        <form onSubmit={handleProductsSubmit}>
          {prodsData.map((product, index) => (
            <main
              key={index}
              className="border border-[--primary-1] rounded p-4 mb-2"
            >
              {/* Delete product */}
              {prodsData.length > 1 && (
                <div
                  className="flex justify-end text-[--red-1] text-sm cursor-pointer mb-2"
                  onClick={() => deleteProduct(index)}
                >
                  <DeleteI className="size-[1rem]" /> Ürünü Sil
                </div>
              )}

              {/* Product Info */}
              <div className="flex gap-3 justify-between w-full text-[--gr-1]">
                <div className="mt-4 items-center w-full">
                  {previews[index] && (
                    <div className="w-full max-w-80">
                      <img src={previews[index]} alt="preview_liwamenu" />
                    </div>
                  )}
                  <CustomFileInput
                    required
                    className="h-[8rem] p-4"
                    value={product.image}
                    onChange={(file) => {
                      const updated = [...prodsData];
                      updated[index].image = file;
                      // clear url when user uploads file
                      updated[index].url = "";
                      setProdsData(updated);
                    }}
                    accept={"image/png, image/jpeg"}
                  />
                </div>

                <div className="flex flex-col w-full max-w-80">
                  <CustomSelect
                    required
                    label="Kategori"
                    placeholder="Kategori"
                    style={{ padding: "1px 0px" }}
                    className2="py-[.45rem] text-sm mt-[0] sm:mt-[0]"
                    value={
                      product.categoryId
                        ? {
                            value: product.categoryId,
                            label: product.categoryName,
                          }
                        : { value: "", label: "Kategori Seç" }
                    }
                    options={formattedCatsForSelect}
                    onChange={(e) => {
                      const updated = [...prodsData];
                      updated[index].categoryId = e.value;
                      updated[index].categoryName = e.label;
                      // reset subcategory
                      updated[index].subCategoryId = "";
                      updated[index].subCategoryName = "";
                      setProdsData(updated);
                    }}
                  />

                  <CustomSelect
                    label="Alt Kategori"
                    placeholder="Alt Kategori"
                    style={{ padding: "1px 0px" }}
                    className2="py-[.45rem] text-sm mt-[0] sm:mt-[0]"
                    value={
                      product.subCategoryId
                        ? {
                            value: product.subCategoryId,
                            label: product.subCategoryName,
                          }
                        : { value: "", label: "Alt Kategori Seç" }
                    }
                    options={getSubcatOptions(product.categoryId)}
                    onChange={(e) => {
                      const updated = [...prodsData];
                      updated[index].subCategoryId = e.value;
                      updated[index].subCategoryName = e.label;
                      setProdsData(updated);
                    }}
                  />

                  <CustomInput
                    required
                    label="Ürün Adı"
                    placeholder="Ürün Adı"
                    className="py-[.45rem] text-sm "
                    className2="py-[.45rem] text-sm mt-[0] sm:mt-[0]"
                    value={product.name}
                    onChange={(e) => {
                      const updated = [...prodsData];
                      updated[index].name = e;
                      setProdsData(updated);
                    }}
                  />

                  <CustomInput
                    required
                    label="Açıklama"
                    placeholder="Açıklama"
                    className="py-[.45rem] text-sm"
                    className2="py-[.45rem] text-sm mt-[0] sm:mt-[0]"
                    value={product.description}
                    onChange={(e) => {
                      const updated = [...prodsData];
                      updated[index].description = e;
                      setProdsData(updated);
                    }}
                  />
                  <div className="flex flex-col gap-2 mt-2">
                    <div className="flex justify-between items-center max-w-md">
                      <label className="font-medium">Şef tavsiyesi</label>
                      <CustomToggle
                        checked={product.recommendation}
                        className="scale-[0.8]"
                        onChange={() => {
                          const updated = [...prodsData];
                          updated[index].recommendation =
                            !updated[index].recommendation;
                          setProdsData(updated);
                        }}
                      />
                    </div>

                    <div className="flex justify-between items-center max-w-md">
                      <label className="font-medium">Gizle</label>
                      <CustomToggle
                        checked={product.hide}
                        className="scale-[0.8]"
                        onChange={() => {
                          const updated = [...prodsData];
                          updated[index].hide = !updated[index].hide;
                          setProdsData(updated);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Portions */}
              <div>
                <h3 className="font-semibold mt-4 mb-2">Porsiyonlar</h3>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => addPortion(index)}
                    className="text-sm mb-2 text-blue-600"
                  >
                    + Porsiyon Ekle
                  </button>
                </div>

                {product.portions.map((portion, pIndex) => (
                  <div key={pIndex} className="border p-3 rounded mb-2">
                    <div className="flex gap-4">
                      <CustomInput
                        required
                        label="Porsiyon Adı"
                        placeholder="Porsiyon Adı"
                        className="py-[.45rem] text-sm "
                        className2="py-[.45rem] text-sm mt-[0] sm:mt-[0]"
                        value={portion.name}
                        onChange={(e) => {
                          const updated = [...prodsData];
                          updated[index].portions[pIndex].name = e;
                          setProdsData(updated);
                        }}
                      />

                      <CustomInput
                        required
                        type="text"
                        inputMode="decimal"
                        name="price"
                        label="Porsiyon Fiyatı"
                        placeholder="Porsiyon Fiyatı"
                        className="py-[.45rem] text-sm "
                        className2="py-[.45rem] text-sm mt-[0] sm:mt-[0]"
                        value={portion.price ?? ""}
                        onChange={(e) => {
                          const updated = [...prodsData];
                          updated[index].portions[pIndex].price = e;
                          setProdsData(updated);
                        }}
                      />

                      <div
                        className="text-sm text-[--red-1] flex items-center text-nowrap cursor-pointer pt-6"
                        onClick={() => deletePortion(index, pIndex)}
                      >
                        {pIndex != 0 && (
                          <div className="flex items-center gap-1">
                            <p>Porsiyonu Sil</p>
                            <DeleteI className=" size-[1rem]" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => addOrderTag(index, pIndex)}
                        className="text-sm text-blue-600"
                      >
                        + Etiket Ekle
                      </button>

                      {portion.orderTags.map((tag, tIndex) => (
                        <div
                          key={tIndex}
                          className="border mt-2 ml-4 px-2 rounded"
                        >
                          <div className="flex w-full justify-between">
                            <CustomSelect
                              required
                              label="Etiket Adı (ör: Baharat Seçimi)"
                              placeholder="Etiket Adı (ör: Baharat Seçimi)"
                              style={{ padding: "1px 0px" }}
                              className2="py-[.45rem] text-sm mt-[0] sm:mt-[0]  max-w-64"
                              value={{
                                value: tag.id || null,
                                label: tag.name || "Etiket Seç",
                              }}
                              options={formattedOrderTagsForSelect}
                              onChange={(e) => {
                                const updated = [...prodsData];
                                // set minimal tag structure
                                updated[index].portions[pIndex].orderTags[
                                  tIndex
                                ] = {
                                  id: e.value,
                                  name: e.label,
                                  minSelected: e.minSelected || 0,
                                  maxSelected: e.maxSelected || 0,
                                  orderTagItems: [],
                                };
                                setProdsData(updated);
                              }}
                            />

                            <div>
                              <CustomInput
                                readOnly
                                label="Min Seçim"
                                placeholder="Min Seçim"
                                className="mt-[0.3rem] sm:mt-[0.3rem] py-[.5rem] border-none cursor-not-allowed"
                                className2="text-sm mt-[0] sm:mt-[0]"
                                value={tag.minSelected}
                              />
                            </div>
                            <div>
                              <CustomInput
                                readOnly
                                label="Max Seçim"
                                placeholder="Max Seçim"
                                className="mt-[0.3rem] sm:mt-[0.3rem] py-[.5rem] border-none cursor-not-allowed"
                                className2="text-sm mt-[0] sm:mt-[0]"
                                value={tag.maxSelected}
                              />
                            </div>

                            <div
                              className="text-sm text-[--red-1] flex items-center text-nowrap cursor-pointer"
                              onClick={() =>
                                deleteOrderTag(index, pIndex, tIndex)
                              }
                            >
                              <div className="flex items-center gap-1">
                                <p>Etiketi Sil</p>
                                <DeleteI className=" size-[1rem]" />
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              addOrderTagItem(index, pIndex, tIndex)
                            }
                            className="text-sm text-green-600"
                          >
                            + Seçenek Ekle
                          </button>

                          <div
                            className={`flex flex-col ${
                              tag?.orderTagItems?.length &&
                              "border border-[--border-1]"
                            } px-1 mb-1 rounded ml-4`}
                          >
                            {tag.orderTagItems.map((item, iIndex) => (
                              <div key={iIndex} className="flex gap-2 my-1">
                                <CustomSelect
                                  required
                                  placeholder="Seçenek Adı"
                                  style={{ padding: "1px 0px" }}
                                  className="text-sm mt-[0] sm:mt-[0]"
                                  className2="py-[0] text-sm mt-[0] sm:mt-[0]"
                                  value={{
                                    value: item.id || null,
                                    label: item.name || "Seçenek Seç",
                                  }}
                                  options={orderTagItems.orderTagItems
                                    .filter(
                                      (otItem) => otItem.orderTagId === tag.id
                                    )
                                    .map((otItem) => ({
                                      value: otItem.id,
                                      label: otItem.name,
                                      ...otItem,
                                    }))}
                                  onChange={(e) => {
                                    const updated = [...prodsData];
                                    updated[index].portions[pIndex].orderTags[
                                      tIndex
                                    ].orderTagItems[iIndex] = {
                                      id: e.value,
                                      name: e.label,
                                      price: e.price,
                                      maxQuantity: e.maxQuantity,
                                    };
                                    setProdsData(updated);
                                  }}
                                />

                                <div className="w-full flex gap-2 max-sm:flex-col">
                                  <CustomInput
                                    readOnly
                                    type="text"
                                    inputMode="decimal"
                                    name="price"
                                    label={iIndex === 0 ? "Fiyat" : ""}
                                    placeholder="Fiyat"
                                    className="py-[.45rem] text-sm mt-[0] sm:mt-[0] border-none cursor-not-allowed"
                                    className2="py-[0] text-sm mt-[0] sm:mt-[0]"
                                    value={item.price ?? ""}
                                    onChange={(e) => {
                                      const updated = [...prodsData];
                                      updated[index].portions[pIndex].orderTags[
                                        tIndex
                                      ].orderTagItems[iIndex].price = e;
                                      setProdsData(updated);
                                    }}
                                  />
                                  <CustomInput
                                    readOnly
                                    type="number"
                                    label={iIndex === 0 ? "Maks Seçimi" : ""}
                                    placeholder="Maksimum Seçimi"
                                    className="py-[.45rem] text-sm mt-[0] sm:mt-[0] border-none cursor-not-allowed"
                                    className2="py-[0] text-sm mt-[0] sm:mt-[0]"
                                    value={item.maxQuantity}
                                    onChange={(e) => {
                                      const updated = [...prodsData];
                                      updated[index].portions[pIndex].orderTags[
                                        tIndex
                                      ].orderTagItems[iIndex].maxQuantity = e;
                                      setProdsData(updated);
                                    }}
                                  />
                                </div>

                                <div
                                  className="text-sm text-[--red-1] flex items-center text-nowrap cursor-pointer"
                                  onClick={() =>
                                    deleteOrderTagItem(
                                      index,
                                      pIndex,
                                      tIndex,
                                      iIndex
                                    )
                                  }
                                >
                                  <div className="flex items-center gap-1">
                                    <p>Sil</p>
                                    <DeleteI className=" size-[1rem]" />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </main>
          ))}

          <div className={`flex w-full justify-between`}>
            <button
              type="button"
              onClick={addProduct}
              className="mt-4 text-[--primary-1] text-sm border border-[--primary-1] px-3 py-1 rounded"
            >
              + Yeni Ürün Ekle
            </button>

            {prodsData?.length && (
              <button
                type="submit"
                className="mt-4 text-[--white-1] bg-[--primary-1] text-sm border border-[--primary-1] px-3 py-1 rounded"
              >
                Kaydet
              </button>
            )}
          </div>
        </form>
      </div>
    </section>
  );
};

export default AddProducts;
