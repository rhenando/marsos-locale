// app/components/invoice/MobileInvoice.jsx

import React from "react";
import { QRCodeCanvas } from "qrcode.react";
import Currency from "@/components/global/CurrencySymbol";
import { Button } from "@/components/ui/button";

export default function MobileInvoice({
  supplier,
  buyer,
  items,
  totals,
  invoiceNumber,
  formattedDate,
  formattedTime,
  currentUrl,
  handleDownload,
  handlePrint,
}) {
  return (
    <div className='block md:hidden bg-white w-full max-w-md mx-auto min-h-screen p-2 text-xs'>
      {/* Header */}
      <div className='flex flex-col items-center border-b pb-3'>
        <img src='/logo.png' alt='Logo' className='h-12 mb-2' />
        <span className='font-bold text-lg'>Tax Invoice</span>
        <div className='grid grid-cols-2 gap-2 w-full mt-2 text-xs'>
          <div>
            <span className='block text-gray-500'>Date</span>
            <span>{formattedDate}</span>
          </div>
          <div>
            <span className='block text-gray-500'>Time</span>
            <span>{formattedTime}</span>
          </div>
          <div>
            <span className='block text-gray-500'>Invoice #</span>
            <span>{invoiceNumber}</span>
          </div>
          <div className='flex justify-end items-center'>
            <QRCodeCanvas value={currentUrl || ""} size={40} />
          </div>
        </div>
      </div>

      {/* Supplier & Buyer Cards */}
      <div className='flex flex-col gap-3 my-4'>
        <div className='border rounded p-3 bg-gray-50'>
          <div className='font-semibold text-gray-700 mb-1'>Supplier</div>
          <div>
            <span className='font-medium'>Name: </span>
            {supplier.companyName || supplier.authPersonName || "—"}
          </div>
          <div>
            <span className='font-medium'>Address: </span>
            {supplier.address || "—"}
          </div>
          <div>
            <span className='font-medium'>VAT No.: </span>
            {supplier.vatRegNumber || "—"}
          </div>
          <div>
            <span className='font-medium'>CR No.: </span>
            {supplier.commercialReg || "—"}
          </div>
        </div>
        <div className='border rounded p-3 bg-gray-50'>
          <div className='font-semibold text-gray-700 mb-1'>Buyer</div>
          <div>
            <span className='font-medium'>Name: </span>
            {buyer.companyName || buyer.authPersonName || buyer.email || "—"}
          </div>
          <div>
            <span className='font-medium'>Address: </span>
            {buyer.address || "—"}
          </div>
          <div>
            <span className='font-medium'>VAT No.: </span>
            {buyer.vatRegNumber || "—"}
          </div>
          <div>
            <span className='font-medium'>CR No.: </span>
            {buyer.commercialReg || "—"}
          </div>
        </div>
      </div>

      {/* Product List as Cards */}
      <div className='my-3'>
        <div className='font-semibold text-gray-700 mb-2'>Product Details</div>
        <div className='flex flex-col gap-2'>
          {items.map((i) => {
            const excl = i.quantity * i.price + (i.shippingCost || 0);
            const incl = excl + excl * 0.15;
            return (
              <div
                key={i.id}
                className='flex gap-2 border rounded p-2 items-center bg-gray-50'
              >
                <img
                  src={i.productImage || "/placeholder.png"}
                  alt={i.productName}
                  className='h-10 w-10 rounded object-cover flex-shrink-0'
                />
                <div className='flex-1'>
                  <div className='font-medium'>{i.productName}</div>
                  <div className='text-xs text-gray-700 flex flex-col gap-0.5'>
                    <span>
                      Unit: <Currency amount={i.price} />
                    </span>
                    <span>Qty: {i.quantity}</span>
                    <span>
                      Ship: <Currency amount={i.shippingCost || 0} />
                    </span>
                    <span>
                      Total Excl.: <Currency amount={excl} />
                    </span>
                    <span>Tax: 15%</span>
                    <span>
                      Total Incl.: <Currency amount={incl} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Totals */}
      <div className='border rounded p-3 bg-gray-50 my-4'>
        <div className='flex justify-between'>
          <span>Total:</span>
          <span>
            <Currency amount={totals.sub} />
          </span>
        </div>
        <div className='flex justify-between'>
          <span>VAT (15%):</span>
          <span>
            <Currency amount={totals.vat} />
          </span>
        </div>
        <div className='flex justify-between font-bold text-sm mt-1'>
          <span>Grand Total:</span>
          <span>
            <Currency amount={totals.grand} />
          </span>
        </div>
      </div>

      {/* Terms */}
      <div className='bg-gray-100 rounded p-3 mb-3 text-xs'>
        <div className='font-semibold mb-1'>Terms &amp; Conditions</div>
        <ul className='list-disc list-inside space-y-1'>
          <li>Payment due within 30 days from the invoice date.</li>
          <li>Goods remain the property of the supplier until paid in full.</li>
          <li>All disputes must be reported within 7 days of delivery.</li>
          <li>Late payment may incur a 5% monthly surcharge.</li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className='flex flex-col gap-2 mt-4 print:hidden'>
        <Button
          variant='outline'
          size='sm'
          className='w-full'
          onClick={handleDownload}
        >
          Download PDF
        </Button>
        <Button size='sm' className='w-full' onClick={handlePrint}>
          Print
        </Button>
      </div>
    </div>
  );
}
