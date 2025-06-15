"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";

import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandGroup,
} from "../ui/command";

import { db } from "../../firebase/config";
import { getDocs, collection } from "firebase/firestore";

// Use Lucide React for icons
import { Search } from "lucide-react";

const rtlLocales = ["ar", "he", "fa", "ur"]; // Expand as needed

const ProductSearch = () => {
  const [productQuery, setProductQuery] = useState("");
  const [productOptions, setProductOptions] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [mounted, setMounted] = useState(false);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const inputWrapperRef = useRef();
  const inputRef = useRef();

  const t = useTranslations("sticky-search");
  const locale = useLocale();
  const isRtl = rtlLocales.includes(locale);
  const dir = isRtl ? "rtl" : "ltr";
  const router = useRouter();

  const normalize = (str) => {
    if (typeof str !== "string") return "";
    return str.toLowerCase().normalize("NFKD");
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      const snapshot = await getDocs(collection(db, "products"));
      const items = snapshot.docs.map((doc) => {
        const data = doc.data();
        const name =
          data.productName ||
          data.productName_en ||
          data.productName_ar ||
          "Unnamed Product";
        const thumbnail = data.mainImageUrl || "/placeholder-product.png";
        return {
          id: doc.id,
          name: typeof name === "string" ? name : String(name),
          thumbnail,
        };
      });
      setProductOptions(items);
      setFilteredProducts(items);
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (!productQuery) {
      setFilteredProducts(productOptions);
    } else {
      setFilteredProducts(
        productOptions.filter((item) =>
          normalize(item.name).includes(normalize(productQuery))
        )
      );
    }
  }, [productQuery, productOptions]);

  useEffect(() => {
    if (dropdownOpen && inputWrapperRef.current) {
      const rect = inputWrapperRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: "fixed",
        left: rect.left + window.scrollX,
        top: rect.bottom + window.scrollY,
        width: rect.width,
        zIndex: 9999,
        direction: dir,
      });
    }
  }, [dropdownOpen, dir, mounted]);

  useEffect(() => {
    if (!dropdownOpen) return;

    const handleClick = (e) => {
      if (
        inputWrapperRef.current &&
        !inputWrapperRef.current.contains(e.target) &&
        !document.querySelector("#search-dropdown-portal")?.contains(e.target)
      ) {
        setDropdownOpen(false);
      }
    };

    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  const handleSelect = (selectedValue) => {
    setDropdownOpen(false);
    const selectedProduct = productOptions.find(
      (item) => item.name.toLowerCase() === selectedValue.toLowerCase()
    );
    if (selectedProduct?.id) {
      router.push(`/product/${selectedProduct.id}`);
    }
  };

  const handleSearch = () => {
    setDropdownOpen(false);
    if (productQuery.trim()) {
      const selectedProduct = productOptions.find((item) =>
        normalize(item.name).includes(normalize(productQuery.trim()))
      );
      if (selectedProduct?.id) {
        router.push(`/product/${selectedProduct.id}`);
      } else {
        router.push(`/search?query=${encodeURIComponent(productQuery.trim())}`);
      }
    }
  };

  const handleInputFocus = () => {
    if (productQuery.trim()) setDropdownOpen(true);
  };
  const handleInputChange = (e) => {
    setProductQuery(e.target.value);
    if (e.target.value.trim()) setDropdownOpen(true);
    else setDropdownOpen(false);
  };

  return (
    <div dir={dir} className='relative w-full'>
      <div
        ref={inputWrapperRef}
        className={`flex items-center w-full border rounded-full overflow-hidden shadow-sm
                    h-12 sm:h-10 bg-white`}
      >
        <div
          className={`px-2 sm:px-3 text-gray-600 text-xs sm:text-sm flex-shrink-0
                      flex items-center gap-1 h-full 
                      ${isRtl ? "border-l" : "border-r"}`}
        >
          {t("products")}
        </div>
        <input
          ref={inputRef}
          dir={dir}
          type='text'
          placeholder={t("search_placeholder")}
          value={productQuery}
          onFocus={handleInputFocus}
          onChange={handleInputChange}
          className={`flex-1 px-2 sm:px-4 text-xs sm:text-sm h-full focus:outline-none
                      ${isRtl ? "text-right" : "text-left"}`}
        />
        <button
          onClick={handleSearch}
          className={`bg-primary hover:bg-green-700 text-white text-xs sm:text-sm
                      px-3 sm:px-4 flex items-center gap-1 h-full 
                      ${isRtl ? "rounded-l-full" : "rounded-r-full"}`}
        >
          <Search size={16} />
        </button>
      </div>

      {/* Dropdown results via Portal */}
      {mounted &&
        productQuery &&
        dropdownOpen &&
        createPortal(
          <div id='search-dropdown-portal' style={dropdownStyle}>
            <Command className='w-full bg-white border border-gray-200 shadow-md rounded-lg overflow-hidden'>
              <CommandInput
                value={productQuery}
                onValueChange={setProductQuery}
                placeholder={t("search_placeholder")}
                className='hidden'
              />
              <CommandList className='max-h-64 sm:max-h-[400px] overflow-y-auto'>
                {filteredProducts.length > 0 ? (
                  <CommandGroup heading={t("productsHeading")}>
                    {filteredProducts.map((product) => (
                      <CommandItem
                        key={product.id}
                        value={product.name}
                        onSelect={handleSelect}
                        className={`flex items-center ${
                          isRtl ? "flex-row-reverse" : "flex-row"
                        } gap-2 sm:gap-4 px-3 sm:px-4 py-2 sm:py-3 cursor-pointer hover:bg-[#2c6449]/10 transition`}
                      >
                        <img
                          src={product.thumbnail}
                          alt={product.name}
                          className='w-10 h-10 sm:w-12 sm:h-12 rounded object-cover flex-shrink-0'
                        />
                        <span className='text-xs sm:text-base text-gray-700 truncate'>
                          {product.name}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ) : (
                  <div className='flex flex-col items-center justify-center p-4 sm:p-6 gap-1 sm:gap-2 text-center'>
                    <img
                      src='/no-results-search.svg'
                      alt='No results'
                      className='w-16 h-16 sm:w-24 sm:h-24 object-contain'
                    />
                    <p className='text-gray-500 text-xs sm:text-sm'>
                      {t("noResults")}
                    </p>
                  </div>
                )}
              </CommandList>
            </Command>
          </div>,
          document.body
        )}
    </div>
  );
};

export default ProductSearch;
