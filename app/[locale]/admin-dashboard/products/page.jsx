"use client";

import React, { useState, useEffect } from "react";
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
import { Plus, Pencil, Trash2, Download } from "lucide-react";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { db } from "@/firebase/config";
import { useSelector } from "react-redux";
import * as XLSX from "xlsx";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const showSuccess = (msg) => toast.success(msg);
const showError = (msg) => toast.error(msg);

export default function Products() {
  const router = useRouter();
  const { i18n, t } = useTranslation();
  const { user, loading: authLoading } = useSelector((state) => state.auth);
  const role = user?.role;
  const hasRole = (r) => role === r;

  const [productData, setProductData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedTab, setSelectedTab] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [filterType, setFilterType] = useState("manual");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!authLoading && !hasRole("admin")) {
      router.replace("/admin-login");
    }
  }, [authLoading, role, router]);

  useEffect(() => {
    if (authLoading || !hasRole("admin")) return;

    const fetchProducts = async () => {
      try {
        const snap = await getDocs(collection(db, "products"));
        const prods = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setProductData(prods);

        const lang = i18n.language;

        setCategories([
          "All",
          ...new Set(
            prods.map((p) => {
              if (typeof p.category === "string") return p.category;
              if (typeof p.category === "object")
                return p.category[lang] || p.category.en || "Uncategorized";
              return "Uncategorized";
            })
          ),
        ]);
      } catch (err) {
        console.error(err);
        showError(t("admin_products.failed_to_load"));
      }
    };

    fetchProducts();
  }, [authLoading, role, t, i18n.language]);

  const handleDelete = async (id) => {
    if (!confirm(t("admin_products.confirm_delete"))) return;
    try {
      await deleteDoc(doc(db, "products", id));
      setProductData((prev) => prev.filter((p) => p.id !== id));
      showSuccess(t("admin_products.deleted_success"));
    } catch {
      showError(t("admin_products.delete_failed"));
    }
  };

  const resetSearch = async () => {
    setSearchTerm("");
    setFilterType("manual");
    setSelectedTab("All");
    setCurrentPage(1);
    try {
      const snap = await getDocs(collection(db, "products"));
      setProductData(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch {
      showError(t("admin_products.reset_failed"));
    }
  };

  const filteredProducts = productData
    .filter((p) => {
      const lang = i18n.language;

      if (selectedTab !== "All") {
        const category =
          typeof p.category === "object"
            ? p.category[lang] || p.category.en
            : p.category;

        if (category?.toLowerCase() !== selectedTab.toLowerCase()) return false;
      }

      if (searchTerm) {
        const name =
          typeof p.productName === "object"
            ? p.productName[lang] || p.productName.en
            : p.productName;
        const searchString = `${name} ${p.sku} ${p.supplierName}`.toLowerCase();
        if (!searchString.includes(searchTerm.toLowerCase())) return false;
      }

      if (filterType === "manual" && !p.mainLocation) return false;
      return true;
    })
    .sort((a, b) => {
      if (filterType === "price") return a.price - b.price;
      if (filterType === "quantity") return a.quantity - b.quantity;
      return 0;
    });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleExportToExcel = () => {
    if (!productData.length) {
      showError(t("admin_products.no_data"));
      return;
    }
    const rows = productData.map((p) => ({
      ID: p.id,
      "Product Name":
        typeof p.productName === "object"
          ? p.productName[i18n.language] || p.productName.en
          : p.productName,
      "Supplier Name": p.supplierName,
      Location: p.mainLocation,
      Price: p.price,
      Quantity: p.quantity,
      Category: p.category,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, "products_export.xlsx");
    showSuccess(t("admin_products.export_success"));
  };

  if (authLoading) {
    return <p className='text-center py-6'>{t("admin_products.loading")}</p>;
  }

  return (
    <div className='max-w-7xl mx-auto p-4 space-y-4'>
      {/* Header */}
      <div className='flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h2 className='text-lg font-semibold text-green-700'>
            {t("admin_products.title")}
          </h2>
          <p className='text-xs text-muted-foreground'>
            {t("admin_products.subtitle")}
          </p>
        </div>
        <Button
          size='sm'
          className='mt-2 sm:mt-0'
          onClick={() => router.push("/admin-dashboard/products/add")}
        >
          <Plus className='w-4 h-4 mr-1' />
          {t("admin_products.add_new")}
        </Button>
      </div>

      {/* Category Tabs */}
      <div className='w-full'>
        <div className='flex flex-wrap gap-2'>
          {categories.map((cat, i) => (
            <Button
              key={`cat-${i}`}
              size='sm'
              variant={cat === selectedTab ? "default" : "outline"}
              onClick={() => {
                setSelectedTab(cat);
                setCurrentPage(1);
              }}
              className='whitespace-nowrap px-3 py-1 text-xs'
            >
              {cat}
              <Badge className='ml-2 bg-muted text-[10px] text-foreground'>
                {cat === "All"
                  ? productData.length
                  : productData.filter((p) => {
                      const lang = i18n.language;
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
      </div>

      {/* Filter Bar */}
      <div className='flex flex-wrap gap-2'>
        <Select onValueChange={(v) => setFilterType(v)}>
          <SelectTrigger className='w-[140px] h-9 text-xs'>
            <SelectValue placeholder={t("admin_products.sort_by")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='manual'>
              {t("admin_products.location")}
            </SelectItem>
            <SelectItem value='price'>{t("admin_products.price")}</SelectItem>
            <SelectItem value='quantity'>
              {t("admin_products.quantity")}
            </SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder={t("admin_products.search_placeholder")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className='max-w-xs h-9 text-xs'
        />
        <Button size='sm' variant='secondary'>
          {t("admin_products.search_button")}
        </Button>
        <Button size='sm' variant='outline' onClick={resetSearch}>
          {t("admin_products.reset_button")}
        </Button>
        <Button
          size='sm'
          variant='outline'
          onClick={handleExportToExcel}
          className='ml-auto'
        >
          <Download className='w-4 h-4 mr-1' />
          {t("admin_products.export_to_excel")}
        </Button>
      </div>

      {/* Table */}
      <div className='w-full overflow-x-auto'>
        <Table className='min-w-full'>
          <TableHeader>
            <TableRow className='text-xs'>
              <TableHead>#</TableHead>
              <TableHead>{t("admin_products.column_name")}</TableHead>
              <TableHead>{t("admin_products.column_supplier")}</TableHead>
              <TableHead>{t("admin_products.column_location")}</TableHead>
              <TableHead>{t("admin_products.column_qty_price")}</TableHead>
              <TableHead>{t("admin_products.column_actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProducts.map((p, i) => (
              <TableRow key={p.id} className='text-xs'>
                <TableCell>
                  {(currentPage - 1) * itemsPerPage + i + 1}
                </TableCell>
                <TableCell>
                  {typeof p.productName === "object"
                    ? p.productName[i18n.language] || p.productName.en
                    : p.productName}
                </TableCell>
                <TableCell>{p.supplierName}</TableCell>
                <TableCell>
                  {p.mainLocation || t("admin_products.na")}
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
                    t("admin_products.na")
                  )}
                </TableCell>
                <TableCell className='flex gap-1'>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() =>
                      router.push(`/admin-dashboard/products/edit/${p.id}`)
                    }
                  >
                    <Pencil className='w-4 h-4 text-blue-600' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => handleDelete(p.id)}
                  >
                    <Trash2 className='w-4 h-4 text-red-600' />
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
          {t("admin_products.prev")}
        </Button>
        <span className='text-muted-foreground'>
          {t("admin_products.page")} {currentPage} {t("admin_products.of")}{" "}
          {totalPages}
        </span>
        <Button
          size='sm'
          variant='outline'
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
        >
          {t("admin_products.next")}
        </Button>
      </div>
    </div>
  );
}
