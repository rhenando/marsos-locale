"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Menu,
  User,
  Send,
  MessageSquare,
  ShoppingCart,
  MapPin,
  LogOut as LogOutIcon,
} from "lucide-react";
import { SheetClose } from "@/components/ui/sheet";
import { useDispatch, useSelector } from "react-redux";
import useAuth from "@/hooks/useAuth";
import { logout } from "@/store/authSlice";
import LanguageSelector from "@/components/header/LanguageSelector";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "../ui/button";
import { DialogTitle } from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

// 👇 **NEW: next-intl**
import { useTranslations } from "next-intl";

// Remove t as a prop!
const ProductSearch = dynamic(
  () => import("@/components/header/ProductSearch"),
  { ssr: false }
);

export default function Header({ setShowRFQModal }) {
  // 👇 Translation function from next-intl
  const t = useTranslations("header");

  const dispatch = useDispatch();
  const router = useRouter();

  const { loading, user } = useAuth();
  const userRole = user?.role;
  const displayName = user?.displayName || user?.email || t("signin");
  const cartCount = useSelector((s) => s.cart.count);

  const [coords, setCoords] = useState(() => {
    try {
      const stored = localStorage.getItem("coords");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [locError, setLocError] = useState(null);
  const [locationName, setLocationName] = useState(() => {
    try {
      return localStorage.getItem("locationName") || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (coords || locationName) return;
    if (!navigator.geolocation) {
      setLocError("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const geo = { lat: latitude.toFixed(3), lng: longitude.toFixed(3) };
        setCoords(geo);
        localStorage.setItem("coords", JSON.stringify(geo));
      },
      (error) => {
        setLocError(error.message);
      }
    );
  }, [coords, locationName]);

  useEffect(() => {
    if (!coords || locationName) return;
    const { lat, lng } = coords;
    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
    )
      .then((res) => {
        if (!res.ok) throw new Error("Reverse geocoding failed");
        return res.json();
      })
      .then((data) => {
        const address = data.address || {};
        const suburb =
          address.suburb ||
          address.neighbourhood ||
          address.village ||
          address.hamlet ||
          null;
        const city =
          address.city ||
          address.town ||
          address.village ||
          address.county ||
          null;
        let finalName = null;
        if (suburb && city) finalName = `${suburb}, ${city}`;
        else if (city) finalName = city;
        else if (data.display_name) finalName = data.display_name;
        if (finalName) {
          setLocationName(finalName);
          localStorage.setItem("locationName", finalName);
        } else {
          setLocError("Name not found");
        }
      })
      .catch(() => {
        setLocError("Reverse geocoding error");
      });
  }, [coords, locationName]);

  const renderLocationText = () => {
    if (locationName) return locationName;
    if (locError) return "Unavailable";
    return "Detecting…";
  };

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const onLogout = async () => {
    const role = userRole;
    await dispatch(logout()).unwrap();
    setUserMenuOpen(false);
    setSheetOpen(false);
    window.location.href = role === "admin" ? "/admin-login" : "/user-login";
  };

  if (loading) {
    return (
      <header className='w-full bg-white shadow'>
        <div className='p-4 text-center text-sm text-muted-foreground'>
          {t("loading")}
        </div>
      </header>
    );
  }

  // For RTL support, pass isRtl from layout/page or detect via locale
  const isRtl = false; // Set this based on locale if needed

  return (
    <header className='w-full bg-white/90 backdrop-blur-md shadow-sm z-50'>
      <div className='max-w-full mx-auto flex items-center justify-between px-4 md:px-6 h-26'>
        <Link href='/' className='flex-shrink-0'>
          <Image src='/logo.svg' alt='Logo' width={48} height={48} />
        </Link>
        <div className='hidden md:flex flex-1 mx-6'>
          <ProductSearch />
        </div>
        {/* Hamburger menu and language selector for small/medium screens */}
        <div className='flex items-center gap-2 lg:hidden'>
          <LanguageSelector />
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant='ghost' size='icon' className='text-[#2c6449]'>
                <Menu size={20} />
                <VisuallyHidden>Menu</VisuallyHidden>
              </Button>
            </SheetTrigger>
            <SheetContent
              side={isRtl ? "right" : "left"}
              className='w-72 p-5 flex flex-col'
            >
              <SheetTitle className='mb-6 text-lg font-semibold text-[#2c6449]'>
                {t("menu")}
              </SheetTitle>
              <div className='space-y-6 text-sm text-gray-700'>
                {/* Account Section */}
                <div>
                  <p className='text-xs uppercase tracking-wide mb-2 text-muted-foreground'>
                    {t("account")}
                  </p>
                  <div className='space-y-2'>
                    {user ? (
                      <>
                        <Button
                          variant='ghost'
                          className='w-full justify-start gap-2 hover:bg-muted'
                          onClick={() => {
                            setSheetOpen(false);
                            router.push(
                              userRole === "buyer"
                                ? "/buyer-dashboard"
                                : userRole === "supplier"
                                ? "/supplier-dashboard"
                                : "/admin-dashboard"
                            );
                          }}
                        >
                          <User size={16} />
                          {t("dashboard")}
                        </Button>
                        <Button
                          variant='ghost'
                          className='w-full justify-start gap-2 hover:bg-muted'
                          onClick={onLogout}
                        >
                          <LogOutIcon size={16} />
                          {t("logout")}
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant='ghost'
                        className='w-full justify-start gap-2 hover:bg-muted'
                        onClick={() => {
                          setSheetOpen(false);
                          router.push("/user-login");
                        }}
                      >
                        <User size={16} />
                        {t("signin")}
                      </Button>
                    )}
                  </div>
                </div>
                {/* Explore Section */}
                <div>
                  <p className='text-xs uppercase tracking-wide mb-2 text-muted-foreground'>
                    {t("explore")}
                  </p>
                  <div className='space-y-2'>
                    <Button
                      variant='ghost'
                      className='w-full justify-start gap-2 hover:bg-muted'
                      onClick={() => {
                        setShowRFQModal(true);
                        setSheetOpen(false);
                      }}
                    >
                      <Send size={16} />
                      {t("request_rfq")}
                    </Button>
                    {user && (
                      <Button
                        variant='ghost'
                        className='w-full justify-start gap-2 hover:bg-muted'
                        onClick={() => {
                          setSheetOpen(false);
                          router.push("/buyer-messages");
                        }}
                      >
                        <MessageSquare size={16} />
                        {t("messages")}
                      </Button>
                    )}
                    {userRole !== "admin" && (
                      <Button
                        variant='ghost'
                        className='w-full justify-start gap-2 hover:bg-muted'
                        onClick={() => {
                          setSheetOpen(false);
                          router.push("/cart");
                        }}
                      >
                        <ShoppingCart size={16} />
                        {t("cart")} ({cartCount})
                      </Button>
                    )}
                  </div>
                </div>
                {/* Info Section */}
                <div className='pt-2 border-t'>
                  <p className='text-xs uppercase tracking-wide mb-2 mt-4 text-muted-foreground'>
                    {t("info")}
                  </p>
                  <div className='flex items-center gap-2 text-sm text-gray-600 px-2'>
                    <MapPin size={16} className='text-gray-500' />
                    <span className='line-clamp-2 leading-tight'>
                      {renderLocationText()}
                    </span>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        {/* Full menu for large screens */}
        <div className='hidden lg:flex items-start space-x-8 ml-6 text-[#2c6449]'>
          <Popover open={userMenuOpen} onOpenChange={setUserMenuOpen}>
            <PopoverTrigger asChild>
              <button className='flex flex-col items-center hover:text-green-800'>
                <User size={18} />
                <span className='text-sm mt-1'>{displayName}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent align='end' className='w-40 text-sm z-[9999]'>
              {user ? (
                <>
                  <Button
                    variant='ghost'
                    className='w-full justify-start'
                    onClick={() => {
                      setUserMenuOpen(false);
                      if (userRole === "buyer") router.push("/buyer-dashboard");
                      else if (userRole === "supplier")
                        router.push("/supplier-dashboard");
                      else router.push("/admin-dashboard");
                    }}
                  >
                    {t("dashboard")}
                  </Button>
                  <Button
                    variant='ghost'
                    className='w-full justify-start'
                    onClick={onLogout}
                  >
                    {t("logout")}
                  </Button>
                </>
              ) : (
                <Button
                  variant='ghost'
                  className='w-full justify-start'
                  onClick={() => {
                    setUserMenuOpen(false);
                    router.push("/user-login");
                  }}
                >
                  {t("signin")}
                </Button>
              )}
            </PopoverContent>
          </Popover>
          <button
            onClick={() => setShowRFQModal(true)}
            className='flex flex-col items-center hover:text-green-800'
          >
            <Send size={18} />
            <span className='text-sm mt-1'>{t("request_rfq")}</span>
          </button>
          {user && (
            <Link
              href='/buyer-messages'
              className='flex flex-col items-center hover:text-green-800'
            >
              <MessageSquare size={18} />
              <span className='text-sm mt-1'>{t("messages")}</span>
            </Link>
          )}
          {userRole !== "admin" && (
            <Link
              href='/cart'
              className='relative flex flex-col items-center hover:text-green-800'
            >
              <ShoppingCart size={18} />
              <span className='text-sm mt-1'>{t("cart")}</span>
              {cartCount > 0 && (
                <span className='absolute -top-1 -right-2 bg-red-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center'>
                  {cartCount}
                </span>
              )}
            </Link>
          )}
          <div className='flex flex-col items-center text-[#2c6449]'>
            <MapPin size={18} />
            <span className='text-xs mt-2'>{renderLocationText()}</span>
          </div>
          <div className='flex flex-col items-center hover:text-green-800'>
            <LanguageSelector />
          </div>
        </div>
      </div>
      <div className='block md:hidden px-4 pb-4'>
        <ProductSearch />
      </div>
      {/* Secondary nav (desktop only) */}
      <div className='hidden lg:block bg-white border-y border-gray-200'>
        <div className='max-w-7xl mx-auto px-6 flex items-center h-10 text-[#2c6449] text-md space-x-8'>
          <Link
            href='/categories'
            className='font-semibold hover:text-green-800'
          >
            {t("all_categories")}
          </Link>
          <Link href='/' className='hover:text-green-800'>
            {t("featured")}
          </Link>
          <Link href='/' className='hover:text-green-800'>
            {t("trending")}
          </Link>
          <div className='flex-1' />
          <Link href='/' className='hover:text-green-800'>
            {t("secured_trading")}
          </Link>
          <Link href='/faq' className='hover:text-green-800'>
            {t("help_center")}
          </Link>
          <Link href='/become-supplier' className='hover:text-green-800'>
            {t("become_supplier")}
          </Link>
        </div>
      </div>
    </header>
  );
}
