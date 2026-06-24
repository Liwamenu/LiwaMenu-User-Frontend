//MODULES
import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Route, Routes, useLocation, useParams } from "react-router-dom";

//COMP
import Sidebar from "../components/subSidebar/subSidebar";
import { DirtyNavProvider } from "../context/DirtyNavContext";

//REDUX
import { getRestaurants } from "../redux/restaurants/getRestaurantsSlice";
import useSmartRevalidate from "../hooks/useSmartRevalidate";

//PAGES
import NotFound from "./404";
import EditRestaurant from "../components/restaurant/editRestaurant";
import WorkingHours from "../components/restaurant/workingHours";
import SocialMedias from "../components/restaurant/socialMedias";
import PaymentMethods from "../components/restaurant/paymentMethods";
import ReservationSett from "../components/restaurant/reservationSettings";
import RestaurantSettings from "../components/restaurant/restaurantSettings";
import AnnouncementSett from "../components/restaurant/announcementSettings";
import ExternalPage from "../components/restaurant/externalPage";

//PRODUCTS
import Products from "../components/restaurant/products/products";
import PriceList from "../components/restaurant/products/priceList";
import AddProduct from "../components/restaurant/products/addProduct";
import ImportExternal from "../components/restaurant/products/importExternal";
import EditProduct from "../components/restaurant/products/editProduct";

//CATEGORIES
import MenuList from "../components/restaurant/menus/menuList";
import Categories from "../components/restaurant/category/categories";
import AddCategory from "../components/restaurant/category/addCategory";
import AddCategories from "../components/restaurant/categories/addCategories";

//SUB CATEGORIES
import SubCategories from "../components/restaurant/subCategory/subCategories";
import AddSubCategories from "../components/restaurant/subCategories/addSubCategories";

//ORDER TAG ITEMS
import OrderTags from "../components/restaurant/orderTags/orderTags";

//QR
import QRPage from "../components/restaurant/qr/qrPage";

//SURVEY
import SurveySettings from "../components/restaurant/survey/surveySettings";

//THEME
import ThemeSelector from "../components/restaurant/themes/qrMenuSelector";
import TvMenuSelector from "../components/restaurant/themes/tvMenuSelector";
import KioskSelector from "../components/restaurant/themes/kioskSelector";

//ANALYTICS
import GoogleAnalytics from "../components/restaurant/googleAnalytics";

//PAYMENT GATEWAYS
import PaymentGatewaySettings from "../components/restaurant/paymentGatewaySettings";

