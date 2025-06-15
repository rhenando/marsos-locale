"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import useAuth from "@/hooks/useAuth";

import BuyerProfile from "@/components/buyer/BuyerProfile";
import Orders from "@/components/buyer/orders/Orders";
import UserMessages from "@/app/[locale]/buyer-messages/page";

// Lucide React icons (replacing react-feather)
import {
  Home,
  User,
  ShoppingCart,
  Heart,
  ShoppingBag,
  Mail,
  HelpCircle,
  Menu,
} from "lucide-react";

export default function Dashboard() {
  const t = useTranslations("buyerDashboard");
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState("home");

  // Show loading state while auth is being checked
  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        {t("loading")}
      </div>
    );
  }

  // Redirect or prompt if no user
  if (!user) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        {t.rich("notSignedIn", {
          signIn: (chunks) => (
            <Link href='/user-login' className='underline text-primary'>
              {t("signIn")}
            </Link>
          ),
        })}
      </div>
    );
  }

  const menuItems = [
    { key: "home", label: t("menu.home"), icon: <Home size={18} /> },
    { key: "profile", label: t("menu.profile"), icon: <User size={18} /> },
    {
      key: "orders",
      label: t("menu.orders"),
      icon: <ShoppingCart size={18} />,
    },
    { key: "wishlist", label: t("menu.wishlist"), icon: <Heart size={18} /> },
    { key: "cart", label: t("menu.cart"), icon: <ShoppingBag size={18} /> },
    { key: "messages", label: t("menu.messages"), icon: <Mail size={18} /> },
    {
      key: "support",
      label: t("menu.support"),
      icon: <HelpCircle size={18} />,
    },
  ];

  const renderContent = () => {
    switch (selectedPage) {
      case "home":
        return (
          <div>
            <h2 className='text-2xl font-bold text-primary'>
              {t("titles.welcome", { name: user.displayName || user.email })}
            </h2>
            <p className='text-gray-600 mt-2'>{t("content.welcome")}</p>
          </div>
        );
      case "profile":
        return <BuyerProfile />;
      case "orders":
        return <Orders />;
      case "messages":
        return <UserMessages />;
      case "wishlist":
        return (
          <div>
            <h2 className='text-xl font-semibold text-primary'>
              {t("titles.wishlist")}
            </h2>
            <p className='text-gray-600 mt-2'>{t("content.wishlist")}</p>
          </div>
        );
      case "cart":
        return (
          <div>
            <h2 className='text-xl font-semibold text-primary'>
              {t("titles.cart")}
            </h2>
            <p className='text-gray-600 mt-2'>{t("content.cart")}</p>
          </div>
        );
      case "support":
        return (
          <div>
            <h2 className='text-xl font-semibold text-primary'>
              {t("titles.support")}
            </h2>
            <p className='text-gray-600 mt-2'>{t("content.support")}</p>
          </div>
        );
      default:
        return (
          <h2 className='text-xl font-semibold text-red-500'>
            {t("titles.notFound")}
          </h2>
        );
    }
  };

  return (
    <div className='min-h-screen flex flex-col lg:flex-row bg-gray-50'>
      {/* Mobile Header */}
      <div className='flex items-center justify-between p-4 bg-white shadow-md lg:hidden'>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className='text-primary'
        >
          <Menu />
        </button>
        <h1 className='text-lg font-semibold text-primary'>
          {t("titles.dashboard")}
        </h1>
        <img
          src={user.logoUrl || "https://via.placeholder.com/32"}
          alt='User Avatar'
          className='w-10 h-10 rounded-full object-cover'
        />
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "block" : "hidden"
        } lg:block w-full lg:w-64 bg-white border-r shadow-md`}
      >
        <nav className='flex flex-col py-6'>
          {menuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => {
                setSelectedPage(item.key);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                selectedPage === item.key
                  ? "text-primary font-bold"
                  : "text-gray-700 hover:text-primary"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className='flex-1 p-4 md:p-8'>
        <div className='bg-white rounded-lg shadow-md p-6'>
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
