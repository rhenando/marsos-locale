"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { db } from "@/firebase/config";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SupplierHeader from "./SupplierHeader";
import SupplierProfile from "./SupplierProfile";
import ProductCard from "@/components/global/ProductCard";
import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";

// Helper: always return a localized string from string or object
function getLocalized(val, locale, fallback = "") {
  if (!val) return fallback;
  if (typeof val === "object")
    return val[locale] || Object.values(val)[0] || fallback;
  return val;
}

export default function SupplierProductsPage() {
  const { supplierId } = useParams();
  const t = useTranslations("supplierProductsPage");
  const locale = useLocale();
  const currentLang = locale.startsWith("ar") ? "ar" : "en";

  const [sliderRef] = useKeenSlider({ loop: true, slides: { perView: 1 } });
  const [supplierData, setSupplierData] = useState(null);
  const [productData, setProductData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Fetch supplier
  useEffect(() => {
    if (!supplierId) return;
    (async () => {
      const snap = await getDoc(doc(db, "users", supplierId));
      setSupplierData(snap.exists() ? { id: snap.id, ...snap.data() } : {});
    })();
  }, [supplierId]);

  // Fetch products
  useEffect(() => {
    if (!supplierId) return;
    (async () => {
      const q = query(
        collection(db, "products"),
        where("supplierId", "==", supplierId)
      );
      const snap = await getDocs(q);
      const prods = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setProductData(prods);

      // Normalize all categories to localized string for uniqueness
      const categoryNames = [
        t("all"),
        ...Array.from(
          new Set(
            prods.map((p) =>
              getLocalized(p.category, locale, t("uncategorized"))
            )
          )
        ),
      ];
      setCategories(categoryNames);
    })();
  }, [supplierId, t, locale]);

  // Localize supplier fields
  const localizedSupplier = useMemo(() => {
    if (!supplierData) return null;
    const result = { ...supplierData };
    Object.keys(supplierData)
      .filter((k) => k.endsWith("Ar"))
      .forEach((arKey) => {
        const baseKey = arKey.slice(0, -2);
        if (currentLang === "ar" && supplierData[arKey] != null) {
          result[baseKey] = supplierData[arKey];
        }
      });
    return result;
  }, [supplierData, currentLang]);

  if (supplierData === null || !localizedSupplier) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        {t("loading")}
      </div>
    );
  }

  const slides =
    Array.isArray(supplierData.carouselImages) &&
    supplierData.carouselImages.length > 0
      ? supplierData.carouselImages
      : [supplierData.logoUrl || "/logo.png"];

  const filtered = productData.filter((p) => {
    let name = getLocalized(
      p.productName,
      currentLang,
      typeof p.productName === "string"
        ? p.productName
        : Object.values(p.productName || {})[0] || ""
    );
    return name.toLowerCase().includes(searchQuery.trim().toLowerCase());
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className='max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8'>
      <SupplierHeader supplier={localizedSupplier} />

      <Tabs defaultValue='products' className='space-y-4'>
        <TabsList className='flex flex-col sm:flex-row'>
          <TabsTrigger value='products' className='flex-1 text-center'>
            {t("products")}
          </TabsTrigger>
          <TabsTrigger value='profile' className='flex-1 text-center'>
            {t("profile")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value='products' className='space-y-8'>
          {/* Carousel */}
          <div
            ref={sliderRef}
            className='keen-slider h-48 sm:h-64 md:h-96 w-full rounded overflow-hidden mb-6'
          >
            {slides.map((url, idx) => (
              <div
                key={idx}
                className='keen-slider__slide bg-center bg-cover'
                style={{ backgroundImage: `url(${url})` }}
              />
            ))}
          </div>

          {/* Supplier Profile */}
          <SupplierProfile supplier={localizedSupplier} />

          {/* Content */}
          <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
            {/* Sidebar on desktop */}
            <aside className='hidden lg:block space-y-6'>
              <Card>
                <CardHeader>
                  <CardTitle>{t("productGroups")}</CardTitle>
                </CardHeader>
                <CardContent className='space-y-2'>
                  {categories.map((cat, idx) => (
                    <a
                      key={cat + "-" + idx}
                      href='#'
                      className='flex justify-between hover:text-[#2c6449]'
                    >
                      <span>{cat}</span>
                      <span className='text-gray-500'>
                        {cat === t("all")
                          ? productData.length
                          : productData.filter(
                              (p) =>
                                getLocalized(
                                  p.category,
                                  locale,
                                  t("uncategorized")
                                ) === cat
                            ).length}
                      </span>
                    </a>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>{t("contactSupplier")}</CardTitle>
                </CardHeader>
                <CardContent className='space-y-2'>
                  <p className='text-sm'>{localizedSupplier.companyName}</p>
                  <Button className='w-full' size='sm' variant='outline'>
                    {t("chat")}
                  </Button>
                  <Input
                    as='textarea'
                    placeholder={t("messagePlaceholder")}
                    className='h-24 resize-none'
                  />
                  <Button className='w-full'>{t("send")}</Button>
                </CardContent>
              </Card>
            </aside>

            {/* Products grid */}
            <main className='col-span-1 lg:col-span-3 space-y-6'>
              <div className='flex justify-center sm:justify-start mb-4'>
                <Input
                  type='text'
                  placeholder={t("placeholder")}
                  className='w-full sm:w-72'
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'>
                {paginated.map((prod) => (
                  <div key={prod.id} className='relative'>
                    {prod.hasVideo && (
                      <span className='absolute top-2 left-2 bg-black text-white text-xs px-2 py-0.5 rounded'>
                        {t("video")}
                      </span>
                    )}
                    <ProductCard
                      product={prod}
                      locale={currentLang}
                      currencySymbol='SAR'
                    />
                  </div>
                ))}
              </div>
              <div className='flex flex-col sm:flex-row items-center justify-between mt-6 space-y-2 sm:space-y-0'>
                <Button
                  variant='outline'
                  onClick={() => setCurrentPage((c) => Math.max(1, c - 1))}
                  disabled={currentPage === 1}
                >
                  {t("previous")}
                </Button>
                <span className='text-sm'>
                  {t("pageInfo", {
                    current: currentPage,
                    total: totalPages,
                  })}
                </span>
                <Button
                  variant='outline'
                  onClick={() =>
                    setCurrentPage((c) => Math.min(totalPages, c + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  {t("next")}
                </Button>
              </div>
            </main>
          </div>
        </TabsContent>

        <TabsContent value='profile'>
          <SupplierProfile supplier={localizedSupplier} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
