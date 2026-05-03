import { createApiSlice } from "../createApiSlice";

const slice = createApiSlice({
  name: "getSurveySettings",
  thunkType: "Restaurants/GetSurveySettings",
  url: "Restaurants/GetSurveySettings",
  method: "get",
  transform: (res) => res?.data?.data,
  errorIdle: null,
  clearOnPending: true,
});

export const getSurveySettings = slice.thunk;
export const { resetGetSurveySettings } = slice.actions;
export default slice.reducer;
