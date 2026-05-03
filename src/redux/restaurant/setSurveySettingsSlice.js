import { createApiSlice } from "../createApiSlice";

const slice = createApiSlice({
  name: "setSurveySettings",
  thunkType: "Restaurants/SetSurveySettings",
  url: "Restaurants/SetSurveySettings",
  method: "put",
  errorIdle: null,
  clearOnPending: true,
});

export const setSurveySettings = slice.thunk;
export const { resetSetSurveySettings } = slice.actions;
export default slice.reducer;
