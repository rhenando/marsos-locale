"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, getDocs, collection, addDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { toast } from "sonner";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CreatableSelect } from "@/components/ui/creatable-select";
import {
  defaultLocationOptions,
  defaultSizeOptions,
  defaultColorOptions,
  defaultQuantityOptions,
} from "@/lib/productOptions";

import { useSelector } from "react-redux";
import useProductValidation from "@/hooks/useProductValidation";
import { useRouter } from "next/navigation";

import { generateSlug, ensureUniqueSlug } from "@/utils/slugify";

export default function UploadProductForm() {
  const { user: currentUser } = useSelector((state) => state.auth);
  const router = useRouter();
  const { validateProduct } = useProductValidation();

  // categories & subcategories
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [categoryOptionsAr, setCategoryOptionsAr] = useState([]);
  const [subCategoryMap, setSubCategoryMap] = useState({});
  const [subCategoryMapAr, setSubCategoryMapAr] = useState({});

  // basic fields
  const [productNameEn, setProductNameEn] = useState("");
  const [productDescriptionEn, setProductDescriptionEn] = useState("");
  const [productNameAr, setProductNameAr] = useState("");
  const [productDescriptionAr, setProductDescriptionAr] = useState("");

  // images
  const [mainImageFile, setMainImageFile] = useState(null);
  const [mainImagePreview, setMainImagePreview] = useState(null);
  const [additionalImages, setAdditionalImages] = useState([
    { id: Date.now() },
  ]);
  const [additionalImageFiles, setAdditionalImageFiles] = useState({});
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState({});

  // attributes
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);

  const [selectedMainLocation, setSelectedMainLocation] = useState(null);

  // category selectors
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [selectedCategoryAr, setSelectedCategoryAr] = useState(null);
  const [selectedSubCategoryAr, setSelectedSubCategoryAr] = useState(null);

  // price tiers
  const [priceTiers, setPriceTiers] = useState([
    {
      id: Date.now(),
      minQty: null,
      maxQty: null,
      price: null,
      deliveryLocations: [{ id: Date.now() + 1, location: null, price: null }],
    },
  ]);

  // submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  // — fetch categories & subcategories —
  useEffect(() => {
    async function fetchCategories() {
      const snap = await getDocs(collection(db, "products"));
      const enCats = new Set();
      const arCats = new Set();
      const subMap = new Map();

      snap.forEach((doc) => {
        const d = doc.data();
        if (d.category?.en && d.category?.ar) {
          enCats.add(
            JSON.stringify({ label: d.category.en, value: d.category.en })
          );
          arCats.add(
            JSON.stringify({ label: d.category.ar, value: d.category.en })
          );
        }
        if (d.category?.en && d.subCategory?.en && d.subCategory?.ar) {
          const key = d.category.en;
          if (!subMap.has(key)) subMap.set(key, []);
          const arr = subMap.get(key);
          if (!arr.some((s) => s.value === d.subCategory.en)) {
            arr.push({
              labelEn: d.subCategory.en,
              labelAr: d.subCategory.ar,
              value: d.subCategory.en,
            });
          }
        }
      });

      // build option arrays & maps
      const enOpts = Array.from(enCats).map((s) => JSON.parse(s));
      const arOpts = Array.from(arCats).map((s) => JSON.parse(s));
      const enSub = {},
        arSub = {};
      subMap.forEach((subs, key) => {
        enSub[key] = subs.map((s) => ({ label: s.labelEn, value: s.value }));
        arSub[key] = subs.map((s) => ({ label: s.labelAr, value: s.value }));
      });

      setCategoryOptions(enOpts);
      setCategoryOptionsAr(arOpts);
      setSubCategoryMap(enSub);
      setSubCategoryMapAr(arSub);
    }
    fetchCategories();
  }, []);

  // — image upload helper —
  const uploadImageToStorage = async (file, path) => {
    const storage = getStorage();
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  // — slug helpers will run in handleSubmit —

  // — variant option creator —
  const handleCreateVariantOption = (newOpt) => {
    if (
      variantOptions.some((o) => o.value.toLowerCase() === newOpt.toLowerCase())
    ) {
      toast("Variant exists", { icon: "⚠️" });
      return null;
    }
    const o = { value: newOpt, label: newOpt };
    setVariantOptions((p) => [...p, o]);
    toast.success("Variant added");
    return o;
  };

  // — additional images handlers —
  const handleAddImage = () => {
    if (additionalImages.length < 3) {
      setAdditionalImages((prev) => [...prev, { id: Date.now() }]);
      toast.success("Additional image field added");
    } else {
      toast.error("Up to 3 additional images only");
    }
  };
  const handleRemoveImage = (id) => {
    setAdditionalImages((prev) => prev.filter((img) => img.id !== id));
    setAdditionalImageFiles((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    setAdditionalImagePreviews((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    toast.info("Image removed");
  };

  // — price tiers handlers —
  const handleAddPriceTier = () => {
    setPriceTiers((prev) => [
      ...prev,
      {
        id: Date.now(),
        minQty: null,
        maxQty: null,
        price: null,
        deliveryLocations: [
          { id: Date.now() + 1, location: null, price: null },
        ],
      },
    ]);
    toast.success("Price tier added");
  };
  const handleRemovePriceTier = (id) => {
    setPriceTiers((prev) => prev.filter((tier) => tier.id !== id));
    toast.info("Price tier removed");
  };
  const handleTierFieldChange = (tierId, field, value) => {
    setPriceTiers((prev) =>
      prev.map((t) => (t.id === tierId ? { ...t, [field]: value } : t))
    );
  };
  const handleAddLocation = (tierId) => {
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
    toast.success("Delivery location added");
  };
  const handleRemoveLocation = (tierId, locId) => {
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
    toast.info("Delivery location removed");
  };
  const handleLocationFieldChange = (tierId, locId, field, value) => {
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

  // — form submit —
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    // validation
    const isValid = validateProduct({
      productNameEn,
      productNameAr,
      productDescriptionEn,
      productDescriptionAr,
      selectedCategory,
      selectedSubCategory,
      mainImageFile,
      priceTiers,
    });
    if (!isValid) return;

    const toastId = toast.loading("Uploading product...");
    setIsSubmitting(true);

    try {
      // upload main image
      const timestamp = Date.now();
      const mainImageUrl = await uploadImageToStorage(
        mainImageFile,
        `products/${timestamp}_main.jpg`
      );

      // upload additional
      const additionalUrls = await Promise.all(
        additionalImages.map((img, idx) =>
          additionalImageFiles[img.id]
            ? uploadImageToStorage(
                additionalImageFiles[img.id],
                `products/${timestamp}_add_${idx}.jpg`
              )
            : Promise.resolve(null)
        )
      ).then((urls) => urls.filter((u) => u));

      // slugs
      const enSlug = await ensureUniqueSlug(generateSlug(productNameEn));
      const arSlug = await ensureUniqueSlug(generateSlug(productNameAr));

      // supplier info
      let supplierName = "unknown",
        supplierNumber = "N/A";
      if (currentUser?.uid) {
        const supSnap = await getDoc(doc(db, "users", currentUser.uid));
        if (supSnap.exists()) {
          const sup = supSnap.data();
          supplierName =
            sup.displayName ||
            sup.companyName ||
            sup.companyNameAr ||
            supplierName;
          supplierNumber = sup.phone || sup.companyPhone || supplierNumber;
        }
      }

      // assemble
      const productData = {
        productName: { en: productNameEn, ar: productNameAr },
        slug: { en: enSlug, ar: arSlug },
        description: { en: productDescriptionEn, ar: productDescriptionAr },
        category: {
          en: selectedCategory?.value || "",
          ar: selectedCategoryAr?.label || "",
        },
        subCategory: {
          en: selectedSubCategory?.value || "",
          ar: selectedSubCategoryAr?.label || "",
        },
        mainImageUrl,
        additionalImageUrls: additionalUrls,
        sizes: selectedSizes.map((s) => s.value),
        colors: selectedColors.map((c) => c.value),

        mainLocation: selectedMainLocation?.value || "",
        supplierId: currentUser?.uid,
        supplierName,
        supplierNumber,
        priceRanges: priceTiers.map((tier) => ({
          minQty: tier.minQty?.value || "",
          maxQty: tier.maxQty?.value || "",
          price: tier.price?.value || "",
          locations: tier.deliveryLocations.map((loc) => ({
            location: loc.location?.value || "",
            locationPrice:
              loc.price?.value === "Unlimited"
                ? "Unlimited"
                : parseFloat(loc.price?.value || "0"),
          })),
        })),
        createdAt: new Date(),
      };

      // write
      await addDoc(collection(db, "products"), productData);

      toast.dismiss(toastId);
      toast.success("Product uploaded successfully!");
      router.push("/supplier-dashboard/products");
    } catch (err) {
      toast.dismiss(toastId);
      toast.error("Upload failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className='space-y-6 p-6 max-w-screen-lg mx-auto'
    >
      {/* Basic Info */}
      <div className='space-y-4'>
        <h2 className='text-xl font-semibold'>Basic Info</h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <Input
            placeholder='Product Name (English)'
            value={productNameEn}
            onChange={(e) => setProductNameEn(e.target.value)}
          />
          <Input
            placeholder='Product Description (English)'
            value={productDescriptionEn}
            onChange={(e) => setProductDescriptionEn(e.target.value)}
          />
          <Input
            placeholder='اسم المنتج (Arabic)'
            value={productNameAr}
            onChange={(e) => setProductNameAr(e.target.value)}
          />
          <Input
            placeholder='وصف المنتج (Arabic)'
            value={productDescriptionAr}
            onChange={(e) => setProductDescriptionAr(e.target.value)}
          />
        </div>
      </div>

      {/* Category */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {/* English */}
        <div className='space-y-2'>
          <h3 className='font-medium'>Category (EN)</h3>

          <CreatableSelect
            placeholder='Select or create category'
            options={categoryOptions}
            value={selectedCategory}
            onChange={(opt) => {
              setSelectedCategory(opt);
              const match = categoryOptionsAr.find(
                (c) => c.value === opt.value
              );
              if (match) setSelectedCategoryAr(match);
              setSelectedSubCategory(null);
              setSelectedSubCategoryAr(null);
            }}
          />
          {!selectedCategory && (
            <p className='text-sm text-red-400'>
              Please select a category first.
            </p>
          )}

          <CreatableSelect
            isDisabled={!selectedCategory}
            placeholder='Select or create subcategory'
            options={subCategoryMap[selectedCategory?.value] || []}
            value={selectedSubCategory}
            onChange={(opt) => {
              setSelectedSubCategory(opt);
              const match = subCategoryMapAr[selectedCategory.value]?.find(
                (c) => c.value === opt.value
              );
              if (match) setSelectedSubCategoryAr(match);
            }}
          />
        </div>

        {/* Arabic */}
        <div className='space-y-2 text-right'>
          <h3 className='font-medium'>الفئة (AR)</h3>

          <CreatableSelect
            placeholder='اختر أو أنشئ فئة'
            options={categoryOptionsAr}
            value={selectedCategoryAr}
            onChange={(opt) => {
              setSelectedCategoryAr(opt);
              const match = categoryOptions.find((c) => c.value === opt.value);
              if (match) setSelectedCategory(match);
              setSelectedSubCategory(null);
              setSelectedSubCategoryAr(null);
            }}
          />
          {!selectedCategoryAr && (
            <p className='text-sm text-red-400'>يرجى اختيار الفئة أولاً.</p>
          )}

          <CreatableSelect
            isDisabled={!selectedCategoryAr}
            placeholder='اختر أو أنشئ فئة فرعية'
            options={subCategoryMapAr[selectedCategoryAr?.value] || []}
            value={selectedSubCategoryAr}
            onChange={(opt) => {
              setSelectedSubCategoryAr(opt);
              const match = subCategoryMap[selectedCategoryAr.value]?.find(
                (c) => c.value === opt.value
              );
              if (match) setSelectedSubCategory(match);
            }}
          />
        </div>
      </div>

      {/* Images */}
      <div className='space-y-4'>
        <h2 className='text-xl font-semibold'>Product Images</h2>
        <div className='flex flex-col md:flex-row gap-4'>
          {/* Main */}
          <div className='w-full md:w-1/3'>
            <Label>Main Image</Label>
            <Input
              type='file'
              accept='image/*'
              onChange={(e) => {
                const f = e.target.files[0];
                if (!f) return;
                setMainImageFile(f);
                const reader = new FileReader();
                reader.onloadend = () => {
                  setMainImagePreview(reader.result);
                  toast.success("Main image selected");
                };
                reader.readAsDataURL(f);
              }}
              className='file:... '
            />
            {mainImagePreview && (
              <img
                src={mainImagePreview}
                className='mt-2 w-32 h-32 object-cover rounded'
              />
            )}
          </div>

          {/* Additional */}
          <div className='flex-1'>
            <Label>Additional Images</Label>
            {additionalImages.map((img) => (
              <div key={img.id} className='flex items-center gap-2 mb-2'>
                <Input
                  type='file'
                  accept='image/*'
                  onChange={(e) => {
                    const f = e.target.files[0];
                    if (!f) return;
                    setAdditionalImageFiles((p) => ({ ...p, [img.id]: f }));
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setAdditionalImagePreviews((p) => ({
                        ...p,
                        [img.id]: reader.result,
                      }));
                    };
                    reader.readAsDataURL(f);
                  }}
                />
                {additionalImagePreviews[img.id] && (
                  <img
                    src={additionalImagePreviews[img.id]}
                    className='w-16 h-16 object-cover rounded'
                  />
                )}
                <Button
                  variant='ghost'
                  onClick={() => handleRemoveImage(img.id)}
                >
                  Remove
                </Button>
              </div>
            ))}
            {additionalImages.length < 3 && (
              <Button variant='link' onClick={handleAddImage}>
                + Add Image
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Attributes */}
      <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4'>
        {/* Colors */}
        <div>
          <Label>Colors</Label>
          <CreatableSelect
            isMulti
            options={defaultColorOptions}
            value={selectedColors}
            onChange={setSelectedColors}
          />
        </div>
        {/* Sizes */}
        <div>
          <Label>Sizes</Label>
          <CreatableSelect
            isMulti
            options={defaultSizeOptions}
            value={selectedSizes}
            onChange={setSelectedSizes}
          />
        </div>

        {/* Main Location */}
        <div>
          <Label>Main Location</Label>
          <CreatableSelect
            options={defaultLocationOptions}
            value={selectedMainLocation}
            onChange={setSelectedMainLocation}
          />
        </div>
      </div>

      {/* Pricing Tiers */}
      <div className='border p-4 rounded space-y-6'>
        {priceTiers.map((tier) => (
          <div key={tier.id} className='space-y-4 border-b pb-4'>
            <div className='flex justify-between items-center'>
              <h3 className='font-medium'>Price Tier</h3>
              <Button
                variant='ghost'
                onClick={() => handleRemovePriceTier(tier.id)}
              >
                Remove
              </Button>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
              <CreatableSelect
                placeholder='Min Qty'
                options={defaultQuantityOptions}
                value={tier.minQty}
                onChange={(opt) =>
                  handleTierFieldChange(tier.id, "minQty", opt)
                }
              />
              <CreatableSelect
                placeholder='Max Qty'
                options={defaultQuantityOptions}
                value={tier.maxQty}
                onChange={(opt) =>
                  handleTierFieldChange(tier.id, "maxQty", opt)
                }
              />
              <CreatableSelect
                placeholder='Price'
                options={defaultQuantityOptions}
                value={tier.price}
                onChange={(opt) => handleTierFieldChange(tier.id, "price", opt)}
              />
            </div>
            <div>
              <Label>Delivery Locations</Label>
              {tier.deliveryLocations.map((loc) => (
                <div key={loc.id} className='flex items-center gap-2 my-2'>
                  <CreatableSelect
                    options={defaultLocationOptions}
                    value={loc.location}
                    onChange={(opt) =>
                      handleLocationFieldChange(
                        tier.id,
                        loc.id,
                        "location",
                        opt
                      )
                    }
                  />
                  <CreatableSelect
                    placeholder='Price'
                    options={defaultQuantityOptions}
                    value={loc.price}
                    onChange={(opt) =>
                      handleLocationFieldChange(tier.id, loc.id, "price", opt)
                    }
                  />
                  <Button
                    variant='ghost'
                    onClick={() => handleRemoveLocation(tier.id, loc.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button variant='link' onClick={() => handleAddLocation(tier.id)}>
                + Add Location
              </Button>
            </div>
          </div>
        ))}
        <Button variant='outline' onClick={handleAddPriceTier}>
          + Add Price Tier
        </Button>
      </div>

      {/* Submit */}
      <div className='sticky bottom-0 bg-white py-4'>
        <Button type='submit' className='w-full' disabled={isSubmitting}>
          {isSubmitting ? "Uploading..." : "Upload Product"}
        </Button>
      </div>
    </form>
  );
}
