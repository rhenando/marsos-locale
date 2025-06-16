"use client";

import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { useSelector } from "react-redux";
import { db } from "@/firebase/config";
import ChatMessages from "@/components/chat/ChatMessages";
import { useTranslations, useLocale } from "next-intl";

export default function RfqChatClient({ chatId }) {
  const currentUser = useSelector((state) => state.auth.user);
  const t = useTranslations("rfqChat");
  const locale = useLocale();

  const [chatMeta, setChatMeta] = useState(null);
  const [rfqList, setRfqList] = useState([]);

  // 1️⃣ Load chat metadata
  useEffect(() => {
    if (!chatId) return;
    getDoc(doc(db, "rfqChats", chatId)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setChatMeta({
          ...data,
          createdAt: data.createdAt?.toDate?.().toISOString() || null,
        });
      }
    });
  }, [chatId]);

  // 2️⃣ Subscribe to all RFQs matching buyerId & supplierId
  useEffect(() => {
    if (!chatMeta?.buyerId || !chatMeta?.supplierId) return;

    const q = query(
      collection(db, "rfqs"),
      where("buyerId", "==", chatMeta.buyerId),
      where("supplierId", "==", chatMeta.supplierId)
    );

    const unsub = onSnapshot(q, (snap) => {
      setRfqList(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            timestamp: data.timestamp?.toDate?.().toISOString() || "",
          };
        })
      );
    });

    return () => unsub();
  }, [chatMeta]);

  if (!chatMeta) return null;

  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-6 p-6 max-w-6xl mx-auto'>
      {/* RFQ Details Pane */}
      <aside className='col-span-1 border rounded p-4 bg-white space-y-4'>
        <h2 className='text-lg font-semibold text-[#2c6449]'>
          {t("rfq_details")}
        </h2>
        {rfqList.length === 0 ? (
          <p className='text-sm text-red-500'>{t("no_records")}</p>
        ) : (
          rfqList.map((item) => (
            <div key={item.id} className='border-b pb-2'>
              <p>
                <strong>{t("details")}:</strong> {item.productDetails}
              </p>
              <p>
                <strong>{t("category")}:</strong>{" "}
                {typeof item.category === "object"
                  ? item.category[locale] || item.category.en
                  : item.category}
              </p>
              <p>
                <strong>{t("subcategory")}:</strong>{" "}
                {typeof item.subcategory === "object"
                  ? item.subcategory[locale] || item.subcategory.en
                  : item.subcategory}
              </p>
              <p>
                <strong>{t("size")}:</strong> {item.size}
              </p>
              <p>
                <strong>{t("color")}:</strong> {item.color}
              </p>
              <p>
                <strong>{t("shipping_to")}:</strong> {item.shipping}
              </p>
              {item.fileURL && (
                <p>
                  <a
                    href={item.fileURL}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-blue-600 underline text-sm'
                  >
                    {t("download_attachment")}
                  </a>
                </p>
              )}
              <p className='text-xs text-gray-500'>
                {t("sent")}: {new Date(item.timestamp).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </aside>

      {/* Chat Pane */}
      <section className='col-span-2 flex flex-col'>
        <h2 className='text-lg font-semibold mb-3 text-[#2c6449]'>
          {t("chat_with_supplier")}
        </h2>
        <div className='h-[480px] pb-2 border rounded-lg overflow-hidden'>
          <ChatMessages chatId={chatId} chatMeta={chatMeta} />
        </div>
      </section>
    </div>
  );
}
