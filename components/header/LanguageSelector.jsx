"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

// List your supported locales
const LOCALES = [
  { code: "ar", label: "العربية" },
  { code: "en", label: "English" },
];

export default function LanguageSelector() {
  const router = useRouter();
  const pathname = usePathname();

  // Detect current locale from the path (assuming /[locale]/...)
  // Example: /ar/products → "ar"
  const pathLocale = pathname.split("/")[1];
  const currentLocale = LOCALES.some((l) => l.code === pathLocale)
    ? pathLocale
    : "en";

  const [open, setOpen] = useState(false);

  const changeLanguage = (newLocale) => {
    if (newLocale === currentLocale) {
      setOpen(false);
      return;
    }

    // Remove current locale from pathname and add the new one
    const segments = pathname.split("/");
    segments[1] = newLocale; // replace locale segment
    const newPath = segments.join("/") || "/";
    router.push(newPath);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant='ghost' className='flex items-center space-x-1'>
          <Globe size={18} />
          <span className='text-sm'>
            {LOCALES.find((l) => l.code === currentLocale)?.label ?? "Language"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align='end'
        className='w-40 text-sm z-[9999]'
        sideOffset={8}
        forceMount
      >
        {LOCALES.map(({ code, label }) => (
          <Button
            key={code}
            variant={currentLocale === code ? "default" : "ghost"}
            className='w-full justify-start'
            onClick={() => changeLanguage(code)}
          >
            {label}
          </Button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
