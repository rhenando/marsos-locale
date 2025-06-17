"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";

const HelpCenter = () => {
  const t = useTranslations("help-center");
  const faqs = t.raw("faqs"); // Returns array of objects

  const [searchTerm, setSearchTerm] = useState("");

  // Filtering FAQS based on search, supports both question and answer search
  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14'>
      <header className='mb-6'>
        <h1 className='text-2xl sm:text-3xl font-bold text-[#2c6449]'>
          {t("title")}
        </h1>
        <p className='text-gray-600 text-sm sm:text-base mt-2'>
          {t("subtitle")}
        </p>
      </header>

      {/* Search Bar */}
      <div className='relative mb-10'>
        <input
          type='text'
          placeholder={t("searchPlaceholder")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className='w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2c6449] text-sm'
        />
        <Search
          className='absolute top-3 right-4 text-gray-400 pointer-events-none'
          size={18}
        />
      </div>

      {/* FAQ List */}
      <div className='space-y-6'>
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq, index) => (
            <article key={index} className='border-b pb-4'>
              <h2 className='font-semibold text-[#2c6449] mb-1 text-base sm:text-lg'>
                {faq.question}
              </h2>
              <p className='text-gray-600 text-sm'>{faq.answer}</p>
            </article>
          ))
        ) : (
          <p className='text-sm text-gray-500'>{t("noMatch")}</p>
        )}
      </div>

      {/* Contact Box */}
      <div className='mt-14 bg-gray-50 p-6 sm:p-8 border rounded-lg text-center'>
        <h3 className='text-lg sm:text-xl font-semibold text-[#2c6449] mb-2'>
          {t("stillHaveQuestions")}
        </h3>
        <p className='text-sm text-gray-600 mb-4'>{t("supportReady")}</p>
        <a
          href='/contact'
          className='inline-block px-5 py-2 bg-[#2c6449] text-white text-sm rounded-full hover:bg-[#24523b] transition'
        >
          {t("contactUs")}
        </a>
      </div>
    </section>
  );
};

export default HelpCenter;
