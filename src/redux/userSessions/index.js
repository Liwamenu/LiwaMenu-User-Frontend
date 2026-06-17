import { combineReducers } from "@reduxjs/toolkit";

import getUserSessions from "./getUserSessionsSlice";
import deleteUserSession from "./deleteUserSessionSlice";
import deleteOtherUserSessions from "./deleteOtherUserSessionsSlice";

// state.userSessions.{ get, delete, deleteOthers }
export default combineReducers({
  get: getUserSessions,
  delete: deleteUserSession,
  deleteOthers: deleteOtherUserSessions,
});
