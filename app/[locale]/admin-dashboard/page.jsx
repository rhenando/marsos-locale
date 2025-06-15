"use client";

import { useTranslations } from "next-intl"; // ① Import
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DollarSign, Users, CreditCard, Activity } from "lucide-react";

export default function AdminDashboardPage() {
  const t = useTranslations("Admin-Dashboard"); // ② Load translations under "Dashboard" namespace

  return (
    <>
      <h1 className='text-2xl font-bold mb-6'>{t("title")}</h1>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex justify-between items-center'>
            <CardTitle className='text-sm'>{t("totalRevenue")}</CardTitle>
            <DollarSign className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>SAR 0</div>
            <p className='text-sm text-muted-foreground'>0%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex justify-between items-center'>
            <CardTitle className='text-sm'>{t("activeUsers")}</CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>0</div>
            <p className='text-sm text-muted-foreground'>0%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex justify-between items-center'>
            <CardTitle className='text-sm'>{t("transactions")}</CardTitle>
            <CreditCard className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>0</div>
            <p className='text-sm text-muted-foreground'>0%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex justify-between items-center'>
            <CardTitle className='text-sm'>{t("analytics")}</CardTitle>
            <Activity className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>0%</div>
            <p className='text-sm text-muted-foreground'>{t("stable")}</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
