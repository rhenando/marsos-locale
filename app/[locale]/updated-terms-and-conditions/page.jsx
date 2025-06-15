"use client";

import React, { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { FileText, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePathname } from "next/navigation";

// Utility to extract locale from path
function getLocaleFromPath(pathname) {
  const match = pathname.match(/^\/([a-zA-Z-]+)(\/|$)/);
  return match ? match[1] : "en";
}

export default function TermsAndConditions() {
  const [terms, setTerms] = useState("");
  const [loading, setLoading] = useState(true);

  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);

  useEffect(() => {
    async function fetchTerms() {
      setLoading(true);
      try {
        const ref = doc(db, "policies", "termsAndConditions");
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setTerms(locale === "ar" ? data.contentAr : data.contentEn);
        } else {
          setTerms("<p>Terms and Conditions not found.</p>");
        }
      } catch (err) {
        setTerms("<p>Could not load Terms and Conditions.</p>");
      } finally {
        setLoading(false);
      }
    }
    fetchTerms();
  }, [locale]);

  const handlePrint = () => window.print();

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-[#f7fafc] py-16 px-2'>
      <div className='max-w-3xl mx-auto rounded-3xl shadow-xl bg-white/90 backdrop-blur-sm border border-gray-200 ring-1 ring-gray-100'>
        {/* Header */}
        <div className='flex items-center gap-4 p-8 border-b border-gray-100'>
          <div className='bg-primary/10 rounded-full p-4 flex items-center justify-center shadow-sm'>
            <FileText className='w-8 h-8 text-primary' />
          </div>
          <div>
            <h1 className='text-3xl font-bold tracking-tight text-gray-900 mb-1'>
              {locale === "ar" ? "الشروط والأحكام" : "Terms & Conditions"}
            </h1>
            <p className='text-gray-500 text-base'>
              {locale === "ar"
                ? "يرجى قراءة هذه الشروط بعناية"
                : "Please read these terms carefully"}
            </p>
            {/* Example: Last updated */}
            <span className='text-xs text-gray-400 block mt-1'>
              Last updated: June 2025
            </span>
          </div>
        </div>

        {/* Body */}
        <div
          className={`px-8 py-8 sm:px-10 sm:py-10 transition-all duration-300 leading-relaxed ${
            locale === "ar" ? "text-right" : "text-left"
          }`}
        >
          {loading ? (
            <div className='space-y-4'>
              <Skeleton className='h-6 w-2/3' />
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-5/6' />
              <Skeleton className='h-4 w-4/6' />
              <Skeleton className='h-4 w-1/2' />
            </div>
          ) : (
            <div
              className={`prose prose-lg max-w-none prose-[line-height:1.85] ${
                locale === "ar" ? "prose-headings:text-right" : ""
              }`}
            >
              <article
                dir={locale === "ar" ? "rtl" : "ltr"}
                dangerouslySetInnerHTML={{ __html: terms }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='flex flex-col sm:flex-row justify-end items-center gap-2 px-8 pb-8 border-t border-gray-100'>
          <Button
            variant='ghost'
            className='flex items-center gap-1'
            onClick={handlePrint}
            size='sm'
          >
            <Printer className='w-4 h-4' />
            {locale === "ar" ? "طباعة" : "Print"}
          </Button>
          <Button
            variant='secondary'
            className='flex items-center gap-1'
            size='sm'
            disabled // replace with your Download PDF logic
          >
            <Download className='w-4 h-4' />
            {locale === "ar" ? "تحميل PDF" : "Download PDF"}
          </Button>
        </div>
      </div>
    </div>
  );
}
