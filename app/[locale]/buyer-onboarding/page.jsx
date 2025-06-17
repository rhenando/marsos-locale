// app/buyer-onboarding/page.jsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/config";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";

const STEPS = ["authNun", "verifyDate", "completeDetails"];

const PHONE_CODES = ["+966", "+971", "+973", "+965", "+968", "+974", "+63"];

export default function BuyerOnboardingPage() {
  const router = useRouter();
  const t = useTranslations("admin-onboarding");
  const locale = useLocale();
  const isRtl = locale === "ar";

  // Progress
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 0
  const [nun, setNun] = useState("");

  // Step 1
  const [dateType, setDateType] = useState("hijri");
  const [issueDate, setIssueDate] = useState("");

  // Step 2: Company Details
  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [commercialReg, setCommercialReg] = useState("");
  const [crIssueG, setCrIssueG] = useState("");
  const [crIssueH, setCrIssueH] = useState("");
  const [crConfirmG, setCrConfirmG] = useState("");
  const [crConfirmH, setCrConfirmH] = useState("");
  const [vatRegNumber, setVatRegNumber] = useState("");
  const [companyPhoneCode, setCompanyPhoneCode] = useState("+966");
  const [companyPhone, setCompanyPhone] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("");
  const [address, setAddress] = useState("");

  // Step 2: Authorized Person
  const [authPersonName, setAuthPersonName] = useState("");
  const [authPersonEmail, setAuthPersonEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authPhoneCode, setAuthPhoneCode] = useState("+966");
  const [authPersonMobile, setAuthPersonMobile] = useState("");
  const [designation, setDesignation] = useState("");
  const [personalIdNumber, setPersonalIdNumber] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("unregisteredPhone");
      if (saved) {
        const match = PHONE_CODES.sort((a, b) => b.length - a.length).find(
          (code) => saved.startsWith(code)
        );
        if (match) {
          setAuthPhoneCode(match);
          setAuthPersonMobile(saved.slice(match.length));
        }
      }
    } catch (err) {
      console.warn("Could not read unregisteredPhone from localStorage", err);
    }
  }, []);

  const authenticateNun = async () => {
    if (!nun) {
      toast.error(t("nunRequired"));
      return;
    }
    setLoading(true);
    try {
      toast.success(t("authSuccess"));
      setStep(1);
    } catch {
      toast.error(t("authFailed"));
    } finally {
      setLoading(false);
    }
  };

  const verifyIssueDate = async () => {
    if (!issueDate) {
      toast.error(t("dateRequired"));
      return;
    }
    setLoading(true);
    try {
      toast.success(t("dateVerified"));
      setStep(2);
    } catch {
      toast.error(t("dateFailed"));
    } finally {
      setLoading(false);
    }
  };

  const submitOnboarding = async (e) => {
    e.preventDefault();
    if (
      !companyName ||
      !companyEmail ||
      !commercialReg ||
      !crIssueG ||
      !crIssueH ||
      !crConfirmG ||
      !crConfirmH ||
      !vatRegNumber ||
      !companyPhone ||
      !city ||
      !zipCode ||
      !country ||
      !address ||
      !authPersonName ||
      !authPersonEmail ||
      !authPassword ||
      !authPersonMobile ||
      !designation ||
      !personalIdNumber
    ) {
      toast.error(t("completeAllFields"));
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "users"), {
        phone: authPhoneCode + authPersonMobile,
        password: authPassword,
        nun,
        dateType,
        issueDate,
        companyName,
        companyEmail,
        commercialReg,
        crIssueG,
        crIssueH,
        crConfirmG,
        crConfirmH,
        vatRegNumber,
        companyPhone: companyPhoneCode + companyPhone,
        city,
        zipCode,
        country,
        address,
        authPersonName,
        authPersonEmail,
        authPersonMobile: authPhoneCode + authPersonMobile,
        designation,
        personalIdNumber,
        role: "buyer",
        approved: false,
        createdAt: serverTimestamp(),
      });
      toast.success(t("submitted"));
      router.push("/pending");
    } catch (err) {
      console.error(err);
      toast.error(t("submitFailed"));
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <>
            <label className='block text-sm font-medium text-gray-700'>
              {t("nun")} *
            </label>
            <input
              value={nun}
              onChange={(e) => setNun(e.target.value)}
              placeholder={t("nun")}
              className='mt-1 w-full p-2 border rounded'
            />
            <button
              onClick={authenticateNun}
              disabled={loading}
              className='mt-6 w-full bg-primary text-white py-2 rounded'
            >
              {loading ? t("authenticating") : t("authenticate")}
            </button>
          </>
        );
      case 1:
        return (
          <>
            <div className='flex items-center gap-4 mb-4'>
              <label className='inline-flex items-center space-x-2'>
                <input
                  type='radio'
                  name='dateType'
                  value='hijri'
                  checked={dateType === "hijri"}
                  onChange={() => setDateType("hijri")}
                  className='h-4 w-4 text-primary border-gray-300'
                />
                <span>{t("hijri")}</span>
              </label>
              <label className='inline-flex items-center space-x-2'>
                <input
                  type='radio'
                  name='dateType'
                  value='gregorian'
                  checked={dateType === "gregorian"}
                  onChange={() => setDateType("gregorian")}
                  className='h-4 w-4 text-primary border-gray-300'
                />
                <span>{t("gregorian")}</span>
              </label>
            </div>
            <div className='mt-4'>
              <label className='block text-sm font-medium text-gray-700'>
                {t("issueDate")} *
              </label>
              <input
                type='date'
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className='mt-1 w-full p-2 border rounded'
              />
            </div>
            <button
              onClick={verifyIssueDate}
              disabled={loading}
              className='mt-6 w-full bg-primary text-white py-2 rounded'
            >
              {loading ? t("verifyingDate") : t("verify")}
            </button>
          </>
        );
      case 2:
        return (
          <form
            onSubmit={submitOnboarding}
            className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'
          >
            <fieldset className='space-y-3'>
              <legend className='text-base sm:text-lg font-semibold text-[#2c6449] mb-2'>
                {t("companyDetails")}
              </legend>

              <div>
                <label className='block mb-1'>{t("companyName")}</label>
                <input
                  name='companyName'
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  placeholder={t("companyName")}
                  className='w-full p-1 border rounded text-sm'
                />
              </div>

              <div>
                <label className='block mb-1'>{t("companyEmail")}</label>
                <input
                  type='email'
                  name='companyEmail'
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  required
                  placeholder={t("companyEmail")}
                  className='w-full p-1 border rounded text-sm'
                />
              </div>

              <div>
                <label className='block mb-1'>{t("nun")}</label>
                <input
                  name='nun'
                  value={nun}
                  readOnly
                  className='w-full p-1 border rounded bg-gray-100 text-sm'
                />
              </div>

              <div>
                <label className='block mb-1'>{t("commercialReg")}</label>
                <input
                  name='commercialReg'
                  value={commercialReg}
                  onChange={(e) => setCommercialReg(e.target.value)}
                  required
                  placeholder={t("commercialReg")}
                  className='w-full p-1 border rounded text-sm'
                />
              </div>

              <div className='grid grid-cols-2 gap-2'>
                <div>
                  <label className='block mb-1'>{t("crIssueG")}</label>
                  <input
                    type='date'
                    name='crIssueG'
                    value={crIssueG}
                    onChange={(e) => setCrIssueG(e.target.value)}
                    required
                    className='w-full p-1 border rounded text-sm'
                  />
                </div>
                <div>
                  <label className='block mb-1'>{t("crIssueH")}</label>
                  <input
                    type='date'
                    name='crIssueH'
                    value={crIssueH}
                    onChange={(e) => setCrIssueH(e.target.value)}
                    required
                    className='w-full p-1 border rounded text-sm'
                  />
                </div>
              </div>

              <div className='grid grid-cols-2 gap-2'>
                <div>
                  <label className='block mb-1'>{t("crConfirmG")}</label>
                  <input
                    type='date'
                    name='crConfirmG'
                    value={crConfirmG}
                    onChange={(e) => setCrConfirmG(e.target.value)}
                    required
                    className='w-full p-1 border rounded text-sm'
                  />
                </div>
                <div>
                  <label className='block mb-1'>{t("crConfirmH")}</label>
                  <input
                    type='date'
                    name='crConfirmH'
                    value={crConfirmH}
                    onChange={(e) => setCrConfirmH(e.target.value)}
                    required
                    className='w-full p-1 border rounded text-sm'
                  />
                </div>
              </div>

              <div>
                <label className='block mb-1'>{t("vatRegNumber")}</label>
                <input
                  name='vatRegNumber'
                  value={vatRegNumber}
                  onChange={(e) => setVatRegNumber(e.target.value)}
                  required
                  placeholder={t("vatRegNumber")}
                  className='w-full p-1 border rounded text-sm'
                />
              </div>

              <div>
                <label className='block mb-1'>{t("companyPhone")}</label>
                <div className='flex'>
                  <select
                    value={companyPhoneCode}
                    onChange={(e) => setCompanyPhoneCode(e.target.value)}
                    className='p-1 border rounded-l text-sm bg-gray-50'
                  >
                    {PHONE_CODES.map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </select>
                  <input
                    type='tel'
                    name='companyPhone'
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    required
                    placeholder={t("companyPhone")}
                    className='flex-1 p-1 border rounded-r text-sm'
                  />
                </div>
              </div>

              <div>
                <label className='block mb-1'>{t("city")}</label>
                <input
                  name='city'
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  placeholder={t("city")}
                  className='w-full p-1 border rounded text-sm'
                />
              </div>

              <div>
                <label className='block mb-1'>{t("zipCode")}</label>
                <input
                  name='zipCode'
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  required
                  placeholder={t("zipCode")}
                  className='w-full p-1 border rounded text-sm'
                />
              </div>

              <div>
                <label className='block mb-1'>{t("country")}</label>
                <input
                  name='country'
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  required
                  placeholder={t("country")}
                  className='w-full p-1 border rounded text-sm'
                />
              </div>

              <div>
                <label className='block mb-1'>{t("address")}</label>
                <textarea
                  name='address'
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  rows={3}
                  placeholder={t("address")}
                  className='w-full p-1 border rounded text-sm'
                />
              </div>
            </fieldset>

            <fieldset className='space-y-3'>
              <legend className='text-base sm:text-lg font-semibold text-[#2c6449] mb-2'>
                {t("authorizedPerson")}
              </legend>

              <div>
                <label className='block mb-1'>{t("authPersonName")}</label>
                <input
                  name='authPersonName'
                  value={authPersonName}
                  onChange={(e) => setAuthPersonName(e.target.value)}
                  required
                  placeholder={t("authPersonName")}
                  className='w-full p-1 border rounded text-sm'
                />
              </div>

              <div className='bg-yellow-50 p-2 rounded'>
                <label className='block mb-1 font-medium text-[#2c6449]'>
                  {t("authPersonEmail")}
                </label>
                <input
                  type='email'
                  name='authPersonEmail'
                  value={authPersonEmail}
                  onChange={(e) => setAuthPersonEmail(e.target.value)}
                  required
                  placeholder={t("authPersonEmail")}
                  className='w-full p-1 border rounded text-sm'
                />
              </div>

              <div className='bg-yellow-50 p-2 rounded'>
                <label className='block mb-1 font-medium text-[#2c6449]'>
                  {t("authPassword")}
                </label>
                <input
                  type='password'
                  name='authPassword'
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  required
                  placeholder={t("authPassword")}
                  className='w-full p-1 border rounded text-sm'
                />
              </div>

              <div className='bg-yellow-50 p-2 rounded'>
                <label className='block mb-1 font-medium text-[#2c6449]'>
                  {t("authPhone")}
                </label>
                <div className='flex'>
                  <select
                    value={authPhoneCode}
                    onChange={(e) => setAuthPhoneCode(e.target.value)}
                    className='p-1 border rounded-l text-sm bg-gray-50'
                  >
                    {PHONE_CODES.map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </select>
                  <input
                    type='tel'
                    name='authPersonMobile'
                    value={authPersonMobile}
                    onChange={(e) => setAuthPersonMobile(e.target.value)}
                    required
                    placeholder={t("authPersonMobile")}
                    className='flex-1 p-1 border rounded-r text-sm'
                  />
                </div>
              </div>

              <div>
                <label className='block mb-1'>{t("designation")}</label>
                <input
                  name='designation'
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  required
                  placeholder={t("designation")}
                  className='w-full p-1 border rounded text-sm'
                />
              </div>

              <div>
                <label className='block mb-1'>{t("personalIdNumber")}</label>
                <input
                  name='personalIdNumber'
                  value={personalIdNumber}
                  onChange={(e) => setPersonalIdNumber(e.target.value)}
                  required
                  placeholder={t("personalIdNumber")}
                  className='w-full p-1 border rounded text-sm'
                />
              </div>
            </fieldset>

            <button
              type='submit'
              disabled={loading}
              className='bg-[#2c6449] text-white text-sm py-2 rounded md:col-span-2'
            >
              {loading ? t("uploading") : t("submit")}
            </button>
          </form>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className='min-h-[80vh] flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8'
      dir={isRtl ? "rtl" : "ltr"}
    >
      <Card className='w-full max-w-md sm:max-w-2xl bg-white shadow-lg rounded-lg h-full'>
        <CardContent className='px-4 sm:px-6 md:px-8 py-10 flex flex-col h-full'>
          <h1 className='text-2xl font-bold text-gray-900 text-center mb-6'>
            {t("title")}
          </h1>
          {/* Step Indicator */}
          <div className='flex flex-wrap justify-center mb-8 gap-4 text-xs sm:text-sm'>
            {STEPS.map((key, i) => (
              <div key={key} className='flex items-center gap-2'>
                <div
                  className={`w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full ${
                    i === step
                      ? "bg-primary text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {i + 1}
                </div>
                <span
                  className={`whitespace-nowrap ${
                    i === step ? "font-semibold text-primary" : ""
                  }`}
                >
                  {t(key)}
                </span>
              </div>
            ))}
          </div>
          <div className='flex-1 overflow-auto'>{renderStepContent()}</div>
        </CardContent>
      </Card>
    </div>
  );
}
