// app/checkout/[supplierId]/page.jsx

"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import {
  collection,
  onSnapshot,
  query,
  where,
  updateDoc,
  addDoc,
  doc,
  deleteDoc,
  getDocs,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/firebase/config";
import Currency from "@/components/global/CurrencySymbol";
import { Button } from "@/components/ui/button";
import { setPaymentMethod } from "@/store/checkoutSlice";
import { toast } from "sonner";
import MapAddressPicker from "@/components/checkout/MapAddressPicker";

export default function CheckoutPage() {
  const { supplierId } = useParams();
  const router = useRouter();
  const dispatch = useDispatch();

  const user = useSelector((s) => s.auth.user);
  const userId = user?.uid;

  // ------------------------------
  // ADDRESS STATES & EFFECTS
  // ------------------------------
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [address, setAddress] = useState(null);

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [modalSelectedAddressId, setModalSelectedAddressId] = useState(null);

  const [editingAddressId, setEditingAddressId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editingPhone, setEditingPhone] = useState("");

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newAddressData, setNewAddressData] = useState(null);
  const [newAlias, setNewAlias] = useState("");
  const [newName, setNewName] = useState(user?.displayName || "");
  const [newPhone, setNewPhone] = useState(user?.phoneNumber || "");

  useEffect(() => {
    if (!userId) return;
    const addressesRef = collection(db, "users", userId, "addresses");
    const unsub = onSnapshot(addressesRef, (snap) => {
      const fetched = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAddresses(fetched);
    });
    return () => unsub();
  }, [userId]);

  useEffect(() => {
    if (addresses.length === 0) {
      setSelectedAddressId(null);
      setAddress(null);
      return;
    }
    if (!selectedAddressId) {
      const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
      setSelectedAddressId(defaultAddr.id);
      setAddress(defaultAddr);
    } else {
      const found = addresses.find((a) => a.id === selectedAddressId);
      if (found) setAddress(found);
    }
  }, [addresses, selectedAddressId]);

  const handleSelectAddress = (addrId) => {
    setSelectedAddressId(addrId);
    const found = addresses.find((a) => a.id === addrId) || null;
    setAddress(found);
  };

  const openAddressModal = (addrId = null) => {
    if (addresses.length === 0) {
      setModalSelectedAddressId(null);
    } else {
      setModalSelectedAddressId(addrId || selectedAddressId || addresses[0].id);
    }
    setEditingAddressId(null);
    setIsAddingNew(false);
    setShowAddressModal(true);
  };

  const selectModalAddress = (addrId) => {
    setModalSelectedAddressId(addrId);
  };

  const confirmModalSelection = () => {
    if (modalSelectedAddressId) {
      setSelectedAddressId(modalSelectedAddressId);
      const found = addresses.find((a) => a.id === modalSelectedAddressId);
      if (found) setAddress(found);
    }
    setShowAddressModal(false);
  };

  const cancelAddressModal = () => {
    setEditingAddressId(null);
    setIsAddingNew(false);
    setNewAddressData(null);
    setShowAddressModal(false);
  };

  const startEditingAddress = (addr) => {
    setEditingAddressId(addr.id);
    setEditingName(addr.authPersonName || "");
    setEditingPhone(addr.authPersonMobile || "");
  };

  const cancelEditAddress = () => {
    setEditingAddressId(null);
    setEditingName("");
    setEditingPhone("");
  };

  const saveEditAddress = async (addrId) => {
    if (!editingName.trim() || !editingPhone.trim()) {
      toast.error("Name and Phone cannot be empty");
      return;
    }
    try {
      const docRef = doc(db, "users", userId, "addresses", addrId);
      await updateDoc(docRef, {
        authPersonName: editingName.trim(),
        authPersonMobile: editingPhone.trim(),
      });
      toast.success("Address updated");
      setEditingAddressId(null);
      setEditingName("");
      setEditingPhone("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update address");
    }
  };

  const startAddingNewAddress = () => {
    setIsAddingNew(true);
    setNewAddressData(null);
    setNewAlias("");
    setNewName(user?.displayName || "");
    setNewPhone(user?.phoneNumber || "");
  };

  const handleMapSelect = (data) => {
    setNewAddressData(data);
  };

  const saveNewAddress = async () => {
    if (!newAddressData) {
      toast.error("Please pick a location on the map");
      return;
    }
    if (!newAlias.trim()) {
      toast.error("Please enter an address label (alias)");
      return;
    }
    if (!newName.trim() || !newPhone.trim()) {
      toast.error("Name and Phone are required");
      return;
    }
    try {
      const addressesRef = collection(db, "users", userId, "addresses");
      await addDoc(addressesRef, {
        alias: newAlias.trim(),
        formatted: newAddressData.formatted,
        lat: newAddressData.lat,
        lng: newAddressData.lng,
        authPersonName: newName.trim(),
        authPersonMobile: newPhone.trim(),
        isDefault: false,
        createdAt: Date.now(),
      });
      toast.success("Address added");
      setIsAddingNew(false);
      setNewAddressData(null);
      setNewAlias("");
      setNewName("");
      setNewPhone("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add address");
    }
  };

  // ------------------------------
  // CART ITEMS & SUMMARY
  // ------------------------------
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({
    subtotal: 0,
    shipping: 0,
    vat: 0,
    total: 0,
  });

  useEffect(() => {
    if (!userId) return;
    const itemsQuery = query(
      collection(db, "carts", userId, "items"),
      where("supplierId", "==", supplierId)
    );
    const unsubItems = onSnapshot(itemsQuery, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsubItems();
  }, [userId, supplierId]);

  useEffect(() => {
    const subtotal = items.reduce(
      (sum, i) => sum + (i.subtotal || i.price * i.quantity),
      0
    );
    const shipping = items.reduce((sum, i) => sum + (i.shippingCost || 0), 0);
    const vat = Number(((subtotal + shipping) * 0.15).toFixed(2));
    const total = Number((subtotal + shipping + vat).toFixed(2));
    setSummary({ subtotal, shipping, vat, total });
  }, [items]);

  const [checkoutId, setCheckoutId] = useState(null);
  const hyperpayRef = useRef(null);

  const totalAmount = items.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);

  const createHyperPayCheckout = async () => {
    try {
      const res = await fetch(
        "https://marsos.com.sa/api3/api/create-checkout",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: totalAmount.toFixed(2),
            email: user?.email || "buyer@example.com",
            name: user?.displayName || "Guest",
            // optional billing details (optional override if needed)
            street: address?.formatted || "King Fahad Road",
            city: "Riyadh",
            state: "Riyadh",
            country: "SA",
            postcode: "12345",
          }),
        }
      );

      const data = await res.json();

      if (!data?.checkoutId) {
        toast.error("Failed to generate payment session");
        return;
      }

      setCheckoutId(data.checkoutId);
      dispatch(setPaymentMethod("hyperpay"));
    } catch (error) {
      console.error("💥 HyperPay Error:", error);
      toast.error("Failed to create payment session");
    }
  };

  const createGoPayInvoice = async () => {
    try {
      // Sanitize and fallback for phone number
      const fallbackPhone = "0512345678"; // valid-looking Saudi number
      let rawPhone = user?.phoneNumber || fallbackPhone;

      // Remove non-digit characters
      const cleanedPhone = rawPhone.replace(/[^\d]/g, "");

      // Ensure it starts with 05 or 9665 and has correct length
      let validPhone = cleanedPhone;
      if (
        !/^05\d{8}$/.test(cleanedPhone) &&
        !/^9665\d{8}$/.test(cleanedPhone)
      ) {
        validPhone = fallbackPhone;
      }

      const res = await fetch("https://marsos.com.sa/api2/api/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName:
            user?.firstName || user?.displayName?.split(" ")[0] || "Guest",
          lastName: user?.lastName || "",
          phone: validPhone,
          email: user?.email || "no-reply@marsos.sa",
          billNumber: `marsos_${Date.now()}`,
          issueDate: new Date().toISOString().split("T")[0],
          expireDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          serviceName: "Marsos Order Payment",
          items: items,
          shippingCost: summary.shipping,
          amount: summary.total,
        }),
      });

      const data = await res.json();

      console.log("📦 GoPay API response:", data);

      if (data?.redirectUrl) {
        setSadadInvoiceUrl(data.redirectUrl);
        dispatch(setPaymentMethod("sadad"));
        toast.success("SADAD invoice created");
      } else {
        throw new Error("No redirect URL received");
      }
    } catch (err) {
      toast.error("Failed to create SADAD invoice");
      console.error("🔥 SADAD error:", err);
    }
  };

  useEffect(() => {
    if (!checkoutId || !hyperpayRef.current) return;

    // ✅ Don't use resourcePath here — it's unknown at this point
    window.wpwlOptions = {
      style: "card",
      locale: "en",
      paymentTarget: "_top",
    };

    hyperpayRef.current.innerHTML = `
   <form 
    action="https://marsos.sa/payment/verify?userId=${userId}&supplierId=${supplierId}" 
      class="paymentWidgets" 
      data-brands="VISA MASTER MADA"
    ></form>
  `;

    const script = document.createElement("script");
    script.src = `https://eu-prod.oppwa.com/v1/paymentWidgets.js?checkoutId=${checkoutId}`;
    script.async = true;
    hyperpayRef.current.appendChild(script);
  }, [checkoutId, userId, supplierId]);

  // ------------------------------
  // PAYMENT STATES & TOGGLES
  // ------------------------------
  const paymentMethod = useSelector((s) => s.checkout.paymentMethod);
  const selectPayment = (id) => dispatch(setPaymentMethod(id));

  // Toggles for collapse/expand
  const [showCardSection, setShowCardSection] = useState(false);
  const [showSadad, setShowSadad] = useState(false);
  const [sadadInvoiceUrl, setSadadInvoiceUrl] = useState(null);
  const [showDigitalSection, setShowDigitalSection] = useState(false);
  const [showBNPLSection, setShowBNPLSection] = useState(false);

  const [transactionId] = useState(() => `marsos_tx_${Date.now()}`);

  // ─────────────────────────────────────────────────────────────────────────────
  // NOTE: We now disable “Pay Now” unless:
  //   • address !== null
  //   • address.authPersonMobile is non‐empty
  //   • paymentMethod is non‐empty
  // ─────────────────────────────────────────────────────────────────────────────
  const isPlaceOrderDisabled =
    !address || !address.authPersonMobile || !paymentMethod;

  const placeOrder = () => {
    if (isPlaceOrderDisabled) {
      if (!address) toast.error("Please select a shipping address");
      else if (!address.authPersonMobile)
        toast.error("Shipping address must include a phone number");
      else if (!paymentMethod) toast.error("Please select a payment method");
      return;
    }
    router.push(`/`);
  };

  if (!userId) return null;

  const [placingOrder, setPlacingOrder] = useState(false);

  const handlePlaceOrder = async () => {
    if (isPlaceOrderDisabled || placingOrder) return;

    if (!address) return toast.error("Please select a shipping address");
    if (!address.authPersonMobile)
      return toast.error("Shipping address must include a phone number");
    if (!paymentMethod) return toast.error("Please select a payment method");

    setPlacingOrder(true);
    try {
      // Step 1: Create order in Firestore
      const orderRef = collection(db, "orders");
      const orderData = {
        userId,
        supplierId,
        items,
        address,
        total: summary.total,
        paymentMethod,
        status: "pending",
        createdAt: serverTimestamp(),
      };
      const orderDoc = await addDoc(orderRef, orderData);

      // Step 2: Clear the cart for this supplier
      const cartItemsQuery = query(
        collection(db, "carts", userId, "items"),
        where("supplierId", "==", supplierId)
      );
      const cartItemsSnap = await getDocs(cartItemsQuery);

      const batch = writeBatch(db);
      cartItemsSnap.forEach((docSnap) => {
        batch.delete(doc(db, "carts", userId, "items", docSnap.id));
      });
      await batch.commit();

      // Step 3: Continue existing SADAD logic
      if (paymentMethod === "sadad") {
        const fallbackPhone = "0512345678";
        let rawPhone = user?.phoneNumber || fallbackPhone;
        const cleanedPhone = rawPhone.replace(/[^\d]/g, "");
        let validPhone = cleanedPhone;
        if (
          !/^05\d{8}$/.test(cleanedPhone) &&
          !/^9665\d{8}$/.test(cleanedPhone)
        ) {
          validPhone = fallbackPhone;
        }

        const res = await fetch(
          "https://marsos.com.sa/api2/api/create-invoice",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              firstName:
                user?.firstName || user?.displayName?.split(" ")[0] || "Guest",
              lastName: user?.lastName || "",
              phone: validPhone,
              email: user?.email || "no-reply@marsos.sa",
              billNumber: `marsos_${Date.now()}`,
              issueDate: new Date().toISOString().split("T")[0],
              expireDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0],
              serviceName: "Marsos Order Payment",
              items: items,
              shippingCost: summary.shipping,
              amount: summary.total,
            }),
          }
        );

        const data = await res.json();
        if (data?.redirectUrl) {
          toast.success("SADAD invoice created");
          router.push(
            `/payment/pending?sadad=${data.sadadNumber}&invoice=${data.invoiceNo}&amount=${data.amount}&issue=${data.issueDate}&expire=${data.expireDate}`
          );
        } else {
          throw new Error("No redirect URL received");
        }
      } else {
        // other payment methods (e.g., HyperPay)
        router.push("/order");
      }
    } catch (err) {
      toast.error("Failed to place order");
      console.error("Order creation or payment failed:", err);
    } finally {
      setPlacingOrder(false);
    }
  };

  const deleteAddress = async (id) => {
    try {
      const addressRef = doc(db, "users", userId, "addresses", id);
      await deleteDoc(addressRef);
      toast.success("Address deleted");
    } catch (error) {
      console.error("Error deleting address:", error);
      toast.error("Failed to delete address.");
    }
  };

  return (
    <div className='max-w-4xl mx-auto px-3 sm:px-4 py-2'>
      {/* Title */}
      <h1 className='text-lg sm:text-xl font-semibold mb-2'>Checkout</h1>

      {/* Main grid: single column on small screens, two-column (3:2) on md+ */}
      <div className='grid grid-cols-1 md:grid-cols-5 gap-2'>
        {/* LEFT: Shipping Address & Your Order */}
        <div className='md:col-span-3 space-y-3'>
          {/* Shipping Address */}
          <div className='border rounded-md p-3 bg-white'>
            <h2 className='font-semibold text-sm mb-1'>Shipping Address</h2>
            {address ? (
              <div className='flex flex-col sm:flex-row items-start gap-2 p-2 border rounded text-xs'>
                <div className='flex-1'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <p className='font-medium text-sm'>{address.alias}</p>
                      {address.isDefault && (
                        <span className='bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full'>
                          Default
                        </span>
                      )}
                    </div>
                    <button
                      type='button'
                      className='text-blue-600 text-xs hover:underline'
                      onClick={() => {
                        openAddressModal(address.id);
                        setIsAddingNew(false);
                      }}
                    >
                      Edit
                    </button>
                  </div>
                  <p className='text-gray-600 text-xs mt-1'>
                    {address.formatted}
                  </p>
                  <p className='text-gray-500 text-[10px] mt-1'>
                    Name: {address.authPersonName}
                  </p>
                  <p className='text-gray-500 text-[10px]'>
                    Phone: {address.authPersonMobile}
                  </p>
                </div>
              </div>
            ) : (
              <div className='flex items-center justify-between px-2 py-2 text-xs'>
                <p className='text-gray-500'>No saved address selected.</p>
                <button
                  type='button'
                  className='text-blue-600 hover:underline'
                  onClick={() => {
                    openAddressModal();
                    startAddingNewAddress();
                  }}
                >
                  Add
                </button>
              </div>
            )}
          </div>

          {/* Your Order Section */}
          <div className='border rounded-md p-3 bg-white space-y-2 capitalize'>
            <h2 className='font-semibold text-sm mb-1'>Your Order</h2>
            {items.map((item) => (
              <div
                key={item.id}
                className='flex flex-col sm:flex-row gap-2 items-start border-b pb-2'
              >
                <img
                  src={item.productImage || "https://via.placeholder.com/100"}
                  alt={item.productName}
                  className='w-12 h-12 object-cover rounded border flex-shrink-0'
                />
                <div className='flex-1 text-xs'>
                  <h3 className='font-semibold text-sm'>{item.productName}</h3>
                  <div className='flex gap-2 items-center text-xs text-gray-600 mt-1'>
                    <span>Qty:</span>
                    <span>{item.quantity}</span>
                    <span>×</span>
                    <Currency amount={item.price} />
                  </div>
                  <p className='text-gray-500 text-xs mt-1'>
                    Size: {item.size || "—"} | Color: {item.color || "—"} |
                    Location: {item.deliveryLocation || "—"}
                  </p>
                  <p className='text-xs font-medium text-[#2c6449] mt-1'>
                    Subtotal: <Currency amount={item.subtotal} />
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Order Summary + Payment + Button */}
        <div className='md:col-span-2 space-y-3'>
          {/* Order Summary */}
          <div className='border rounded-md p-3 bg-white space-y-1 text-xs'>
            <h2 className='font-semibold text-sm mb-1'>Order Summary</h2>
            <div className='grid grid-cols-2 gap-y-1'>
              <span className='text-xs'>Subtotal</span>
              <span className='text-right'>
                <Currency amount={summary.subtotal} />
              </span>

              <span className='text-xs'>Shipping Fee</span>
              <span className='text-right'>
                <Currency amount={summary.shipping} />
              </span>

              <span className='text-xs'>VAT (15%)</span>
              <span className='text-right'>
                <Currency amount={summary.vat} />
              </span>

              <span className='text-xs font-semibold'>Total</span>
              <span className='text-right font-semibold text-sm text-[#2c6449]'>
                <Currency amount={summary.total} />
              </span>
            </div>
          </div>

          {/* Payment Methods */}
          <div className='border rounded-md p-3 bg-white space-y-2 text-xs'>
            <h2 className='font-semibold text-sm mb-1'>Payment</h2>

            {/* Debit/Credit Card Section */}
            <div>
              <div
                className='flex items-center justify-between p-2 cursor-pointer'
                onClick={createHyperPayCheckout}
              >
                <span className='font-medium text-xs'>Debit/Credit Card</span>
                <div className='flex items-center gap-1'>
                  <img src='/images/payments/visa.png' className='w-7 h-7' />
                  <img src='/images/payments/master.png' className='w-6 h-6' />
                  <img src='/images/payments/mada.png' className='w-7 h-7' />
                  <span className='text-xs'>{checkoutId ? "-" : "+"}</span>
                </div>
              </div>

              {checkoutId && (
                <div
                  ref={hyperpayRef}
                  className='p-2 border rounded bg-gray-50 mt-2'
                />
              )}
            </div>

            {/* SADAD Section */}
            <div>
              <div
                className='flex items-center justify-between p-2 cursor-pointer'
                onClick={() => setShowSadad((prev) => !prev)}
              >
                <span className='font-medium text-xs'>SADAD</span>
                <div className='flex items-center gap-1'>
                  <img
                    src='/images/payments/sadad.png'
                    alt='SADAD'
                    className='w-8 h-8 object-contain'
                  />
                  <span className='text-xs'>{showSadad ? "–" : "+"}</span>
                </div>
              </div>

              {showSadad && (
                <label className='flex items-center justify-between p-2 border rounded hover:shadow-sm cursor-pointer text-xs'>
                  <div className='flex items-center gap-2'>
                    <input
                      type='radio'
                      name='payment'
                      className='mr-2 w-4 h-4'
                      value='sadad'
                      checked={paymentMethod === "sadad"}
                      onChange={() => selectPayment("sadad")}
                    />
                    {sadadInvoiceUrl && (
                      <a
                        href={sadadInvoiceUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-blue-600 text-xs underline ml-2'
                      >
                        View Invoice
                      </a>
                    )}

                    <span className='flex-1'>SADAD</span>
                  </div>
                  <img
                    src='/images/payments/sadad.png'
                    alt='SADAD'
                    className='w-8 h-8 object-contain'
                  />
                </label>
              )}
            </div>

            {/* Digital Wallet Section */}
            <div>
              <div
                className='flex items-center justify-between mt-2 p-2 cursor-pointer'
                onClick={() => setShowDigitalSection((prev) => !prev)}
              >
                <span className='font-medium text-xs'>Digital Wallet</span>
                <div className='flex items-center gap-1'>
                  <img
                    src='/images/payments/applepay.png'
                    alt='Digital Wallet'
                    className='w-8 h-8 object-contain'
                  />
                  <img
                    src='/images/payments/googlepay.jpeg'
                    alt='Digital Wallet'
                    className='w-5 h-5 object-contain'
                  />
                  <span className='text-xs'>
                    {showDigitalSection ? "–" : "+"}
                  </span>
                </div>
              </div>

              {showDigitalSection && (
                <div className='space-y-1'>
                  <label className='flex items-center justify-between p-2 border rounded hover:shadow-sm cursor-pointer text-xs'>
                    <div className='flex items-center gap-2'>
                      <input
                        type='radio'
                        name='payment'
                        className='mr-2 w-4 h-4'
                        value='applePay'
                        checked={paymentMethod === "applePay"}
                        onChange={() => selectPayment("applePay")}
                      />
                      <span className='flex-1'>Apple Pay</span>
                    </div>
                    <img
                      src='/images/payments/applepay.png'
                      alt='Apple Pay'
                      className='w-8 h-8 object-contain'
                    />
                  </label>
                  <label className='flex items-center justify-between p-2 border rounded hover:shadow-sm cursor-pointer text-xs'>
                    <div className='flex items-center gap-2'>
                      <input
                        type='radio'
                        name='payment'
                        className='mr-2 w-4 h-4'
                        value='googlePay'
                        checked={paymentMethod === "googlePay"}
                        onChange={() => selectPayment("googlePay")}
                      />
                      <span className='flex-1'>Google Pay</span>
                    </div>
                    <img
                      src='/images/payments/googlepay.jpeg'
                      alt='Google Pay'
                      className='w-5 h-5 object-contain'
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Buy Now, Pay Later Section */}
            <div>
              <div
                className='flex items-center justify-between mt-2 p-2 cursor-pointer'
                onClick={() => setShowBNPLSection((prev) => !prev)}
              >
                <span className='font-medium text-xs'>Buy Now, Pay Later</span>
                <div className='flex items-center gap-1'>
                  <img
                    src='/images/payments/tabby.png'
                    alt='Buy Now, Pay Later'
                    className='w-8 h-8 object-contain'
                  />
                  <img
                    src='/images/payments/tamara.png'
                    alt='Buy Now, Pay Later'
                    className='w-9 h-9 object-contain'
                  />
                  <span className='text-xs'>{showBNPLSection ? "–" : "+"}</span>
                </div>
              </div>

              {showBNPLSection && (
                <div className='space-y-1'>
                  <label className='flex items-center justify-between p-2 border rounded hover:shadow-sm cursor-pointer text-xs'>
                    <div className='flex items-center gap-2'>
                      <input
                        type='radio'
                        name='payment'
                        className='mr-2 w-4 h-4'
                        value='tabby'
                        checked={paymentMethod === "tabby"}
                        onChange={() => selectPayment("tabby")}
                      />
                      <span className='flex-1'>Tabby</span>
                    </div>
                    <img
                      src='/images/payments/tabby.png'
                      alt='Tabby'
                      className='w-8 h-8 object-contain'
                    />
                  </label>
                  <label className='flex items-center justify-between p-2 border rounded hover:shadow-sm cursor-pointer text-xs'>
                    <div className='flex items-center gap-2'>
                      <input
                        type='radio'
                        name='payment'
                        className='mr-2 w-4 h-4'
                        value='tamara'
                        checked={paymentMethod === "tamara"}
                        onChange={() => selectPayment("tamara")}
                      />
                      <span className='flex-1'>Tamara</span>
                    </div>
                    <img
                      src='/images/payments/tamara.png'
                      alt='Tamara'
                      className='w-9 h-9 object-contain'
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Pay Now Button */}
          <Button
            disabled={isPlaceOrderDisabled || placingOrder}
            className='w-full bg-[#2c6449] text-white py-2 text-xs'
            onClick={handlePlaceOrder}
          >
            {placingOrder ? "Processing..." : "Pay Now"}
          </Button>
        </div>
      </div>

      {/* ==================== ADDRESS MODAL ==================== */}
      {showAddressModal && (
        <div className='fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black bg-opacity-40'>
          <div className='relative mt-16 w-full sm:w-[90%] sm:max-w-lg bg-white rounded-lg shadow-lg'>
            <div className='flex items-center justify-between border-b px-4 py-2'>
              <h2 className='text-lg font-semibold'>Select Delivery Address</h2>
              <button
                onClick={cancelAddressModal}
                className='text-gray-600 hover:text-gray-800'
              >
                ✕
              </button>
            </div>

            {isAddingNew ? (
              <div className='p-4 space-y-3 max-h-[80vh] overflow-y-auto'>
                <MapAddressPicker onPick={handleMapSelect} />
                {newAddressData && (
                  <div className='space-y-2'>
                    <div>
                      <label className='block text-xs font-medium'>
                        Alias (e.g. “Home”):
                      </label>
                      <input
                        type='text'
                        value={newAlias}
                        onChange={(e) => setNewAlias(e.target.value)}
                        className='mt-1 w-full border px-2 py-1 rounded text-xs'
                      />
                    </div>
                    <div>
                      <label className='block text-xs font-medium'>Name:</label>
                      <input
                        type='text'
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className='mt-1 w-full border px-2 py-1 rounded text-xs'
                      />
                    </div>
                    <div>
                      <label className='block text-xs font-medium'>
                        Phone:
                      </label>
                      <input
                        type='text'
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        className='mt-1 w-full border px-2 py-1 rounded text-xs'
                      />
                    </div>
                    <p className='text-gray-600 text-xs'>
                      Formatted: {newAddressData.formatted}
                    </p>
                    <div className='flex justify-end gap-2 pt-2'>
                      <Button
                        variant='outline'
                        className='text-xs px-3 py-1'
                        onClick={() => {
                          setIsAddingNew(false);
                          setNewAddressData(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        className='text-xs px-3 py-1 bg-blue-600 text-white'
                        onClick={saveNewAddress}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className='max-h-[80vh] overflow-y-auto p-4 space-y-3'>
                  {addresses.map((addr) => {
                    const isSelected = modalSelectedAddressId === addr.id;
                    const isEditing = editingAddressId === addr.id;
                    return (
                      <div
                        key={addr.id}
                        className={`border rounded-md p-3 cursor-pointer ${
                          isSelected ? "bg-blue-50 border-blue-300" : "bg-white"
                        }`}
                        onClick={() =>
                          !isEditing && selectModalAddress(addr.id)
                        }
                      >
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-2'>
                            <p className='font-medium text-sm'>{addr.alias}</p>
                            {addr.isDefault && (
                              <span className='bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full'>
                                Default
                              </span>
                            )}
                          </div>
                          <div className='flex items-center gap-2'>
                            {isEditing ? (
                              <>
                                <button
                                  className='text-green-600 text-xs hover:underline'
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    saveEditAddress(addr.id);
                                  }}
                                >
                                  Save
                                </button>
                                <button
                                  className='text-red-600 text-xs hover:underline'
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    cancelEditAddress();
                                  }}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  className='text-blue-600 text-xs hover:underline'
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditingAddress(addr);
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  className='text-red-600 text-xs hover:underline'
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteAddress(addr.id);
                                  }}
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        {isEditing ? (
                          <div className='mt-2 space-y-2 text-xs'>
                            <div>
                              <label className='block font-medium'>Name:</label>
                              <input
                                type='text'
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className='mt-1 w-full border px-2 py-1 rounded text-xs'
                              />
                            </div>
                            <div>
                              <label className='block font-medium'>
                                Phone:
                              </label>
                              <input
                                type='text'
                                value={editingPhone}
                                onChange={(e) =>
                                  setEditingPhone(e.target.value)
                                }
                                className='mt-1 w-full border px-2 py-1 rounded text-xs'
                              />
                            </div>
                          </div>
                        ) : (
                          <div className='mt-2 text-xs'>
                            <p>
                              <span className='font-medium'>Name: </span>
                              {addr.authPersonName}
                            </p>
                            <p className='mt-1'>
                              <span className='font-medium'>Address: </span>
                              {addr.formatted}
                            </p>
                            <p className='mt-1'>
                              <span className='font-medium'>Phone: </span>
                              {addr.authPersonMobile}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className='border-t px-4 py-2 flex items-center justify-between text-xs'>
                  <button
                    className='text-blue-600 hover:underline'
                    onClick={startAddingNewAddress}
                  >
                    Add New Address
                  </button>
                  <div className='space-x-2'>
                    <Button
                      variant='outline'
                      className='text-xs px-3 py-1'
                      onClick={cancelAddressModal}
                    >
                      CANCEL
                    </Button>
                    <Button
                      className='text-xs px-3 py-1 bg-blue-600 text-white'
                      onClick={confirmModalSelection}
                    >
                      CONFIRM
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
