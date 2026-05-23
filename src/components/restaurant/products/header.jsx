import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Package, PlusCircle } from "lucide-react";

const ProductsHeader = () => {
  const params = useParams();
  const id = params?.id;
  const fullPath = params["*"]?.split("/");
  const thisPath = params["*"]?.split("/")[0];
  const { t } = useTranslation();

  const pathMatches = (path) => thisPath === path && fullPath.length === 2;

  // Fiyat Listesi used to live here as a third tab, but it's now a
  // top-level sidebar entry under Ürünler. The remaining two tabs
  // (Ürün Yönetimi + Ürün Ekle) stay so the user can flip between
  // the list view and the add-product form without leaving the
  // Products area.
  const headers = [
    { label: t("productsHeader.manage"), path: "products", icon: Package },
    {
      label: t("productsHeader.add_product"),
      path: "add-product",
      icon: PlusCircle,
    },
  ];

  return (
    <div className="inline-flex items-center rounded-xl border border-[--border-1] bg-[--white-1] p-1 shadow-sm overflow-x-auto max-w-full">
      {headers.map(({ label, path, icon: Icon }) => {
        const active = pathMatches(path);
        return (
          <Link
            key={path}
            to={`/restaurant/${path}/${id}`}
            className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition ${
              active
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/25"
                : "text-[--gr-1] hover:text-[--black-1] hover:bg-[--white-2]"
            }`}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </div>
  );
};

export default ProductsHeader;
