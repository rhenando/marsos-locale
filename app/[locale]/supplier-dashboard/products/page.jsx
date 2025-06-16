"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useSelector } from "react-redux";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";

export default function ProductsPage() {
  const t = useTranslations("supplier-products");
  const lang = useLocale();
  const router = useRouter();
  const { user, loading } = useSelector((s) => s.auth);
  const role = user?.role;

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(["All"]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (loading || role !== "supplier") return;
    (async () => {
      const q = query(
        collection(db, "products"),
        where("supplierId", "==", user.uid)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setProducts(list);
      const cats = list.map((p) =>
        typeof p.category === "object"
          ? p.category[lang] || p.category.en || "Unknown"
          : p.category || "Unknown"
      );
      setCategories(["All", ...Array.from(new Set(cats))]);
    })();
  }, [loading, role, user, lang]);

  const handleDelete = async (id) => {
    if (!confirm(t("confirmDelete"))) return;
    await deleteDoc(doc(db, "products", id));
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const filtered =
    selectedCategory === "All"
      ? products
      : products.filter((p) => {
          const c =
            typeof p.category === "object"
              ? p.category[lang] || p.category.en
              : p.category;
          return c === selectedCategory;
        });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading)
    return (
      <div className='h-screen flex justify-center items-center'>
        <Loader2 className='w-6 h-6 animate-spin' />
      </div>
    );

  if (role !== "supplier")
    return <p className='p-4 text-sm'>{t("notAuthorized")}</p>;

  return (
    <div className='p-4 space-y-4'>
      {/* Header */}
      <div className='flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h2 className='text-lg font-semibold text-green-700'>{t("title")}</h2>
          <p className='text-xs text-muted-foreground'>{t("subtitle")}</p>
        </div>
        <Button
          size='sm'
          className='mt-2 sm:mt-0'
          onClick={() => router.push("/supplier-dashboard/add-products")}
        >
          <Plus className='w-4 h-4 mr-1' />
          {t("addNew")}
        </Button>
      </div>

      {/* Category Tabs */}
      <div className='flex gap-2 overflow-x-auto'>
        {categories.map((cat, i) => (
          <Button
            key={`cat-${i}`}
            size='sm'
            variant={cat === selectedCategory ? "default" : "outline"}
            onClick={() => {
              setSelectedCategory(cat);
              setCurrentPage(1);
            }}
            className='whitespace-nowrap'
          >
            {cat}
            <Badge className='ml-2 bg-muted text-xs text-foreground'>
              {cat === "All"
                ? products.length
                : products.filter((p) => {
                    const c =
                      typeof p.category === "object"
                        ? p.category[lang] || p.category.en
                        : p.category;
                    return c === cat;
                  }).length}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Filter bar */}
      <div className='flex flex-wrap gap-2'>
        <Select onValueChange={(v) => console.log(v)}>
          <SelectTrigger className='w-[140px] h-9 text-xs'>
            <SelectValue placeholder={t("sortBy")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='location'>{t("location")}</SelectItem>
            <SelectItem value='price'>{t("price")}</SelectItem>
            <SelectItem value='quantity'>{t("quantity")}</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder={t("searchPlaceholder")}
          className='max-w-xs h-9 text-xs'
        />
        <Button size='sm' variant='secondary'>
          {t("filter")}
        </Button>
        <Button size='sm'>{t("search")}</Button>
      </div>

      {/* Table */}
      <div className='overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow className='text-xs'>
              <TableHead></TableHead>
              <TableHead>{t("image")}</TableHead>
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("location")}</TableHead>
              <TableHead>Delivery Prices</TableHead>
              <TableHead>Price Tiers</TableHead>
              <TableHead>{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((p) => (
              <TableRow key={p.id} className='text-xs'>
                <TableCell>
                  <input type='checkbox' />
                </TableCell>
                <TableCell>
                  <img
                    src={p.mainImageUrl || "/placeholder.png"}
                    alt='Product'
                    className='w-8 h-8 rounded object-cover'
                  />
                </TableCell>
                <TableCell>
                  {typeof p.productName === "object"
                    ? p.productName[lang] || p.productName.en
                    : p.productName}
                </TableCell>
                <TableCell>{p.mainLocation || t("na")}</TableCell>
                <TableCell>
                  {p.priceRanges?.[0]?.locations?.length > 0 ? (
                    <ul className='pl-4 list-disc space-y-1'>
                      {p.priceRanges[0].locations.map((loc, i) => (
                        <li key={`loc-${i}`}>
                          {loc.location}: SAR {loc.locationPrice}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    t("na")
                  )}
                </TableCell>
                <TableCell>
                  {p.priceRanges?.length > 0 ? (
                    <ul className='pl-4 list-disc space-y-1'>
                      {p.priceRanges.map((r, i) => (
                        <li key={`tier-${i}`}>
                          {r.minQty}–{r.maxQty}: SAR {r.price}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    t("na")
                  )}
                </TableCell>
                <TableCell className='flex gap-1'>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() =>
                      router.push(
                        `/supplier-dashboard/products/${p.id}/edit-products`
                      )
                    }
                  >
                    <Pencil className='w-3 h-3 text-blue-600' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => handleDelete(p.id)}
                  >
                    <Trash2 className='w-3 h-3 text-red-600' />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className='flex justify-between items-center text-xs mt-2'>
        <Button
          size='sm'
          variant='outline'
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
        >
          {t("previous")}
        </Button>
        <span className='text-muted-foreground'>
          {t("page")} {currentPage} {t("of")} {totalPages}
        </span>
        <Button
          size='sm'
          variant='outline'
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
        >
          {t("next")}
        </Button>
      </div>
    </div>
  );
}
