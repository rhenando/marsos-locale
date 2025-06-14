"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { logout as logoutAction } from "@/store/authSlice";
import RfqModal from "../rfq/Rfq";
import ProductSearch from "@/components/header/ProductSearch";
import { Button } from "../ui/button";
import { Sheet, SheetTrigger, SheetContent } from "../ui/sheet";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";
import {
  Menu,
  User,
  MessageSquare,
  ShoppingCart,
  MapPin,
  Send,
  LogOut,
  Home,
} from "lucide-react";
import { useTranslations } from "next-intl";

const StickySearchBar = ({ selectedCountry = "sa" }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("header");

  const cartItemCount = useSelector((state) => state.cart.count);
  const user = useSelector((state) => state.auth.user);
  const userRole = user?.role;

  const [showRFQModal, setShowRFQModal] = useState(false);

  const handleLogout = async () => {
    try {
      await dispatch(logoutAction()).unwrap();
      router.push("/user-login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const countryNames = {
    sa: "Saudi Arabia",
    ae: "UAE",
    qa: "Qatar",
    om: "Oman",
    kw: "Kuwait",
    bh: "Bahrain",
  };

  // 🌍 Location detection logic with localStorage
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

  return (
    <header className='top-0 z-[9999] w-full bg-white/90 backdrop-blur-md shadow-sm'>
      <div className='flex items-center justify-between px-2 sm:px-4 md:px-6 py-3'>
        <Link href='/' className='flex items-center gap-2'>
          <img
            src='/logo.svg'
            alt='Company Logo'
            className='h-14 sm:h-16 md:h-20 object-contain'
          />
        </Link>

        <div className='flex flex-1 mx-2 sm:mx-4 max-w-full sm:max-w-3xl'>
          <ProductSearch t={t} />
        </div>

        <div className='hidden md:flex items-center gap-4 text-[#2c6449]'>
          <div className='text-xs flex-col items-center hidden md:flex'>
            <span>{t("sticky.delivery_to")}</span>
            <span className='flex items-center gap-1'>
              <img
                src={`https://flagcdn.com/w20/${selectedCountry}.png`}
                alt={countryNames[selectedCountry]}
                className='w-5 h-4 object-cover rounded-sm'
              />
              {selectedCountry.toUpperCase()}
            </span>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant='ghost' className='flex items-center gap-2'>
                <User size={22} />
              </Button>
            </PopoverTrigger>
            <PopoverContent align='end' className='w-40 text-sm'>
              {user ? (
                <>
                  <Button
                    variant='ghost'
                    className='w-full justify-start'
                    onClick={() => {
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
                    onClick={handleLogout}
                  >
                    {t("logout")}
                  </Button>
                </>
              ) : (
                <Button
                  variant='ghost'
                  className='w-full justify-start'
                  onClick={() => router.push("/user-login")}
                >
                  {t("signin")}
                </Button>
              )}
            </PopoverContent>
          </Popover>

          <Link href='/buyer-messages'>
            <Button variant='ghost' className='flex items-center gap-2'>
              <MessageSquare size={22} />
            </Button>
          </Link>

          {userRole !== "admin" && userRole !== "supplier" && (
            <Link href='/cart' className='relative'>
              <Button variant='ghost' className='flex items-center gap-2'>
                <ShoppingCart size={22} />
              </Button>
              {cartItemCount > 0 && (
                <span className='absolute -top-1 -right-1 bg-[#2c6449] text-white text-[10px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-center'>
                  {cartItemCount}
                </span>
              )}
            </Link>
          )}

          <Button
            variant='outline'
            size='sm'
            className='flex items-center gap-2 text-[#2c6449] border-[#2c6449]'
            onClick={() => setShowRFQModal(true)}
          >
            <Send size={20} />
          </Button>

          <div className='flex flex-col items-center text-[#2c6449] text-xs'>
            <MapPin size={22} />
            <span className='mt-1'>{renderLocationText()}</span>
          </div>
        </div>

        <div className='flex md:hidden'>
          <Sheet>
            <SheetTrigger asChild>
              <Button size='icon' variant='ghost' className='rounded-full'>
                <Menu size={24} />
              </Button>
            </SheetTrigger>
            <SheetContent side='left' className='w-64 max-w-[90vw]'>
              <div className='flex flex-col gap-4 mt-4 px-2 text-[#2c6449]'>
                <Link href='/'>
                  <Button variant='ghost' className='w-full justify-start'>
                    <Home size={20} className='mr-2' />
                    {t("home")}
                  </Button>
                </Link>

                {user ? (
                  <>
                    <Button
                      variant='ghost'
                      className='w-full justify-start'
                      onClick={() => {
                        if (userRole === "buyer")
                          router.push("/buyer-dashboard");
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
                      onClick={handleLogout}
                    >
                      <LogOut size={20} className='mr-2' />
                      {t("logout")}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant='ghost'
                    className='w-full justify-start'
                    onClick={() => router.push("/user-login")}
                  >
                    <User size={20} className='mr-2' />
                    {t("signin")}
                  </Button>
                )}

                <Link href='/buyer-messages'>
                  <Button variant='ghost' className='w-full justify-start'>
                    <MessageSquare size={20} className='mr-2' />
                    {t("messages")}
                  </Button>
                </Link>

                {userRole !== "admin" && userRole !== "supplier" && (
                  <Link href='/cart'>
                    <Button variant='ghost' className='w-full justify-start'>
                      <ShoppingCart size={20} className='mr-2' />
                      {t("cart")}
                    </Button>
                  </Link>
                )}

                <Button
                  variant='ghost'
                  className='w-full justify-start'
                  onClick={() => {}}
                >
                  <MapPin size={20} className='mr-2' />
                  {renderLocationText()}
                </Button>

                <Button
                  variant='outline'
                  className='w-full justify-start text-[#2c6449] border-[#2c6449]'
                  onClick={() => setShowRFQModal(true)}
                >
                  <Send size={20} className='mr-2' />
                  {t("request_rfq")}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <RfqModal show={showRFQModal} onClose={() => setShowRFQModal(false)} />
    </header>
  );
};

export default StickySearchBar;
