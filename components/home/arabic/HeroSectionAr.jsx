"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/firebase/config";
import { collection, getDocs } from "firebase/firestore";

import {
  List,
  ChevronLeft,
  ChevronRight,
  Shield,
  Award,
  ThumbsUp,
  Clock,
} from "react-feather";

import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";

import RfqModal from "@/components/rfq/Rfq";

// banner images
const firstBanner = "/1stbanner.png";
const secondBanner = "/2ndbanner.png";
const thirdBanner = "/3rdbanner.png";
const heroBackground = "/hero-background.png";

const cardData = [
  {
    title: "خيارات متنوعة",
    description: "الوصول إلى موردين ومنتجات متعددة",
    icon: <ThumbsUp size={20} />,
  },
  {
    title: "تجارة آمنة",
    description: "تأمين معاملاتك بالكامل",
    icon: <Shield size={20} />,
  },
  {
    title: "أفضل الموردين",
    description: "تعاون مع قادة الصناعة",
    icon: <Award size={20} />,
  },
  {
    title: "استجابة سريعة",
    description: "استلم العروض والردود بسرعة",
    icon: <Clock size={20} />,
  },
];

const slugify = (text) =>
  text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-ا-ي]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");

export default function HeroSection() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [randomProducts, setRandomProducts] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [showRFQModal, setShowRFQModal] = useState(false);

  useEffect(() => {
    getDocs(collection(db, "products")).then((snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const counts = {};
      all.forEach((p) => {
        const cat = p.category?.ar?.trim() || "غير مصنفة";

        counts[cat] = (counts[cat] || 0) + 1;
      });
      setCategoryCounts(counts);
      setRandomProducts(all.sort(() => 0.5 - Math.random()).slice(0, 4));
    });
  }, []);

  useEffect(() => {
    getDocs(collection(db, "products")).then((snap) => {
      const map = {};
      snap.docs
        .map((d) => d.data())
        .forEach((p) => {
          const name = p.category?.ar?.trim() || "غير مصنفة";

          const slug = slugify(name);
          if (!map[slug]) map[slug] = { name, slug };
        });
      setCategories(Object.values(map));
    });
  }, []);

  const getName = (product) => {
    const name = product.productName;
    if (typeof name === "string") return name;
    return name?.ar || "منتج بدون اسم";
  };

  const [sliderRef, sliderInstanceRef] = useKeenSlider({
    loop: true,
    slides: { perView: 1 },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      sliderInstanceRef.current?.next();
    }, 5000);
    return () => clearInterval(interval);
  }, [sliderInstanceRef]);

  const banners = [
    {
      title: "مرصوص السعودية، المصانع السعودية تحت مظلة واحدة",
      description:
        "نحن هنا لجعل الإستيراد أسهل و آمن. اكتشف منصة تجمع المنتجات السعودية - في مكان واحد.\n\nمن الطلب و حتى الإستلام، التكنولوجيا الصديقة للمستخدم وخيارات الدفع المريحة، وكذلك الشحن و التغليف.",
      buttonText: "اعرف المزيد",
      backgroundImage: firstBanner,
      route: "/",
    },
    {
      title: "مرصوص، للمنتجات الصناعية السعودية",
      description:
        "احصل على شبكة مختارة من المصنعين المعتمدين في السعودية. من المواد الخام إلى المعدات، احصل عليها مباشرة من المصنع.",
      buttonText: "تصفح الموردين",
      backgroundImage: secondBanner,
      route: "/top-supplier",
    },
    {
      title: "منتجات ذات جودة معتمدة",
      description:
        "يستوفي موردونا المعايير العالمية للجودة والشهادات والسلامة. تسوق بثقة في كل مرة.",
      buttonText: "عرض المنتجات المعتمدة",
      backgroundImage: thirdBanner,
      route: "/products",
    },
  ];

  return (
    <>
      <section
        dir='rtl'
        className='w-full bg-cover bg-center relative min-h-[calc(100vh-104px)] md:min-h-screen capitalize'
        style={{ backgroundImage: `url(${heroBackground})` }}
      >
        <div className='absolute inset-0 bg-[#2c6449]/80 z-0' />
        <div className='relative z-10 flex flex-col items-center pt-7 w-full'>
          {/* Mobile Category List */}
          <div className='sm:hidden w-full bg-white p-4'>
            <ul className='grid grid-cols-2 gap-2'>
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <button
                    onClick={() => router.push(`/ar/category/${cat.slug}`)}
                    className='w-full text-sm text-right px-3 py-2 bg-[#e6f4ec] rounded'
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className='w-full sm:w-[90%] flex flex-col lg:flex-row gap-4 lg:h-[75%] capitalize'>
            {/* Sidebar */}
            <div className='hidden sm:block lg:w-1/5 bg-white p-4 border rounded capitalize'>
              <h2 className='font-semibold mb-4 flex items-center gap-2 text-[#2c6449]'>
                <List size={18} />
                الفئات
              </h2>
              <ul className='space-y-2 text-base text-gray-700 capitalize'>
                {categories.map((cat) => (
                  <li key={cat.slug}>
                    <button
                      onClick={() => router.push(`/ar/category/${cat.slug}`)}
                      className='flex justify-between items-center p-2 rounded-md hover:bg-[#e6f4ec] transition w-full capitalize'
                    >
                      <span className='font-semibold'>{cat.name}</span>
                      <span className='text-xs text-gray-400'>
                        {categoryCounts[cat.name] || 0}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Slider */}
            <div className='relative w-full lg:w-3/5'>
              <div
                ref={sliderRef}
                className='keen-slider h-[70vh] overflow-hidden'
              >
                {banners.map((banner, idx) => (
                  <div
                    key={idx}
                    className='keen-slider__slide relative bg-cover bg-center h-full'
                    style={{
                      backgroundImage: `url(${banner.backgroundImage})`,
                    }}
                  >
                    <div className='absolute inset-0 bg-[#2c6449]/60' />
                    <div className='relative z-10 flex flex-col justify-center items-center text-white text-center h-full px-4'>
                      <h1 className='text-xl sm:text-2xl md:text-3xl font-bold mb-3 leading-snug'>
                        {banner.title}
                      </h1>
                      <p className='mb-6 text-base whitespace-pre-line leading-relaxed'>
                        {banner.description}
                      </p>
                      <button
                        onClick={() => router.push(banner.route)}
                        className='bg-white text-[#2c6449] px-4 py-2 rounded-md text-xs sm:text-sm font-semibold hover:bg-[#2c6449] hover:text-white transition'
                      >
                        {banner.buttonText}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Arrows */}
              <button
                onClick={() => sliderInstanceRef.current?.prev()}
                className='absolute top-1/2 right-4 transform -translate-y-1/2 p-2 rounded-full text-white hover:bg-[#2c6449]/50 transition z-20'
              >
                <ChevronRight size={32} />
              </button>
              <button
                onClick={() => sliderInstanceRef.current?.next()}
                className='absolute top-1/2 left-4 transform -translate-y-1/2 p-2 rounded-full text-white hover:bg-[#2c6449]/50 transition z-20'
              >
                <ChevronLeft size={32} />
              </button>
            </div>

            {/* Recommendations */}
            <div className='hidden lg:block lg:w-1/5 bg-white p-4 border rounded capitalize'>
              <h2 className='font-semibold mb-4'>اقتراحات</h2>
              <ul className='space-y-4 text-sm capitalize'>
                {randomProducts.map((prod) => (
                  <li key={prod.id}>
                    <button
                      onClick={() => router.push(`/ar/product/${prod.id}`)}
                      className='flex items-start gap-2 hover:bg-[#e6f4ec] p-1 rounded transition w-full text-right'
                    >
                      <div className='w-12 h-12 bg-gray-200 rounded-sm overflow-hidden capitalize'>
                        <img
                          src={prod.mainImageUrl || "/placeholder-product.png"}
                          alt={getName(prod)}
                          className='w-full h-full object-cover'
                        />
                      </div>
                      <div>
                        <p className='font-medium'>{getName(prod)}</p>
                        <p className='text-gray-500 text-xs'>
                          {prod.category?.ar || "غير مصنفة"}
                        </p>

                        <p className='text-gray-400 text-[11px] capitalize'>
                          {categoryCounts[prod.category?.ar?.trim()] || 0} منتج
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setShowRFQModal(true)}
                className='mt-6 w-full bg-[#2c6449] text-white text-sm py-2 rounded-md hover:bg-white hover:text-[#2c6449] border border-[#2c6449] transition'
              >
                طلب عرض سعر
              </button>
            </div>

            {/* Mobile CTA */}
            <div className='block lg:hidden w-full text-center py-4'>
              <button
                onClick={() => setShowRFQModal(true)}
                className='bg-[#2c6449] text-white px-4 py-2 rounded-full text-sm'
              >
                طلب عرض سعر
              </button>
            </div>
          </div>

          {/* Feature Cards */}
          <div className='w-full sm:w-[90%] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-10 mb-10 sm:mb-0'>
            {cardData.map((card) => (
              <div
                key={card.title}
                className='bg-white p-5 rounded shadow-sm hover:shadow-md transform hover:scale-[1.02] transition cursor-pointer text-[#2c6449]'
              >
                <div className='flex items-start gap-3'>
                  <div className='mt-1'>{card.icon}</div>
                  <div>
                    <div className='font-semibold'>{card.title}</div>
                    <p className='text-xs text-gray-500 mt-1'>
                      {card.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <RfqModal show={showRFQModal} onClose={() => setShowRFQModal(false)} />
    </>
  );
}
