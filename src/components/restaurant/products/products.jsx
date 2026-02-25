//MODULES
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

//COMP
import ProductsHeader from "./header";
import ProductCard from "./productCard";
import SearchI from "../../../assets/icon/search";
import CustomInput from "../../common/customInput";
import CustomSelect from "../../common/customSelector";
import CustomPagination from "../../common/pagination";

//DEMO
import DUMMY_DATA from "../../../assets/js/Products.json";
import categoriesJSON from "../../../assets/js/Categories.json";

//REDUX
import { getProducts } from "../../../redux/products/getProductsSlice";

const Products = ({ data: restaurant }) => {
  const params = useParams();
  const restaurantId = params.id;
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const { products, error } = useSelector((s) => s.products.get);

  const categoryOptions = [
    { label: t("productsList.all_categories"), value: "" },
    ...categoriesJSON.categories.map((c) => ({
      label: c.name,
      value: c.name,
      id: c.id,
    })),
  ];

  const statusOptions = [
    { label: t("productsList.all_statuses"), value: null },
    { label: t("editCategories.status_open"), value: true },
    { label: t("editCategories.status_closed"), value: false },
  ];

  const [productsData, setProductsData] = useState(null);

  const [searchVal, setSearchVal] = useState("");
  const [statusFilter, setStatusFilter] = useState(statusOptions[0]);
  const [categoryFilter, setCategoryFilter] = useState(categoryOptions[0]);

  const [pageNumber, setPageNumber] = useState(1);
  const itemsPerPage = import.meta.env.VITE_ROWS_PER_PAGE;
  const [totalItems, setTotalItems] = useState(null);

  function handleFilter(opt, type) {
    type === "status"
      ? setStatusFilter(opt)
      : type === "category"
        ? setCategoryFilter(opt)
        : type === "search" && setSearchVal(opt);

    dispatch(
      getProducts({
        restaurantId,
        pageNumber: 1,
        pageSize: itemsPerPage,
        searchKey: type === "search" ? opt : searchVal,
        hide: type === "status" ? !opt.value : statusFilter.value,
        categoryId: type === "category" ? opt.id : categoryFilter.id || null,
      }),
    );
    setPageNumber(1);
  }

  function handlePageChange(number) {
    if (number === pageNumber) return;

    dispatch(
      getProducts({
        restaurantId,
        pageNumber: number,
        pageSize: itemsPerPage,
        searchKey: searchVal,
        hide: statusFilter.value,
        categoryId: categoryFilter.id || null,
      }),
    );
  }

  useEffect(() => {
    if (!productsData) {
      dispatch(
        getProducts({ restaurantId, pageNumber: 1, pageSize: itemsPerPage }),
      );
    }
  }, [productsData]);

  useEffect(() => {
    if (products) {
      setTotalItems(products.totalCount || 3);
      setProductsData(products);
      console.log(products);
    }
    if (error) {
      setProductsData(DUMMY_DATA.Products);
    }
  }, [products, error]);

  return (
    <main className="w-full pb-5 mt-1 bg-[--white-1] rounded-lg text-[--black-2]">
      <div className="px-4 max-w-6xl mx-auto">
        {/* <h1 className="text-2xl font-bold bg-indigo-800 text-white py-4 -mx-4 px-4 sm:px-14 rounded-t-lg">
          Ürünler {restaurant?.name} Restoranı
        </h1> */}
        <div className="flex flex-wrap gap-2 my-3 text-sm">
          <ProductsHeader />
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Header Bar */}
          <div className="bg-[--white-1] p-4 rounded-xl shadow-sm border border-[--gr-4] flex flex-col md:flex-row items-center gap-4 mb-8">
            {/* Search Input */}

            <form
              className="relative flex-1 w-full md:w-auto"
              onSubmit={(e) => {
                e.preventDefault();
                handleFilter(searchVal, "search");
              }}
            >
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[--gr-1] z-50">
                <SearchI />
              </div>
              <CustomInput
                type="text"
                placeholder={t("productsList.search_placeholder")}
                value={searchVal}
                className="block w-full pl-10 pr-3 py-2.5 border border-[--border-1] rounded-lg leading-5 placeholder-[--gr-2] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-[--gr-1] bg-[--white-1] transition duration-150 ease-in-out"
                onChange={(e) => {
                  !e ? handleFilter(null, "search") : setSearchVal(e);
                }}
              />
            </form>

            {/* Filters */}
            <div className="relative w-full md:w-48">
              <CustomSelect
                label=""
                value={categoryFilter}
                options={categoryOptions}
                onChange={(opt) => handleFilter(opt, "category")}
                isSearchable={false}
                className="text-sm font-medium"
                className2="relative w-full"
                menuPlacement="auto"
              />
            </div>

            <div className="relative w-full md:w-48">
              <CustomSelect
                label=""
                value={statusFilter}
                options={statusOptions}
                onChange={(opt) => handleFilter(opt, "status")}
                isSearchable={false}
                className="text-sm font-medium"
                className2="relative w-full"
                menuPlacement="auto"
              />
            </div>
          </div>

          {/* Product List */}
          <div className="space-y-4">
            {productsData &&
              productsData.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}

            {!productsData?.length && (
              <div className="text-center py-12 text-[--gr-1]">
                {t("productsList.no_products")}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PAGINATION */}
      {productsData && typeof totalItems === "number" && (
        <div className="w-full self-end flex justify-center pt-2 text-[--black-2]">
          <CustomPagination
            pageNumber={pageNumber}
            setPageNumber={setPageNumber}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
            handlePageChange={handlePageChange}
          />
        </div>
      )}
    </main>
  );
};

export default Products;
