import { createApiSlice } from "../createApiSlice";

// Active sessions for the logged-in user (device + location + last-seen).
// Backend contract: GET UserSessions/GetMyUserSessions →
//   ResponsBase { data: UserSessionDto[] }   (see SESSION_SECURITY_BRIEF.md)
//
// `skipErrorToast` keeps the global error toast quiet while this endpoint is
// still being built on the backend — the section renders an inline
// "could not load / retry" state instead of spamming a toast on every open.
const slice = createApiSlice({
  name: "getUserSessions",
  thunkType: "UserSessions/GetMyUserSessions",
  url: "UserSessions/GetMyUserSessions",
  method: "get",
  payloadKey: "sessions",
  transform: (res) => {
    const d = res?.data?.data ?? res?.data;
    return Array.isArray(d) ? d : [];
  },
  errorIdle: null,
  axiosConfig: { skipErrorToast: true },
});

export const getUserSessions = slice.thunk;
export const { resetGetUserSessionsState, resetGetUserSessions } = slice.actions;
export default slice.reducer;
