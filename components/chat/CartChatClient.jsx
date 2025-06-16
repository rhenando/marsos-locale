"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import ChatMessages from "@/components/chat/ChatMessages";
import Currency from "@/components/global/CurrencySymbol";
import { db } from "@/firebase/config";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { useLocale, useTranslations } from "next-intl";

// Helper for multilingual fields
function getLocalized(field, locale = "en") {
  if (!field) return "";
  if (typeof field === "string") return field;
  if (typeof field === "object" && (field.en || field.ar)) {
    return field[locale] || field.en || "";
  }
  return JSON.stringify(field);
}

export default function CartChatClient({ chatId }) {
  const currentUser = useSelector((state) => state.auth.user);
  const locale = useLocale();
  const t = useTranslations("CartChat"); // Assuming messages/cartChat.json section

  const [chatMeta, setChatMeta] = useState(null);
  const [cartItems, setCartItems] = useState([]);

  // 1️⃣ load the chat metadata
  useEffect(() => {
    if (!chatId) return;
    getDoc(doc(db, "cartChats", chatId)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setChatMeta({
          ...data,
          createdAt: data.createdAt?.toDate()?.toISOString() || null,
        });
      }
    });
  }, [chatId]);

  // 2️⃣ subscribe to cart items for this buyer⇄supplier pair
  useEffect(() => {
    if (!chatMeta?.buyerId || !chatMeta?.supplierId) return;

    const q = query(
      collection(db, "carts", chatMeta.buyerId, "items"),
      where("supplierId", "==", chatMeta.supplierId)
    );

    const unsub = onSnapshot(q, (snap) => {
      setCartItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, [chatMeta?.buyerId, chatMeta?.supplierId]);

  // 3️⃣ field edits
  const handleChange = async (itemId, field, value) => {
    const parsed = ["quantity", "price", "shippingCost"].includes(field)
      ? parseFloat(value)
      : value;

    const item = cartItems.find((i) => i.id === itemId);
    if (!item) return;

    const updates = { [field]: parsed };

    if (field === "quantity" || field === "price") {
      const newQty = field === "quantity" ? parsed : item.quantity;
      const newPrice = field === "price" ? parsed : item.price;
      updates.subtotal = newQty * newPrice;
    }

    await updateDoc(
      doc(db, "carts", chatMeta.buyerId, "items", itemId),
      updates
    );
  };

  const isBuyer = currentUser?.uid === chatMeta?.buyerId;
  const isSupplier = currentUser?.uid === chatMeta?.supplierId;

  if (!chatMeta)
    return <div className='p-8 text-center text-gray-500'>{t("loading")}</div>;

  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-6 p-6 max-w-6xl mx-auto'>
      {/* ─── Negotiated Items ─── */}
      <div className='col-span-1 border rounded p-4 bg-white'>
        <h2 className='text-lg font-semibold mb-3 text-[#2c6449]'>
          {t("negotiatedItems")}
        </h2>
        {cartItems.length === 0 ? (
          <p className='text-sm text-red-500'>{t("noCartItemsFound")}</p>
        ) : (
          <div className='space-y-3 text-sm text-gray-800'>
            {cartItems.map((item) => (
              <div key={item.id} className='border-b pb-2'>
                <p className='font-medium'>
                  {getLocalized(item.productName, locale)}
                </p>

                <div className='flex items-center gap-2 mt-1'>
                  <span>{t("qty")}:</span>
                  {isBuyer ? (
                    <Input
                      type='number'
                      min={1}
                      className='w-16 h-7 text-sm'
                      value={item.quantity ?? 1}
                      onChange={(e) =>
                        handleChange(item.id, "quantity", e.target.value)
                      }
                    />
                  ) : (
                    <span>{item.quantity ?? 1}</span>
                  )}

                  <span>×</span>
                  {isSupplier ? (
                    <Input
                      type='number'
                      min={0.01}
                      step={0.01}
                      className='w-20 h-7 text-sm'
                      value={item.price ?? 0}
                      onChange={(e) =>
                        handleChange(item.id, "price", e.target.value)
                      }
                    />
                  ) : (
                    <Currency amount={item.price ?? 0} />
                  )}
                </div>

                <div className='flex items-center gap-2 mt-1'>
                  <span>{t("shipping")}:</span>
                  {isSupplier ? (
                    <Input
                      type='number'
                      min={0}
                      step={0.01}
                      className='w-24 h-7 text-sm'
                      value={item.shippingCost ?? 0}
                      onChange={(e) =>
                        handleChange(item.id, "shippingCost", e.target.value)
                      }
                    />
                  ) : (
                    <Currency amount={item.shippingCost ?? 0} />
                  )}
                </div>

                <p className='mt-1 text-xs text-gray-600'>
                  {t("size")}: {item.size || "—"} | {t("color")}:{" "}
                  {item.color || "—"} |{t("delivery")}:{" "}
                  {getLocalized(item.deliveryLocation, locale) || "—"}
                </p>

                <p className='text-sm font-bold text-[#2c6449]'>
                  {t("subtotal")}: <Currency amount={item.subtotal ?? 0} />
                </p>
              </div>
            ))}

            {/* Totals */}
            <div className='pt-4 mt-4 border-t space-y-1 text-sm font-medium'>
              {(() => {
                const subtotal = cartItems.reduce(
                  (acc, i) => acc + (i.subtotal || 0),
                  0
                );
                const shipping = cartItems.reduce(
                  (acc, i) => acc + (i.shippingCost || 0),
                  0
                );
                const vat = (subtotal + shipping) * 0.15;
                const total = subtotal + shipping + vat;

                return (
                  <>
                    <div className='flex justify-between'>
                      <span>{t("subtotal")}:</span>
                      <Currency amount={subtotal} />
                    </div>
                    <div className='flex justify-between'>
                      <span>{t("shipping")}:</span>
                      <Currency amount={shipping} />
                    </div>
                    <div className='flex justify-between'>
                      <span>{t("vat", { percent: 15 })}:</span>
                      <Currency amount={vat} />
                    </div>
                    <div className='flex justify-between text-[#2c6449] text-base font-bold pt-2 border-t'>
                      <span>{t("total")}:</span>
                      <Currency amount={total} />
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* ─── Chat Column ─── */}
      <div className='col-span-2 flex flex-col'>
        <h2 className='text-lg font-semibold mb-3 text-[#2c6449]'>
          {t("chatWith")} {isBuyer ? t("supplier") : t("buyer")}
        </h2>
        <div className='h-[480px] pb-2 border rounded-lg overflow-hidden'>
          <ChatMessages chatId={chatId} chatMeta={chatMeta} />
        </div>
      </div>
    </div>
  );
}
