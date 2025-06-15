"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config";
import ProductCard from "@/components/global/ProductCard";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import "keen-slider/keen-slider.min.css";
import { useKeenSlider } from "keen-slider/react";

const EMPTY_IMG = "/empty-box.svg";

const CategoriesAndProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [activeSubcategory, setActiveSubcategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [showTop, setShowTop] = useState(false);

  const router = useRouter();
  const t = useTranslations();

  // You can make this dynamic if you want RTL
  const locale = "en";

  // Keen Slider
  const [currentSlide, setCurrentSlide] = useState(0);
  const [sliderInstance, setSliderInstance] = useState(null);

  const [sliderRef] = useKeenSlider({
    slides: {
      perView: 5,
      spacing: 12,
    },
    breakpoints: {
      "(max-width: 1024px)": { slides: { perView: 4, spacing: 8 } },
      "(max-width: 768px)": { slides: { perView: 2.2, spacing: 8 } },
    },
    mode: "free-snap",
    slideChanged(s) {
      setCurrentSlide(s.track.details.rel);
    },
    created(s) {
      setSliderInstance(s);
    },
  });

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const productList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setProducts(productList);

        // Build unique categories from object
        const uniqueCategories = [
          ...new Set(
            productList.map((p) =>
              typeof p.category?.[locale] === "string"
                ? p.category[locale].trim()
                : ""
            )
          ),
        ]
          .filter(Boolean)
          .map((category) => ({
            name: category,
            image:
              productList.find(
                (p) =>
                  typeof p.category?.[locale] === "string" &&
                  p.category[locale].trim() === category
              )?.mainImageUrl || "https://via.placeholder.com/300",
          }));

        setCategories(uniqueCategories);

        if (uniqueCategories.length > 0) {
          setActiveCategory(uniqueCategories[0].name); // or pick random if you prefer
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    if (!activeCategory) {
      setSubcategories([]);
      setActiveSubcategory("");
    } else {
      const relatedProducts = products.filter(
        (p) =>
          typeof p.category?.[locale] === "string" &&
          p.category[locale].trim().toLowerCase() ===
            activeCategory.toLowerCase()
      );

      const uniqueSubcategories = [
        ...new Set(
          relatedProducts.map((p) =>
            typeof p.subCategory?.[locale] === "string"
              ? p.subCategory[locale].trim()
              : "Other"
          )
        ),
      ];

      setSubcategories(uniqueSubcategories);
      setActiveSubcategory(
        uniqueSubcategories.length > 0 ? uniqueSubcategories[0] : "Other"
      );
    }
  }, [activeCategory, products]);

  const filteredProducts = products.filter((p) => {
    const categoryMatch =
      typeof p.category?.[locale] === "string" &&
      p.category[locale].trim().toLowerCase() === activeCategory.toLowerCase();

    const subcategoryValue =
      typeof p.subCategory?.[locale] === "string"
        ? p.subCategory[locale].trim().toLowerCase()
        : "other";
    const activeSubcategoryValue = (activeSubcategory || "Other")
      .toLowerCase()
      .trim();

    const subCategoryMatch =
      !activeSubcategory || subcategoryValue === activeSubcategoryValue;
    return categoryMatch && subCategoryMatch;
  });

  return (
    <div className='w-full px-4 md:px-8 py-6 mx-auto max-w-screen-xl'>
      {/* Banner/Hero Section */}
      <div className='w-full bg-[#f6faf8] rounded-lg mb-6 p-6 flex flex-col md:flex-row items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-[#2c6449]'>
            {t("categories.welcome", {
              defaultValue: "Welcome to Our Product Catalog",
            })}
          </h1>
          <p className='text-gray-600 mt-2'>
            {t("categories.subtitle", {
              defaultValue:
                "Browse by category, filter by subcategory, and discover our best products.",
            })}
          </p>
        </div>
      </div>

      {/* Keen Slider Category Carousel */}
      {categories.length > 0 && (
        <div className='relative w-full mb-8'>
          {/* Left Arrow */}
          <button
            onClick={() => sliderInstance && sliderInstance.prev()}
            className='absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-300 p-1 rounded-full shadow hover:bg-gray-100 disabled:opacity-40'
            aria-label='Scroll Left'
            disabled={!sliderInstance || currentSlide === 0}
            type='button'
          >
            <svg
              className='w-5 h-5 text-gray-600'
              fill='none'
              stroke='currentColor'
              strokeWidth={2}
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M15 19l-7-7 7-7'
              />
            </svg>
          </button>

          {/* Category Slides */}
          <div ref={sliderRef} className='keen-slider px-10 md:px-20'>
            {categories.map((category, index) => {
              const isActive =
                activeCategory?.toLowerCase().trim() ===
                category.name?.toLowerCase().trim();
              return (
                <div
                  key={index}
                  className={`keen-slider__slide flex-none w-32 sm:w-36 rounded-lg overflow-hidden border transition shadow-sm hover:shadow-md cursor-pointer group focus:ring-2 focus:ring-[#2c6449] outline-none ${
                    isActive ? "ring-2 ring-[#2c6449]" : ""
                  }`}
                  tabIndex={0}
                  role='button'
                  aria-label={category.name}
                  onClick={() => setActiveCategory(category.name?.trim())}
                  onKeyDown={(e) => {
                    if (e.key === "Enter")
                      setActiveCategory(category.name?.trim());
                  }}
                >
                  <div className='relative h-24 sm:h-28 w-full group'>
                    <img
                      src={category.image}
                      alt={category.name}
                      className='w-full h-full object-cover transition-transform group-hover:scale-105 group-hover:brightness-90'
                    />
                    <div className='absolute bottom-0 w-full bg-black/60 text-white text-xs font-medium text-center py-1 truncate'>
                      {category.name}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Right Arrow */}
          <button
            onClick={() => sliderInstance && sliderInstance.next()}
            className='absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-300 p-1 rounded-full shadow hover:bg-gray-100 disabled:opacity-40'
            aria-label='Scroll Right'
            disabled={
              !sliderInstance ||
              currentSlide >=
                categories.length -
                  (sliderInstance?.options.slides?.perView || 5)
            }
            type='button'
          >
            <svg
              className='w-5 h-5 text-gray-600'
              fill='none'
              stroke='currentColor'
              strokeWidth={2}
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M9 5l7 7-7 7'
              />
            </svg>
          </button>
        </div>
      )}

      {/* Subcategory Row as Horizontal Scroll (Mobile/All) */}
      {activeCategory && subcategories.length > 0 && (
        <div className='my-6'>
          <div className='flex flex-col md:flex-row justify-between items-center gap-4'>
            <h5 className='text-gray-600'>
              {t("categories.products", {
                count: filteredProducts.length,
                defaultValue: "{{count}} products found",
              })}
            </h5>
            <div className='flex overflow-x-auto gap-2'>
              {subcategories.map((sub) => (
                <button
                  key={sub}
                  onClick={() => setActiveSubcategory(sub)}
                  className={`px-4 py-2 text-sm font-medium rounded whitespace-nowrap transition ${
                    activeSubcategory.toLowerCase().trim() ===
                    sub.toLowerCase().trim()
                      ? "bg-[#2c6449] text-white"
                      : "border border-[#2c6449] text-[#2c6449] hover:bg-[#2c6449] hover:text-white"
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Product Grid with Loading Skeletons and Empty State */}
      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mt-6'>
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className='bg-gray-200 animate-pulse h-56 rounded' />
          ))
        ) : filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={() => router.push(`/product/${product.id}`)}
              locale={
                typeof window !== "undefined" ? navigator.language : "en-US"
              }
              currencySymbol='SR'
            />
          ))
        ) : (
          <div className='flex flex-col items-center col-span-full py-10'>
            <img src={EMPTY_IMG} alt='No products' className='w-24 mb-2' />
            <p className='text-gray-500'>
              {t("categories.no_products_found", {
                defaultValue: "No products found in this category.",
              })}
            </p>
          </div>
        )}
      </div>

      {/* Floating "Back to Top" Button */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className='fixed bottom-8 right-8 bg-[#2c6449] text-white rounded-full p-3 shadow-lg z-50'
          aria-label={t("common.back_to_top", {
            defaultValue: "Back to top",
          })}
        >
          ↑
        </button>
      )}
    </div>
  );
};

export default CategoriesAndProductsPage;
