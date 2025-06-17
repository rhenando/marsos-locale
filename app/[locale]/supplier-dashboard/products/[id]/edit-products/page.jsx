"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/firebase/config";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import CreatableSelect from "react-select/creatable";
import {
  defaultLocationOptions,
  defaultSizeOptions,
  defaultColorOptions,
  defaultQuantityOptions,
} from "@/lib/productOptions";
import { useTranslations, useLocale } from "next-intl";

// --- Helper: Always get a localized string from a value or object ---
function getLocalized(val, locale) {
  if (!val) return "";
  if (typeof val === "object")
    return val[locale] || Object.values(val)[0] || "";
  return val;
}

export default function UploadProductForm() {
  const t = useTranslations("productEdit");
  const locale = useLocale();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Basic Info
  const [nameEn, setNameEn] = useState("");
  const [descEn, setDescEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [descAr, setDescAr] = useState("");

  // Select Data
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [subCategoryMap, setSubCategoryMap] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [mainLocation, setMainLocation] = useState(null);
  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]);

  const [mainImageUrl, setMainImageUrl] = useState("");
  const [additionalImageUrls, setAdditionalImageUrls] = useState([]);
  const [priceTiers, setPriceTiers] = useState([]);

  // Helper to make options
  const makeSelectOption = (v) => ({
    label: getLocalized(v, locale),
    value: getLocalized(v, locale),
    raw: v,
  });

  // Fetch categories/subcategories as string options (always locale-safe)
  useEffect(() => {
    const fetchCategories = async () => {
      const snap = await getDocs(collection(db, "products"));
      const map = {};
      snap.forEach((docSnap) => {
        const { category, subCategory } = docSnap.data();
        const cat = getLocalized(category, locale);
        if (!cat) return;
        if (!map[cat]) map[cat] = new Set();
        if (subCategory) map[cat].add(getLocalized(subCategory, locale));
      });

      setCategoryOptions(
        Object.keys(map).map((cat) => ({
          label: cat,
          value: cat,
        }))
      );

      const subMap = {};
      for (const cat in map) {
        subMap[cat] = [...map[cat]].map((sub) => ({
          label: sub,
          value: sub,
        }));
      }
      setSubCategoryMap(subMap);
    };
    fetchCategories();
  }, [locale]);

  // Fetch product for edit
  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      const snap = await getDoc(doc(db, "products", id));
      if (!snap.exists()) return;
      const data = snap.data();

      setNameEn(data.productName?.en || "");
      setDescEn(data.description?.en || "");
      setNameAr(data.productName?.ar || "");
      setDescAr(data.description?.ar || "");

      setSelectedCategory(
        data.category ? makeSelectOption(data.category) : null
      );
      setSelectedSubCategory(
        data.subCategory ? makeSelectOption(data.subCategory) : null
      );
      setMainLocation(
        data.mainLocation ? makeSelectOption(data.mainLocation) : null
      );
      setSizes(
        Array.isArray(data.sizes) ? data.sizes.map(makeSelectOption) : []
      );
      setColors(
        Array.isArray(data.colors) ? data.colors.map(makeSelectOption) : []
      );
      setMainImageUrl(data.mainImageUrl || "");
      setAdditionalImageUrls(data.additionalImageUrls || []);

      // Parse priceTiers to use only string select values
      const fetched = data.priceRanges || [];
      setPriceTiers(
        fetched.map((r, tierIdx) => ({
          id: tierIdx,
          minQty: defaultQuantityOptions.find(
            (o) => o.value === String(r.minQty)
          ) || { label: String(r.minQty), value: String(r.minQty) },
          maxQty: defaultQuantityOptions.find(
            (o) => o.value === String(r.maxQty)
          ) || { label: String(r.maxQty), value: String(r.maxQty) },
          price: defaultQuantityOptions.find(
            (o) => o.value === String(r.price)
          ) || { label: String(r.price), value: String(r.price) },
          deliveryLocations: (r.locations || []).map((loc, locIdx) => ({
            id: locIdx,
            location: defaultLocationOptions.find(
              (o) => o.value === getLocalized(loc.location, locale)
            ) || {
              label: getLocalized(loc.location, locale),
              value: getLocalized(loc.location, locale),
            },
            price: defaultQuantityOptions.find(
              (o) => o.value === String(loc.locationPrice)
            ) || {
              label: String(loc.locationPrice),
              value: String(loc.locationPrice),
            },
          })),
        }))
      );
      setLoading(false);
    };
    fetchProduct();
  }, [id, locale]);

  if (loading) {
    return <p className='p-6 text-center'>{t("loading")}</p>;
  }

  // --- Handlers ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    toast.loading(t("saving"), { id: "save" });

    const updated = {
      productName: { en: nameEn, ar: nameAr },
      description: { en: descEn, ar: descAr },
      category: selectedCategory?.raw || selectedCategory?.value || "",
      subCategory: selectedSubCategory?.raw || selectedSubCategory?.value || "",
      mainLocation: mainLocation?.raw || mainLocation?.value || "",
      sizes: sizes.map((o) => o.raw || o.value),
      colors: colors.map((o) => o.raw || o.value),
      mainImageUrl,
      additionalImageUrls,
      priceRanges: priceTiers.map((tier) => ({
        minQty: tier.minQty?.value || "",
        maxQty: tier.maxQty?.value || "",
        price: tier.price?.value || "",
        locations: tier.deliveryLocations.map((loc) => ({
          location: loc.location?.value || "",
          locationPrice: loc.price?.value || "",
        })),
      })),
      updatedAt: new Date(),
    };

    try {
      await updateDoc(doc(db, "products", id), updated);
      toast.success(t("saveSuccess"), { id: "save" });
      setSaving(false);
    } catch (err) {
      toast.error(t("saveError"), { id: "save" });
      setSaving(false);
    }
  };

  // PriceTier helpers
  const addTier = () => {
    setPriceTiers((prev) => [
      ...prev,
      {
        id: Date.now(),
        minQty: null,
        maxQty: null,
        price: null,
        deliveryLocations: [],
      },
    ]);
  };

  const removeTier = (tierId) => {
    setPriceTiers((prev) => prev.filter((t) => t.id !== tierId));
  };

  const updateTier = (tierId, field, value) => {
    setPriceTiers((prev) =>
      prev.map((t) => (t.id === tierId ? { ...t, [field]: value } : t))
    );
  };

  const addLocation = (tierId) => {
    setPriceTiers((prev) =>
      prev.map((t) =>
        t.id === tierId
          ? {
              ...t,
              deliveryLocations: [
                ...t.deliveryLocations,
                { id: Date.now(), location: null, price: null },
              ],
            }
          : t
      )
    );
  };

  const removeLocation = (tierId, locId) => {
    setPriceTiers((prev) =>
      prev.map((t) =>
        t.id === tierId
          ? {
              ...t,
              deliveryLocations: t.deliveryLocations.filter(
                (l) => l.id !== locId
              ),
            }
          : t
      )
    );
  };

  const updateLocation = (tierId, locId, field, value) => {
    setPriceTiers((prev) =>
      prev.map((t) =>
        t.id === tierId
          ? {
              ...t,
              deliveryLocations: t.deliveryLocations.map((l) =>
                l.id === locId ? { ...l, [field]: value } : l
              ),
            }
          : t
      )
    );
  };

  // ----- Render -----
  return (
    <form
      onSubmit={handleSubmit}
      className='space-y-6 p-4 md:p-6 max-w-screen-lg mx-auto'
    >
      {/* Basic Info */}
      <div className='space-y-4'>
        <h2 className='text-lg md:text-xl font-semibold'>{t("basicInfo")}</h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <Input
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            placeholder='Product Name (English)'
          />
          <Input
            value={descEn}
            onChange={(e) => setDescEn(e.target.value)}
            placeholder='Product Description (English)'
          />
          <Input
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
            placeholder='اسم المنتج (عربي)'
            dir='rtl'
          />
          <Input
            value={descAr}
            onChange={(e) => setDescAr(e.target.value)}
            placeholder='وصف المنتج (عربي)'
            dir='rtl'
          />
        </div>
      </div>

      {/* Product Details */}
      <div className='space-y-4'>
        <h2 className='text-lg md:text-xl font-semibold'>
          {t("productDetails")}
        </h2>
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'>
          {/* Category */}
          <CreatableSelect
            placeholder={t("categoryPlaceholder")}
            options={categoryOptions}
            value={selectedCategory}
            onChange={(opt) => {
              setSelectedCategory(opt);
              setSelectedSubCategory(null);
            }}
            onCreateOption={(input) => {
              const opt = { label: input, value: input };
              setCategoryOptions((prev) => [...prev, opt]);
              setSelectedCategory(opt);
            }}
          />

          {/* Sub-category */}
          <CreatableSelect
            placeholder={t("subCategoryPlaceholder")}
            options={
              selectedCategory
                ? subCategoryMap[selectedCategory.value] || []
                : []
            }
            value={selectedSubCategory}
            onChange={setSelectedSubCategory}
            isDisabled={!selectedCategory}
            onCreateOption={(input) => {
              const opt = { label: input, value: input };
              setSubCategoryMap((prev) => ({
                ...prev,
                [selectedCategory.value]: [
                  ...(prev[selectedCategory.value] || []),
                  opt,
                ],
              }));
              setSelectedSubCategory(opt);
            }}
          />

          {/* Main Location */}
          <CreatableSelect
            placeholder={t("mainLocationPlaceholder")}
            options={defaultLocationOptions}
            value={mainLocation}
            onChange={setMainLocation}
            onCreateOption={(input) => {
              const opt = { label: input, value: input };
              setMainLocation(opt);
            }}
          />

          {/* Sizes */}
          <CreatableSelect
            placeholder={t("sizePlaceholder")}
            isMulti
            options={defaultSizeOptions}
            value={sizes}
            onChange={setSizes}
            onCreateOption={(input) => {
              const opt = { label: input, value: input };
              setSizes((prev) => [...prev, opt]);
            }}
          />

          {/* Colors */}
          <CreatableSelect
            placeholder={t("colorPlaceholder")}
            isMulti
            options={defaultColorOptions}
            value={colors}
            onChange={setColors}
            onCreateOption={(input) => {
              const opt = { label: input, value: input };
              setColors((prev) => [...prev, opt]);
            }}
          />
        </div>
      </div>

      {/* Images */}
      <div className='space-y-2'>
        <h2 className='text-lg md:text-xl font-semibold'>
          {t("productImages")}
        </h2>
        <div className='flex flex-col gap-4 md:flex-row md:items-start'>
          {/* Main Image */}
          <div className='flex flex-col gap-1 w-full md:w-1/3'>
            <Label className='text-sm'>{t("mainImage")}</Label>
            {mainImageUrl && (
              <img
                src={mainImageUrl}
                alt='Main Preview'
                className='mb-2 w-32 h-32 object-cover rounded border'
              />
            )}
            <Input
              type='file'
              accept='image/*'
              className='file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-green-600'
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onloadend = () => setMainImageUrl(reader.result);
                reader.readAsDataURL(file);
              }}
            />
          </div>
          {/* Additional Images */}
          <div className='flex-1 flex flex-col gap-2'>
            <Label className='text-sm'>{t("additionalImages")}</Label>
            {additionalImageUrls.map((url, idx) => (
              <div key={idx} className='flex items-center gap-2'>
                <img
                  src={url}
                  alt={`Additional ${idx}`}
                  className='w-16 h-16 object-cover rounded border'
                />
                <Button
                  variant='ghost'
                  className='text-red-600'
                  type='button'
                  onClick={() =>
                    setAdditionalImageUrls((prev) =>
                      prev.filter((_, i) => i !== idx)
                    )
                  }
                >
                  {t("remove")}
                </Button>
              </div>
            ))}
            <div className='flex items-center gap-2'>
              <Input
                type='file'
                accept='image/*'
                className='file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-green-600'
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onloadend = () =>
                    setAdditionalImageUrls((prev) => [...prev, reader.result]);
                  reader.readAsDataURL(file);
                }}
              />
            </div>
            <Button variant='link' size='sm'>
              + {t("addAdditionalImage")}
            </Button>
            <p className='text-xs text-muted-foreground'>
              {t("additionalImagesHelp")}
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Tiers */}
      <div className='border p-4 rounded-md space-y-4'>
        {priceTiers.map((tier) => (
          <div key={tier.id} className='space-y-4 border-b pb-4'>
            <div className='flex justify-between items-center'>
              <h3 className='text-base font-medium'>{t("priceTier")}</h3>
              <Button
                variant='ghost'
                className='text-red-600'
                onClick={() => removeTier(tier.id)}
              >
                {t("removeTier")}
              </Button>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
              <CreatableSelect
                placeholder={t("minQty")}
                options={defaultQuantityOptions}
                value={tier.minQty}
                onChange={(opt) => updateTier(tier.id, "minQty", opt)}
              />
              <CreatableSelect
                placeholder={t("maxQty")}
                options={defaultQuantityOptions}
                value={tier.maxQty}
                onChange={(opt) => updateTier(tier.id, "maxQty", opt)}
              />
              <CreatableSelect
                placeholder={t("price")}
                options={defaultQuantityOptions}
                value={tier.price}
                onChange={(opt) => updateTier(tier.id, "price", opt)}
              />
            </div>
            <div>
              <Label>{t("deliveryLocations")}</Label>
              {tier.deliveryLocations.map((loc) => (
                <div
                  key={loc.id}
                  className='flex flex-col sm:flex-row sm:items-center gap-2 my-2'
                >
                  <div className='w-full sm:w-1/2 md:w-1/3'>
                    <CreatableSelect
                      placeholder={t("locationPlaceholder")}
                      options={defaultLocationOptions}
                      value={loc.location}
                      onChange={(opt) =>
                        updateLocation(tier.id, loc.id, "location", opt)
                      }
                    />
                  </div>
                  <div className='w-36'>
                    <CreatableSelect
                      placeholder={t("price")}
                      options={defaultQuantityOptions}
                      value={loc.price}
                      onChange={(opt) =>
                        updateLocation(tier.id, loc.id, "price", opt)
                      }
                    />
                  </div>
                  <Button
                    variant='ghost'
                    className='text-red-600'
                    onClick={() => removeLocation(tier.id, loc.id)}
                  >
                    {t("removeLocation")}
                  </Button>
                </div>
              ))}
              <Button variant='link' onClick={() => addLocation(tier.id)}>
                + {t("addLocation")}
              </Button>
            </div>
          </div>
        ))}
        <Button variant='outline' onClick={addTier}>
          + {t("addTier")}
        </Button>
      </div>

      {/* Submit Button */}
      <div className='sticky bottom-0 bg-white py-4 px-4 md:px-0'>
        <Button type='submit' disabled={saving} className='w-full'>
          {saving ? t("saving") : t("saveChanges")}
        </Button>
      </div>
    </form>
  );
}
