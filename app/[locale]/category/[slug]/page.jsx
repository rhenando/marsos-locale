"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { db } from "@/firebase/config";
import { collection, getDocs } from "firebase/firestore";
import ProductCard from "@/components/global/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";

const slugify = (text) =>
  text
    ?.toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function CategoryPage() {
  const params = useParams();
  const rawSlug = params?.slug ? decodeURIComponent(params.slug) : "";

  const { t, i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState("");

  const locale = mounted ? i18n.language : "en";
  const currencySymbol = locale === "ar" ? "ر.س." : "SR ";

  const formatNumber = (number) =>
    new Intl.NumberFormat(locale, { minimumFractionDigits: 2 }).format(number);

  const getLocalizedText = (value) => {
    if (typeof value === "object" && value !== null) {
      return value[locale] || value.en || value.ar || "";
    }
    return typeof value === "string" ? value : "";
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!rawSlug || !mounted) return;

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(collection(db, "products"));
        const allProducts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const matchedProducts = allProducts.filter((p) => {
          const cat = p.category;
          if (!cat || typeof cat !== "object") return false;

          const enSlug = slugify(cat.en || "");
          const arSlug = slugify(cat.ar || "");

          return slugify(rawSlug) === enSlug || slugify(rawSlug) === arSlug;
        });

        if (matchedProducts.length > 0) {
          const first = matchedProducts[0];
          setCategoryName(getLocalizedText(first.category));
        } else {
          setCategoryName(rawSlug.replace(/-/g, " "));
        }

        setProducts(matchedProducts);
      } catch (error) {
        console.error("🔥 Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [rawSlug, mounted, locale]);

  if (!mounted) {
    return (
      <div className='container mx-auto px-4 py-6'>
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'>
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className='h-48 w-full rounded-md' />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-6'>
      <h2 className='text-center text-2xl font-semibold text-[#2c6449] mb-6'>
        {categoryName} {t("category.category")}
      </h2>

      {loading ? (
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'>
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className='h-48 w-full rounded-md' />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              locale={locale}
              currencySymbol={currencySymbol}
              formatNumber={formatNumber}
            />
          ))}
        </div>
      ) : (
        <p className='text-center text-gray-500'>
          {t("category.noProductsFound")}
        </p>
      )}
    </div>
  );
}
