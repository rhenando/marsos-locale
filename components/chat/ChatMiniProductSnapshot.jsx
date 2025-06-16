"use client";

import React from "react";
import Currency from "@/components/global/CurrencySymbol";

// Helper function to safely get the right localized string
function getLocalized(field, locale) {
  if (!field) return "";
  if (typeof field === "string") return field;
  if (typeof field === "object" && (field.ar || field.en)) {
    return field[locale] || field.en || "";
  }
  return JSON.stringify(field); // Fallback for unknown structure
}

export default function ChatMiniProductSnapshot({ data, locale }) {
  return (
    <div className='space-y-2'>
      {/* Main Image */}
      <img
        src={data.mainImageUrl}
        alt={getLocalized(data.name || data.productName, locale)}
        className='w-full h-40 object-contain rounded border'
      />

      {/* Product Name */}
      <h3 className='font-semibold'>
        {getLocalized(data.name || data.productName, locale)}
      </h3>

      {/* Category */}
      <p className='text-sm text-gray-600'>
        {getLocalized(data.category, locale)}
      </p>

      {/* Price Ranges */}
      {data.priceRanges?.map((r, i) => (
        <div key={i} className='flex justify-between text-sm'>
          <span>
            {r.minQty}
            {r.maxQty ? `–${r.maxQty}` : "+"} pcs
          </span>
          {r.price && <Currency amount={Number(r.price)} />}
        </div>
      ))}

      {/* Supplier */}
      <p className='text-xs text-gray-500'>Supplier: {data.supplierName}</p>
    </div>
  );
}
