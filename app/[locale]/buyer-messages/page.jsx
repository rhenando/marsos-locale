"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { db } from "@/firebase/config";
import {
  collection,
  query,
  where,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";

import {
  FileText,
  Box,
  ShoppingCart,
  ReceiptText,
  User2,
  Mail,
  BadgeHelp,
  Search,
  MessageSquare,
} from "lucide-react";

// Map concern types to icons
const concernTypeIcon = {
  rfq: <FileText size={16} className='inline mr-1 -mt-1' />,
  product: <Box size={16} className='inline mr-1 -mt-1' />,
  cart: <ShoppingCart size={16} className='inline mr-1 -mt-1' />,
  order: <ReceiptText size={16} className='inline mr-1 -mt-1' />,
};

export default function UserMessages() {
  const t = useTranslations("userMessages");
  const router = useRouter();
  const currentUser = useSelector((state) => state.auth.user);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All");

  // Redirect to /login if no user is signed in
  useEffect(() => {
    if (currentUser === null) {
      router.push("/user-login");
    }
  }, [currentUser, router]);

  useEffect(() => {
    if (!currentUser) return;

    let unsubscribes = [];

    (async () => {
      setUserRole(currentUser.role);

      const sources = [
        {
          col: "rfqChats",
          label: t("types.rfq"),
          key: currentUser.role === "supplier" ? "supplierId" : "buyerId",
          type: "rfq",
          path: (id) => `/chat/rfq/${id}`,
        },
        {
          col: "productChats",
          label: t("types.product"),
          key: currentUser.role === "supplier" ? "supplierId" : "buyerId",
          type: "product",
          path: (id) => `/chat/product/${id}`,
        },
        {
          col: "cartChats",
          label: t("types.cart"),
          key: currentUser.role === "supplier" ? "supplierId" : "buyerId",
          type: "cart",
          path: (id) => `/chat/cart/${id}`,
        },
        {
          col: "orderChats",
          label: t("types.order"),
          key: currentUser.role === "supplier" ? "supplierId" : "buyerId",
          type: "order",
          path: async (id, data) => {
            const bill = data.billNumber;
            let extra = {};
            if (bill) {
              const oSnap = await getDoc(doc(db, "orders", bill));
              if (oSnap.exists()) {
                const od = oSnap.data();
                extra.totalAmount = od.totalAmount;
                extra.orderStatus = od.orderStatus;
              }
            }
            return (
              `/order-chat/${id}` +
              (bill ? `?data=${encodeURIComponent(JSON.stringify(extra))}` : "")
            );
          },
        },
      ];

      sources.forEach((src) => {
        const q = query(
          collection(db, src.col),
          where(src.key, "==", currentUser.uid)
        );

        const unsub = onSnapshot(q, async (snap) => {
          const updated = await Promise.all(
            snap.docs.map(async (d) => {
              const data = d.data();
              const otherId =
                currentUser.role === "supplier"
                  ? data.buyerId
                  : data.supplierId;

              let otherName = "Unknown";
              if (otherId) {
                const uSnap = await getDoc(doc(db, "users", otherId));
                if (uSnap.exists()) otherName = uSnap.data().name || "Unknown";
              }

              const path =
                typeof src.path === "function"
                  ? await src.path(d.id, data)
                  : src.path;

              return {
                id: d.id,
                name: otherName,
                concernType: src.label,
                concernTypeKey: src.type,
                chatPath: path,
                lastUpdated: data.lastUpdated?.toDate() || new Date(0),
                unread: !(data.readBy || []).includes(currentUser.uid),
                collectionName: src.col,
              };
            })
          );

          setChats((prev) => {
            const filtered = prev.filter((c) => c.concernType !== src.label);
            return [...filtered, ...updated].sort(
              (a, b) => b.lastUpdated - a.lastUpdated
            );
          });
        });

        unsubscribes.push(unsub);
      });

      setLoading(false);
      return () => unsubscribes.forEach((u) => u());
    })();
  }, [currentUser, t]);

  const handleMarkAsRead = async (chatId, col) => {
    await updateDoc(doc(db, col, chatId), {
      readBy: arrayUnion(currentUser.uid),
    });
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId
          ? {
              ...c,
              unread: false,
            }
          : c
      )
    );
  };

  const filtered = chats.filter((c) => {
    const matchesName = c.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesType =
      selectedType === "All" || c.concernTypeKey === selectedType.toLowerCase();
    return matchesName && matchesType;
  });

  // While redirecting (or if currentUser is still null), show a loading state
  if (!currentUser) {
    return <p className='text-center py-8'>{t("redirecting")}</p>;
  }

  if (loading || !userRole) {
    return <p className='text-center py-8'>{t("loading")}</p>;
  }

  return (
    <div className='max-w-6xl mx-auto p-4 space-y-4'>
      <h1 className='text-2xl font-semibold flex items-center gap-2'>
        <MessageSquare className='text-primary' /> {t("title")}
      </h1>

      <div className='flex flex-col sm:flex-row gap-3'>
        <div className='relative flex-1'>
          <Input
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-10 flex-1'
          />
          <Search className='absolute left-2 top-2.5 text-gray-400' size={18} />
        </div>
        <Select
          value={selectedType}
          onValueChange={setSelectedType}
          className='w-full sm:w-48'
        >
          <SelectTrigger>
            <SelectValue placeholder={t("typePlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='All'>
              <BadgeHelp size={16} className='inline mr-1 -mt-1' />
              {t("types.all")}
            </SelectItem>
            <SelectItem value='rfq'>
              <FileText size={16} className='inline mr-1 -mt-1' />
              {t("types.rfq")}
            </SelectItem>
            <SelectItem value='product'>
              <Box size={16} className='inline mr-1 -mt-1' />
              {t("types.product")}
            </SelectItem>
            <SelectItem value='cart'>
              <ShoppingCart size={16} className='inline mr-1 -mt-1' />
              {t("types.cart")}
            </SelectItem>
            <SelectItem value='order'>
              <ReceiptText size={16} className='inline mr-1 -mt-1' />
              {t("types.order")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Desktop Table */}
      <div className='hidden md:block border rounded'>
        <ScrollArea>
          <table className='min-w-full text-sm'>
            <thead className='bg-green-800 text-white'>
              <tr>
                <th className='px-4 py-2'>{t("table.name")}</th>
                <th className='px-4 py-2'>{t("table.type")}</th>
                <th className='px-4 py-2'>{t("table.lastUpdated")}</th>
                <th className='px-4 py-2'>{t("table.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className={c.unread ? "bg-yellow-50" : "bg-white"}
                >
                  <td className='px-4 py-2 flex items-center gap-2'>
                    <User2 size={15} className='text-gray-400' />
                    {c.name}
                  </td>
                  <td className='px-4 py-2 flex items-center gap-1'>
                    {concernTypeIcon[c.concernTypeKey]}
                    <Badge variant='outline'>{c.concernType}</Badge>
                  </td>
                  <td className='px-4 py-2'>
                    {c.lastUpdated.toLocaleString()}
                  </td>
                  <td className='px-4 py-2 space-x-2'>
                    <Link href={c.chatPath}>
                      <Button size='sm'>
                        <Mail size={14} className='mr-1 -mt-0.5' />
                        {t("table.open")}
                      </Button>
                    </Link>
                    {c.unread && (
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => handleMarkAsRead(c.id, c.collectionName)}
                      >
                        {t("table.markRead")}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
      </div>

      {/* Mobile Cards */}
      <div className='space-y-3 md:hidden'>
        {filtered.map((c) => (
          <div
            key={c.id}
            className={`p-4 border rounded-lg ${
              c.unread ? "bg-yellow-50" : "bg-white"
            }`}
          >
            <div className='flex justify-between items-center'>
              <h2 className='font-medium flex items-center gap-1'>
                <User2 size={15} className='text-gray-400' />
                {c.name}
              </h2>
              <span className='flex items-center gap-1'>
                {concernTypeIcon[c.concernTypeKey]}
                <Badge variant='outline'>{c.concernType}</Badge>
              </span>
            </div>
            <p className='text-sm text-gray-500'>
              {c.lastUpdated.toLocaleString()}
            </p>
            <div className='mt-2 flex gap-2'>
              <Link href={c.chatPath}>
                <Button size='sm' className='flex-1'>
                  <Mail size={14} className='mr-1 -mt-0.5' />
                  {t("mobile.open")}
                </Button>
              </Link>
              {c.unread && (
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => handleMarkAsRead(c.id, c.collectionName)}
                  className='flex-1'
                >
                  {t("mobile.markRead")}
                </Button>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <p className='text-center py-8 text-gray-500'>{t("empty")}</p>
        )}
      </div>
    </div>
  );
}
