import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Package, DollarSign, PlusCircle } from "lucide-react";

const ProductsHeader = () => {
  const params = useParams();
  const id = params?.id;
  const fullPath = params["*"]?.split("/");
  const thisPath = params["*"]?.split("/")[0];
  const { t } = useTranslation();

  const pathMatches = (path) => thisPath === path && fullPath.length === 2;

  const headers = [
    { label: t("productsHeader.manage"), path: "products", icon: Package },
    {
      label: t("productsHeader.price_list"),
      path: "price-list",
      icon: DollarSign,
    },
    {
      label: t("productsHeader.add_product"),
      path: "add-product",
      icon: PlusCircle,
    },
  ];

  return (
    <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm overflow-x-auto max-w-full">
      {headers.map(({ label, path, icon: Icon }) => {
        const active = pathMatches(path);
        return (
          <Link
            key={path}
            to={`/restaurant/${path}/${id}`}
            className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition ${
              active
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/25"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
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
