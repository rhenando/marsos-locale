"use client";

import { useEffect, useState, useCallback } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config";
import ProductCard from "@/components/global/ProductCard";

const TrendingProductsSectionAr = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [activeTab, setActiveTab] = useState("trending");
  const [error, setError] = useState(null);

  const locale = "ar-SA";
  const currencySymbol = "ر.س";

  const formatNumber = useCallback(
    (number) =>
      new Intl.NumberFormat(locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(number),
    [locale]
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snapshot = await getDocs(collection(db, "products"));
        const fetched = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setAllProducts(fetched);
        setError(null);
      } catch (err) {
        console.error("حدث خطأ أثناء تحميل المنتجات:", err);
        setError("حدث خطأ أثناء تحميل المنتجات. حاول مرة أخرى لاحقًا.");
      }
    };

    fetchData();
  }, []);

  const getTrendingProducts = useCallback(() => {
    const shuffled = [...allProducts].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 8);
  }, [allProducts]);

  return (
    <section className='bg-gray-50 py-10' dir='rtl'>
      <div className='w-[90%] mx-auto'>
        {/* Tabs */}
        <div className='flex flex-wrap gap-3 mb-8 justify-end'>
          <button
            onClick={() => setActiveTab("trending")}
            className={`px-5 py-2 text-sm rounded-md font-semibold transition ${
              activeTab === "trending"
                ? "bg-[#2c6449] text-white"
                : "bg-white border border-gray-300 text-[#2c6449]"
            }`}
          >
            الأكثر رواجًا
          </button>

          <button
            onClick={() => setActiveTab("all")}
            className={`px-5 py-2 text-sm rounded-md font-semibold transition ${
              activeTab === "all"
                ? "bg-[#2c6449] text-white"
                : "bg-white border border-gray-300 text-[#2c6449]"
            }`}
          >
            كل المنتجات
          </button>
        </div>

        {/* Content */}
        {error ? (
          <div className='text-center text-red-600'>{error}</div>
        ) : (
          <div
            className='
              grid
              grid-cols-2
              sm:grid-cols-2
              md:grid-cols-3
              lg:grid-cols-4
              gap-6
            '
          >
            {(activeTab === "trending"
              ? getTrendingProducts()
              : allProducts
            ).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                locale={locale}
                currencySymbol={currencySymbol}
                formatNumber={formatNumber}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default TrendingProductsSectionAr;
