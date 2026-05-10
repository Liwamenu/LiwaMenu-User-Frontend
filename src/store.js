import { configureStore } from "@reduxjs/toolkit";

// INDEX
import authSlice from "./redux/auth";
import dataSlice from "./redux/data";
import adminSlice from "./redux/admin";
// import generalVariablesSlice from "./redux/generalVars";
import licensePackagesSlice from "./redux/licensePackages";
import licensesSlice from "./redux/licenses";
import restaurantsSlice from "./redux/restaurants";
import userSlice from "./redux/user";
import usersSlice from "./redux/users";
// import getContextSlice from "./redux/payTR/getContextSlice";
import cartSlice from "./redux/cart/cartSlice";
// import templatesSlice from "./redux/templates";
// import accountsSlice from "./redux/accounts";
// import dashboardSlice from "./redux/dashboard";
// import messagesSlice from "./redux/messages";
import paymentsSlice from "./redux/payments";
// import getirYemekSlice from "./redux/getirYemek";
// import integrationInformationsSlice from "./redux/informations";
// import rolesSlice from "./redux/roles";
// import managersSlice from "./redux/managers";
import loadingSlice from "./redux/loadingSlice";
import loadingMiddleware from "./middlewares/loadingMiddleware";
import restaurantSlice from "./redux/restaurant";
import categoriesSlice from "./redux/categories";
import subCategoriesSlice from "./redux/subCategories";
import productsSlice from "./redux/products";
import menusSlice from "./redux/menus";
import orderTagsSlice from "./redux/orderTags";
import ordersSlice from "./redux/orders";
import waiterCallsSlice from "./redux/waiterCalls";
import reservationsSlice from "./redux/reservations";
import sambaTablesSlice from "./redux/sambaTables";
import externalPagesSlice from "./redux/externalPages";
// import emailSlice from "./redux/email";
// import smsSlice from "./redux/sms";
// import tempUsersSlice from "./redux/tempUsers";

const store = configureStore({
  reducer: {
    auth: authSlice,
    admin: adminSlice,
    user: userSlice,
    users: usersSlice,
    // tempUsers: tempUsersSlice,
    restaurant: restaurantSlice,
    restaurants: restaurantsSlice,
    licenses: licensesSlice,
    licensePackages: licensePackagesSlice,
    data: dataSlice,
    categories: categoriesSlice,
    subCategories: subCategoriesSlice,
    products: productsSlice,
    menus: menusSlice,
    orderTags: orderTagsSlice,
    // generalVars: generalVariablesSlice,
    // getContext: getContextSlice,
    cart: cartSlice,
    // templates: templatesSlice,
    // accounts: accountsSlice,
    // dashboard: dashboardSlice,
    // messages: messagesSlice,
    payments: paymentsSlice,
    // getirYemek: getirYemekSlice,
    // integrationInfos: integrationInformationsSlice,
    // roles: rolesSlice,
    // managers: managersSlice,
    isLoading: loadingSlice,
    // email: emailSlice,
    // sms: smsSlice,
    orders: ordersSlice,
    waiterCalls: waiterCallsSlice,
    reservations: reservationsSlice,
    sambaTables: sambaTablesSlice,
    externalPages: externalPagesSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(loadingMiddleware),
});

export default store;
