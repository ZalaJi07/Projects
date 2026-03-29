import { AUTH } from "../constants/actionTypes";
import * as api from "../api";

// SIGN IN
export const signIn = (formData, navigate) => async (dispatch) => {
  try {
    const { data } = await api.signIn(formData);

    dispatch({ type: AUTH, data });
    navigate("/");
  } catch (error) {
    console.log(error.response?.data?.message || error.message);
  }
};

// SIGN UP
export const signUp = (formData, navigate) => async (dispatch) => {
  try {
    const { data } = await api.signUp(formData);

    dispatch({ type: AUTH, data });
    navigate("/");
  } catch (error) {
    console.log(error.response?.data?.message || error.message);
  }
};

export const googleSignIn = (token, navigate) => async (dispatch) => {
  try {
    const { data } = await api.googleSignIn(token); // Pass token directly since API usage in index.js expects just token? Wait, index.js says `googleSignIn = (token) => API.post("/user/googleSignIn", token);`

    dispatch({ type: AUTH, data });
    navigate("/");
  } catch (error) {
    console.log(error.response?.data?.message || error.message);
  }
};
