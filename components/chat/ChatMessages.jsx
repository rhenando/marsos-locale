"use client";

import { useEffect, useState, useRef } from "react";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  getDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { useSelector } from "react-redux";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Paperclip, SendHorizontal } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

const attachmentOptions = [
  "photosAndVideos",
  "camera",
  "document",
  "contact",
  "poll",
  "drawing",
];

const ChatMessages = ({ chatId, chatMeta, parentCollection = "cartChats" }) => {
  const containerRef = useRef(null);
  const { user: currentUser, loading: authLoading } = useSelector(
    (state) => state.auth
  );
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const bottomRef = useRef(null);
  const [buyerName, setBuyerName] = useState("");

  // next-intl hooks
  const t = useTranslations("ChatMessages");
  const locale = useLocale();

  // Fetch buyer's name
  useEffect(() => {
    if (!chatMeta?.buyerId) return;
    const fetchName = async () => {
      try {
        const snap = await getDoc(doc(db, "users", chatMeta.buyerId));
        if (snap.exists()) {
          const data = snap.data();
          setBuyerName(
            data.authPersonName ||
              data.name ||
              data.nameEn ||
              data.nameAr ||
              data.displayName ||
              data.email ||
              chatMeta.buyerId ||
              t("buyer")
          );
        } else {
          setBuyerName(t("buyer"));
        }
      } catch (e) {
        console.error(e);
        setBuyerName(t("buyer"));
      }
    };
    fetchName();
    // eslint-disable-next-line
  }, [chatMeta?.buyerId, t]);

  // Listen for chat messages in real time
  useEffect(() => {
    if (!chatId) return;
    const messagesRef = collection(db, "cartChats", chatId, "messages");
    const q = query(messagesRef, orderBy("createdAt"));

    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMessages(msgs);
      setTimeout(() => {
        const el = containerRef.current;
        if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      }, 100);
    });

    return () => unsub();
  }, [chatId]);

  // Send a new message
  const sendMessage = async () => {
    if (!newMsg.trim() || !currentUser) return;

    const isBuyer = currentUser.uid === chatMeta.buyerId;
    const senderRole = isBuyer ? "buyer" : "supplier";
    const senderName = isBuyer
      ? buyerName
      : currentUser.displayName || t("supplier");

    try {
      await addDoc(collection(db, "cartChats", chatId, "messages"), {
        senderId: currentUser.uid,
        senderRole,
        senderName,
        text: newMsg.trim(),
        createdAt: new Date(),
      });
      setNewMsg("");
    } catch (e) {
      console.error("Failed to send message:", e);
    }
  };

  // Loading
  if (authLoading || !currentUser) {
    return <p className='p-6 text-center text-gray-500'>{t("loading")}</p>;
  }

  return (
    <div className='flex flex-col h-full'>
      {/* Message list */}
      <div
        ref={containerRef}
        className='flex-1 overflow-y-auto overscroll-contain space-y-2 p-4 border rounded bg-gray-50'
      >
        {messages.map((msg) => {
          const isSender = msg.senderId === currentUser.uid;
          const displayName =
            msg.senderRole === "buyer" ? buyerName : msg.senderName;

          return (
            <div
              key={msg.id}
              className={`relative max-w-[75%] p-3 rounded-xl text-sm leading-snug ${
                isSender
                  ? "ml-auto bg-[#dcf8c6] text-right rounded-br-none"
                  : "mr-auto bg-white text-left rounded-bl-none border"
              }`}
            >
              <div className='text-xs text-gray-500 mb-1 font-medium'>
                {msg.senderRole === "buyer"
                  ? `${t("buyer")}`
                  : `${t("supplier")}`}{" "}
                • {displayName}
              </div>
              <p className='whitespace-pre-wrap text-gray-800'>{msg.text}</p>
              <span className='text-[10px] text-gray-500 mt-1 block'>
                {msg.createdAt?.seconds
                  ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString(
                      locale,
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )
                  : ""}
              </span>
              <div
                className={`absolute w-0 h-0 border-t-8 border-b-8 top-2 ${
                  isSender
                    ? "right-[-8px] border-l-[8px] border-l-[#dcf8c6] border-t-transparent border-b-transparent"
                    : "left-[-8px] border-r-[8px] border-r-white border-t-transparent border-b-transparent"
                }`}
              />
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className='flex gap-2 mt-3'
      >
        <div className='relative group'>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='text-gray-500 hover:text-gray-800'
            tabIndex={-1}
          >
            <Paperclip size={20} />
          </Button>
          <div className='absolute bottom-10 left-0 z-10 hidden group-hover:block bg-white border rounded shadow text-sm text-gray-800 w-40'>
            <ul className='py-2'>
              {attachmentOptions.map((optKey) => (
                <li
                  key={optKey}
                  className='px-3 py-1 hover:bg-gray-100 cursor-pointer'
                >
                  {t(optKey)}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Input
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          placeholder={t("typeMessage")}
          className='flex-1'
        />

        <Button type='submit' className='bg-[#2c6449] text-white'>
          <SendHorizontal size={16} />
        </Button>
      </form>
    </div>
  );
};

export default ChatMessages;
