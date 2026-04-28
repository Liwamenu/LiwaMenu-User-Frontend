//MODULES
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Route, Routes, useLocation, useParams } from "react-router-dom";

//COMP
import Sidebar from "../components/subSidebar/subSidebar";

//REDUX
import {
  getRestaurant,
  resetGetRestaurantState,
} from "../redux/restaurants/getRestaurantSlice";

//PAGES
import NotFound from "./404";
import TestPage from "./test";
import EditRestaurant from "../components/restaurant/editRestaurant";
import WorkingHours from "../components/restaurant/workingHours";
import SocialMedias from "../components/restaurant/socialMedias";
import PaymentMethods from "../components/restaurant/paymentMethods";
import ReservationSett from "../components/restaurant/reservationSettings";
import RestaurantSettings from "../components/restaurant/restaurantSettings";
import AnnouncementSett from "../components/restaurant/announcementSettings";

//PRODUCTS
import Products from "../components/restaurant/products/products";
import PriceList from "../components/restaurant/products/priceList";
import AddProduct from "../components/restaurant/products/addProduct";
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

const RestaurantHome = ({ showS1, setShowS1, openSidebar, setOpenSidebar }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const id = useParams()["*"].split("/")[1];

  const { restaurants } = useSelector(
    (state) => state.restaurants.getRestaurants,
  );
  const { restaurant: stateRest, success } = useSelector(
    (state) => state.restaurants.getRestaurant,
  );
  const { restaurant } = location?.state || {};
  const myRestaurant = restaurants?.data?.filter((r) => r.id === id)[0];
  const [data, setData] = useState(restaurant || myRestaurant);

  // Fetch restaurant only if we don't already have it. We deliberately do
  // NOT re-fetch on setRestaurantSettings success — `GetRestaurantById` is
  // slow (~2.7s) and would keep the global spinner up long after the toast
  // has already confirmed the save. Each sub-tab fetches its own slice.
  useEffect(() => {
    if (!restaurant && !data) {
      dispatch(getRestaurant({ restaurantId: id }));
    }
  }, [data, dispatch, id, restaurant]);

  useEffect(() => {
    setShowS1(false);

    return () => {
      setShowS1(true);
    };
  }, []);

  // Update data when fetched
  useEffect(() => {
    if (success) {
      setData(stateRest);
      dispatch(resetGetRestaurantState());
    }
  }, [success]);

  const P = {
    // paths
    R: {
      // restaurant
      edit: "/edit/:id",
      hours: "/hours/:id",
      social: "/social/:id",
      payments: "/payments/:id",
      sett: "/settings/:id",
      rsrv: "reservationSettings/:id",
      ann: "announcementSettings/:id",
      surv: "surveySettings/:id",
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
    },
  };

  return (
    <section className="bg-[--white-1]">
      {!showS1 && (
        <Sidebar openSidebar={openSidebar} setOpenSidebar={setOpenSidebar} />
      )}
      <section className="lg:ml-[280px] pt-16 px-[4%] pb-4 grid grid-cols-1 section_row">
        <Routes>
          <Route path="/edit/:id" element={<EditRestaurant data={data} />} />
          <Route path="/hours/:id" element={<WorkingHours data={data} />} />
          <Route path="/social/:id" element={<SocialMedias data={data} />} />
          <Route path={P.R.payments} element={<PaymentMethods data={data} />} />
          <Route path={P.R.sett} element={<RestaurantSettings data={data} />} />
          <Route path={P.R.rsrv} element={<ReservationSett data={data} />} />
          <Route path={P.R.ann} element={<AnnouncementSett data={data} />} />
          <Route path={P.R.surv} element={<SurveySettings data={data} />} />

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
          <Route path={P.prods.priceList} element={<PriceList data={data} />} />
          <Route path={P.prods.edit} element={<EditProduct data={data} />} />

          {/* THEME */}
          <Route path="/qrthemes/:id" element={<ThemeSelector data={data} />} />
          <Route
            path="/tvthemes/:id"
            element={<TvMenuSelector data={data} />}
          />

          {/* QR */}
          <Route path="/qr/:id" element={<QRPage data={data} />} />

          <Route path="/test" element={<TestPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </section>
    </section>
  );
};

export default RestaurantHome;
