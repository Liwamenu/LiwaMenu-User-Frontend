import { createApiSlice } from "../createApiSlice";

// Revoke every session EXCEPT the current one (identified server-side from
// the request's JWT sessionId). No request body.
// DELETE UserSessions/DeleteOtherUserSessions
const slice = createApiSlice({
  name: "deleteOtherUserSessions",
  thunkType: "UserSessions/DeleteOtherUserSessions",
  url: "UserSessions/DeleteOtherUserSessions",
  method: "delete",
  payloadKey: "result",
  errorIdle: null,
});

export const deleteOtherUserSessions = slice.thunk;
export const {
  resetDeleteOtherUserSessionsState,
  resetDeleteOtherUserSessions,
} = slice.actions;
export default slice.reducer;
