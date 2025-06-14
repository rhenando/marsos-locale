// store/checkoutSlice.js

import { createSlice } from "@reduxjs/toolkit";
import { db } from "@/firebase/config";
import {
  setDoc,
  doc,
  serverTimestamp,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

// ─── SLICE ────────────────────────────────────────────

const initialForm = {
  addresses: [],
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  suite: "",
  city: "",
  state: "",
  zip: "",
  isGift: false,
  uid: "",
};

const slice = createSlice({
  name: "checkout",
  initialState: {
    form: { ...initialForm },
    savedCards: [],
    selectedCardIndex: null,
    selectedWalletOption: "",
    paymentMethod: "", // ← add this
    loading: false,
    error: null,
    orderId: null,
  },
  reducers: {
    updateField(state, { payload: { name, value } }) {
      state.form[name] = value;
    },
    addAddress(state, { payload }) {
      state.form.addresses.push(payload);
    },
    replaceAddress(state, { payload }) {
      if (state.form.addresses.length) state.form.addresses[0] = payload;
      else state.form.addresses.push(payload);
    },
    resetCheckout(state) {
      Object.assign(state, {
        form: { ...initialForm },
        savedCards: [],
        selectedCardIndex: null,
        selectedWalletOption: "",
        paymentMethod: "", // ← reset here too
        loading: false,
        error: null,
        orderId: null,
      });
    },
    selectCardIndex(state, { payload }) {
      state.selectedCardIndex = payload;
    },
    removeSavedCard(state, { payload }) {
      state.savedCards.splice(payload, 1);
      if (state.selectedCardIndex === payload) state.selectedCardIndex = null;
    },
    selectWalletOption(state, { payload }) {
      state.selectedWalletOption = payload;
    },
    setPaymentMethod(state, { payload }) {
      state.paymentMethod = payload; // ← new reducer
    },
  },
  extraReducers: (builder) => {
    // (HyperPay-related cases were removed)
  },
});

export const {
  updateField,
  addAddress,
  replaceAddress,
  resetCheckout,
  selectCardIndex,
  removeSavedCard,
  selectWalletOption,
  setPaymentMethod, // ← export the new action
} = slice.actions;

export default slice.reducer;
