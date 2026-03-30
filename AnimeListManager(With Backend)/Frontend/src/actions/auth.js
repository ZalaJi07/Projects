import { AUTH } from "../constants/actionTypes";
import * as api from "../api";
import toast from "react-hot-toast";

// SIGN IN
export const signIn = (formData, navigate) => async (dispatch) => {
  try {
    const { data } = await api.signIn(formData);

    dispatch({ type: AUTH, data });
    toast.success(`Welcome back, ${data.result.username || data.result.email}!`);
    navigate("/");
  } catch (error) {
    toast.error(error.response?.data?.message || "Sign in failed. Please try again.");
  }
};

// SIGN UP
export const signUp = (formData, navigate) => async (dispatch) => {
  try {
    const { data } = await api.signUp(formData);

    dispatch({ type: AUTH, data });
    toast.success("Account created successfully! Welcome!");
    navigate("/");
  } catch (error) {
    toast.error(error.response?.data?.message || "Sign up failed. Please try again.");
  }
};

export const googleSignIn = (token, navigate) => async (dispatch) => {
  try {
    const { data } = await api.googleSignIn(token);

    dispatch({ type: AUTH, data });
    toast.success(`Welcome, ${data.result.username || data.result.email}!`);
    navigate("/");
  } catch (error) {
    toast.error(error.response?.data?.message || "Google sign in failed.");
  }
};
