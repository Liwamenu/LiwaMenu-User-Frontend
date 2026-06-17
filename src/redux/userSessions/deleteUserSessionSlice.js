import { createApiSlice } from "../createApiSlice";

// Revoke ONE other session by id. Same endpoint logout uses, but this slice
// does NOT clear local auth — we're closing a *different* device, not ours.
// DELETE UserSessions/DeleteUserSessionById?userSessionId=…
// Arg: { userSessionId }
const slice = createApiSlice({
  name: "deleteUserSession",
  thunkType: "UserSessions/DeleteUserSessionById",
  url: "UserSessions/DeleteUserSessionById",
  method: "delete",
  payloadKey: "result",
  errorIdle: null,
});

export const deleteUserSession = slice.thunk;
export const { resetDeleteUserSessionState, resetDeleteUserSession } =
  slice.actions;
export default slice.reducer;