const RestaurantHome = ({ showS1, setShowS1, openSidebar, setOpenSidebar }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const id = useParams()["*"].split("/")[1];

  const { restaurants } = useSelector(
    (state) => state.restaurants.getRestaurants,
  );
  const { restaurant: stateRest } = useSelector(
    (state) => state.restaurants.getRestaurant,
  );
  const { restaurant } = location?.state || {};

  // Derive `data` reactively so settings saves that patch the cached
  // restaurant entity (see redux/restaurants/restaurantEntityPatchers.js)
  // immediately propagate to children — no local snapshot to go stale on
  // tab switch + return. We deliberately do NOT re-fetch GetRestaurantById
  // after a save (it's ~2.7s and would freeze the global spinner); the
  // cross-slice patch matchers keep state.restaurants.data in sync.
  const myRestaurant = useMemo(
    () => restaurants?.data?.find((r) => r.id === id),
    [restaurants, id],
  );
  const data = restaurant || myRestaurant || stateRest;

  // Fetch the restaurant only if we don't already have it (deep-link /
  // hard-refresh case). Fetch the LIST, not the single GetRestaurantById:
  //   1. `data` resolves from `myRestaurant`, read from the getRestaurants
  //      LIST slice — the list is what actually populates `data`. The
  //      single slice only feeds the `stateRest` fallback, which
  //      `myRestaurant` shadows the moment the list lands.
  //   2. GetRestaurantById currently HANGS on the backend (~30s → abort).
  //      Worse, it was dispatched without __silent, so loadingMiddleware
  //      held the full-screen loader for the whole 30s before failing with
  //      "istek sunucuya ulaşamadı". The list endpoint returns the same
  //      entity reliably and is silent, so the page paints as soon as it
  //      lands and nothing freezes. (Owners with >50 restaurants are an
  //      existing limitation shared by the sidebar + useSmartRevalidate,
  //      which already page the list at 50.)
  useEffect(() => {
    if (!data) {
      dispatch(
        getRestaurants({ pageNumber: 1, pageSize: 50, __silent: true }),
      );
    }
  }, [data, dispatch]);

  // Cross-device / returning-to-tab freshness for the restaurant
  // entity that feeds Genel Ayarlar + every per-restaurant settings
  // tab via the `data` prop.
  //
  // IMPORTANT — refetch the LIST, not the single:
  // `data = restaurant || myRestaurant || stateRest` resolves to
  // `myRestaurant`, which is read from the getRestaurants LIST slice
  // (see getRestaurantsSlice header: "the source the per-restaurant
  // pages read from via myRestaurant"). A change made on another
  // device lands in the backend; only refetching the list slice that
  // `data` actually resolves from will surface it here. Refetching the
  // single GetRestaurantById only updates `stateRest` — the third
  // (fallback) priority — so the fresh value would be ignored while
  // myRestaurant stays stale. The list endpoint carries the same
  // entity fields (moneySign, decimalPoint, …) the settings pages
  // read. Silent so it never flashes the global loader; the list
  // slice is stale-while-revalidate so nothing blanks. Throttled by
  // the hook so quick tab-bounces don't spam it.
  useSmartRevalidate(
    id ? `restaurant:${id}` : null,
    // Same params the sidebar uses to populate the list slice
    // ({ pageNumber: 1, pageSize: 50 }) — calling with different paging
    // would replace the cached list with a different page and could
    // drop the target restaurant out of `myRestaurant`'s find().
    () =>
      dispatch(getRestaurants({ pageNumber: 1, pageSize: 50, __silent: true })),
  );

  useEffect(() => {
    setShowS1(false);
    return () => {
      setShowS1(true);
    };
  }, []);

  const P = {
    // paths
    R: {
      // restaurant
      edit: "/edit/:id",
      hours: "/hours/:id",
      social: "/social/:id",
      payments: "/payments/:id",
      sett: "/settings/:id",
      order: "/orderSettings/:id",
      rsrv: "reservationSettings/:id",
      ann: "announcementSettings/:id",
      surv: "surveySettings/:id",
      ext: "externalPage/:id",
    },
    cat: {
      add: "/categories/:id/add",
      addMany: "/categories/:id/addMany",
      list: "/categories/:id/list",
    },
    subCat: {
      list: "/sub_categories/:id/list",
      add: "/sub_categories/:id/add",
    },
    menus: {
      list: "/menus/:id/list",
    },
    orderTags: {
      list: "/tags/:id",
    },
    prods: {
      list: "/products/:id",
      add: "/add-product/:id",
      edit: "/products/:id/edit/:prodId",
      priceList: "/price-list/:id",
      import: "/import-external/:id",
    },
  };

  return (
    <section className="bg-[--white-1]">
      {!showS1 && (
        <Sidebar openSidebar={openSidebar} setOpenSidebar={setOpenSidebar} />
      )}
      <section className="lg:ml-[280px] pt-16 px-[4%] pb-4 grid grid-cols-1 section_row">
        {/* Wraps every restaurant route so the Genel Ayarlar tab strip
            (and any other surface that opts in) can warn the user
            when they try to navigate away with unsaved changes.
            Non-settings pages just don't push any dirty state and
            the provider is a no-op for them. */}
        <DirtyNavProvider>
        <Routes>
          <Route path="/edit/:id" element={<EditRestaurant data={data} />} />
          <Route path="/hours/:id" element={<WorkingHours data={data} />} />
          <Route path="/social/:id" element={<SocialMedias data={data} />} />
          <Route path={P.R.payments} element={<PaymentMethods data={data} />} />
          <Route path={P.R.sett} element={<RestaurantSettings data={data} />} />
          <Route path={P.R.order} element={<RestaurantSettings data={data} />} />
          <Route path={P.R.rsrv} element={<ReservationSett data={data} />} />
          <Route path={P.R.ann} element={<AnnouncementSett data={data} />} />
          <Route path={P.R.surv} element={<SurveySettings data={data} />} />
          <Route path={P.R.ext} element={<ExternalPage data={data} />} />

          {/* CATEGORIES */}
          <Route path={P.cat.list} element={<Categories data={data} />} />
          <Route path={P.cat.add} element={<AddCategory data={data} />} />
          <Route path={P.cat.addMany} element={<AddCategories data={data} />} />

          {/* SUBCATEGORIES */}
          <Route path={P.subCat.list} element={<SubCategories data={data} />} />
          <Route
            path={P.subCat.add}
            element={<AddSubCategories data={data} />}
          />

          {/* MENUS */}
          <Route path={P.menus.list} element={<MenuList data={data} />} />

          {/* ORDER TAGS AND ITEMS */}
          <Route path={P.orderTags.list} element={<OrderTags data={data} />} />

          {/* PRODUCTS */}
          <Route path={P.prods.list} element={<Products data={data} />} />
          <Route path={P.prods.add} element={<AddProduct data={data} />} />
          <Route
            path={P.prods.import}
            element={<ImportExternal data={data} />}
          />
          <Route path={P.prods.priceList} element={<PriceList data={data} />} />
          <Route path={P.prods.edit} element={<EditProduct data={data} />} />

          {/* THEME */}
          <Route path="/qrthemes/:id" element={<ThemeSelector data={data} />} />
          <Route
            path="/tvthemes/:id"
            element={<TvMenuSelector data={data} />}
          />
          <Route
            path="/kioskthemes/:id"
            element={<KioskSelector data={data} />}
          />

          {/* QR */}
          <Route path="/qr/:id" element={<QRPage data={data} />} />

          {/* GOOGLE ANALYTICS — smart launcher (status + open GA) */}
          <Route
            path="/googleAnalytics/:id"
            element={<GoogleAnalytics data={data} />}
          />

          {/* PAYMENT GATEWAYS — credentials for PayTR / Stripe / Iyzico.
              Gated by `paymentIntegrationLicenseIsActive` (subSidebar
              hides the link; the page itself also short-circuits with
              a license-required notice for direct URL visits). */}
          <Route
            path="/paymentGateways/:id"
            element={<PaymentGatewaySettings data={data} />}
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
        </DirtyNavProvider>
      </section>
    </section>
  );
};

export default RestaurantHome;
