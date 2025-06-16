"use client";

import React, { useState, useEffect } from "react";
import {
  doc,
  updateDoc,
  serverTimestamp,
  collection,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { useTranslations, useLocale } from "next-intl";
import Currency from "@/components/global/CurrencySymbol";
import { toast } from "sonner";

// Helper: safely get localized value from {en, ar} or just string
function getLocalized(field, locale) {
  if (!field) return "";
  if (typeof field === "string") return field;
  if (typeof field === "object" && (field.ar || field.en)) {
    return field[locale] || field.en || "";
  }
  return "";
}

export default function MiniProductDetails({
  data,
  chatMeta,
  currentUser,
  chatId,
}) {
  const t = useTranslations("miniProduct");
  const locale = useLocale();

  // All hooks must be unconditional and always at the top
  const [editable, setEditable] = useState(data || {});
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState(data?.colors?.[0] || "");
  const [selectedSize, setSelectedSize] = useState(data?.sizes?.[0] || "");
  const [selectedLocation, setSelectedLocation] = useState(
    data?.priceRanges?.[0]?.locations?.[0]?.location || ""
  );
  const [orderPlaced, setOrderPlaced] = useState(false);

  useEffect(() => {
    if (data) {
      setEditable(data);
      setSelectedColor(data?.colors?.[0] || "");
      setSelectedSize(data?.sizes?.[0] || "");
      setSelectedLocation(
        data?.priceRanges?.[0]?.locations?.[0]?.location || ""
      );
    }
  }, [data]);

  const isSupplier = !!chatMeta && currentUser?.uid === chatMeta?.supplierId;

  // Firestore updater helper
  const handleUpdate = async (path, value) => {
    const ref = doc(db, "miniProductsData", chatId);
    await updateDoc(ref, { [path]: value, lastEditedAt: serverTimestamp() });
    setEditable((cur) => {
      const copy = { ...cur };
      const parts = path.split(".");
      if (parts[0] === "priceRanges") {
        const idx = +parts[1];
        if (parts[2] === "price") copy.priceRanges[idx].price = value;
        else if (parts[2] === "locations")
          copy.priceRanges[idx].locations = value;
      }
      return copy;
    });
  };

  // Add to Cart & delete snapshot
  const handleAddToCart = async () => {
    if (!currentUser?.uid) {
      toast.error(t("pleaseLogin"));
      return;
    }
    const tier0 = editable.priceRanges?.[0] || { price: "0", locations: [] };
    const unitPrice = parseFloat(tier0.price) || 0;
    const shipLoc =
      (tier0.locations || []).find((l) => l.location === selectedLocation) ||
      {};
    const shippingCost = parseFloat(shipLoc.locationPrice) || 0;
    const subtotal = quantity * unitPrice;

    let localizedProductName = getLocalized(editable.productName, locale);

    try {
      await addDoc(collection(db, "carts", currentUser.uid, "items"), {
        buyerId: currentUser.uid,
        productId: editable.id,
        productName: localizedProductName,
        productImage: editable.mainImageUrl,
        quantity,
        color: selectedColor,
        size: selectedSize,
        deliveryLocation: selectedLocation,
        price: unitPrice,
        shippingCost,
        subtotal,
        currency: editable.currency || "SAR",
        supplierId: editable.supplierId,
        supplierName: editable.supplierName,
        createdAt: serverTimestamp(),
      });

      // remove the mini‐snapshot
      await deleteDoc(doc(db, "miniProductsData", chatId));

      setOrderPlaced(true);
      toast.success(t("added_to_cart"));
    } catch (err) {
      console.error(err);
      toast.error(t("addToCartFailed"));
    }
  };

  // EARLY RETURN (after all hooks): no data
  if (!data) {
    return <p className='text-center text-gray-500'>{t("noDetails")}</p>;
  }

  // After ordering, show thank‐you
  if (orderPlaced) {
    return <div className='text-center text-gray-700'>{t("orderAdded")}</div>;
  }

  // Derive display (all safe after hooks and null-guards)
  const name = getLocalized(editable.productName, locale);
  const category =
    getLocalized(editable.category, locale) ||
    getLocalized(editable.Category, locale) ||
    "";
  const subCategory =
    getLocalized(editable.subCategory, locale) ||
    getLocalized(editable.subcategory, locale) ||
    "";

  const tier0 = editable.priceRanges?.[0] || { price: "0", locations: [] };
  const unitPrice = parseFloat(tier0.price) || 0;
  const shipTier =
    (tier0.locations || []).find((l) => l.location === selectedLocation) || {};
  const shippingCost = parseFloat(shipTier.locationPrice) || 0;
  const subtotal = quantity * unitPrice;

  return (
    <div className='space-y-6'>
      {/* Title & Images */}
      <h2 className='text-lg font-semibold'>{name}</h2>
      <div className='flex space-x-4'>
        <img
          src={editable.mainImageUrl}
          alt={name}
          className='w-1/4 rounded object-contain'
        />
        <div className='flex space-x-2 overflow-x-auto'>
          {(editable.additionalImageUrls || []).map((url, i) => (
            <img
              key={i}
              src={url}
              className='w-16 h-16 rounded object-contain'
              alt=''
            />
          ))}
        </div>
      </div>

      <div className='text-sm text-gray-700 flex flex-col gap-1'>
        <span>
          <b>{t("category_label")}:</b> {category}
        </span>
        <span>
          <b>{t("sub_category_label")}:</b> {subCategory}
        </span>
      </div>

      {/* Selectors */}
      <div className='flex gap-4'>
        <select
          value={selectedColor}
          onChange={(e) => setSelectedColor(e.target.value)}
        >
          {(editable.colors || []).map((c, i) => (
            <option key={i} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={selectedSize}
          onChange={(e) => setSelectedSize(e.target.value)}
        >
          {(editable.sizes || []).map((s, i) => (
            <option key={i} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
        >
          {(tier0.locations || []).map((l, i) => (
            <option key={i} value={l.location}>
              {l.location}
            </option>
          ))}
        </select>
      </div>

      {/* Summary */}
      <div className='space-y-4'>
        <div className='flex items-center gap-2 text-sm'>
          <span className='font-medium'>{t("qty")}</span>
          <input
            type='number'
            min='1'
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
            className='w-16 border rounded px-2 py-1 text-sm'
          />
          <span>×</span>
          <span className='font-medium'>{t("price")}</span>
          {isSupplier ? (
            <input
              type='number'
              value={unitPrice}
              onChange={(e) =>
                handleUpdate("priceRanges.0.price", e.target.value)
              }
              className='w-20 border rounded px-2 py-1 text-sm'
            />
          ) : (
            <Currency amount={unitPrice} />
          )}
        </div>

        <div className='flex justify-between items-center text-sm'>
          <p>
            <span className='font-medium'>{t("subtotal")}</span>{" "}
            <Currency amount={subtotal} />
          </p>
          <p className='flex items-center gap-2'>
            <span className='font-medium'>{t("shipping")}</span>
            {isSupplier ? (
              <input
                type='number'
                value={shippingCost}
                onChange={(e) => {
                  const newLocs = [...(tier0.locations || [])];
                  const idx = newLocs.findIndex(
                    (l) => l.location === selectedLocation
                  );
                  if (idx >= 0) newLocs[idx].locationPrice = e.target.value;
                  handleUpdate("priceRanges.0.locations", newLocs);
                }}
                className='w-20 border rounded px-2 py-1 text-sm'
              />
            ) : (
              <Currency amount={shippingCost} />
            )}
          </p>
        </div>
      </div>

      {/* Buttons */}
      <div className='flex gap-4'>
        <button
          onClick={handleAddToCart}
          className='bg-primary text-white px-4 py-2 rounded hover:bg-green-700'
        >
          {t("addToCart")}
        </button>
        <button className='border border-gray-300 px-4 py-2 rounded hover:bg-gray-100'>
          {t("reviewOrder")}
        </button>
      </div>
    </div>
  );
}
