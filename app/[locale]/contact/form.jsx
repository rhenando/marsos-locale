"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

import { Phone, Mail, MapPin, Clock } from "lucide-react";
import Link from "next/link";

export default function ContactPage() {
  const router = useRouter();
  const [status, setStatus] = useState("idle");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "",
    subject: "",
    orderNumber: "",
    message: "",
    honeypot: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelect = (value) => {
    setFormData((prev) => ({ ...prev, category: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.honeypot) return;

    setStatus("submitting");

    try {
      await addDoc(collection(db, "contactMessages"), {
        name: formData.name,
        email: formData.email,
        category: formData.category,
        subject: formData.subject,
        orderNumber: formData.orderNumber || null,
        message: formData.message,
        status: "unread",
        createdAt: serverTimestamp(),
      });

      toast.success("✅ Your message has been sent!");
      setFormData({
        name: "",
        email: "",
        category: "",
        subject: "",
        orderNumber: "",
        message: "",
        honeypot: "",
      });
      setStatus("submitted");

      setTimeout(() => {
        router.push("/thank-you");
      }, 3000);
    } catch (err) {
      console.error("❌ Contact form error:", err);
      toast.error("Something went wrong. Please try again.");
      setStatus("error");
    }
  };

  return (
    <section className='px-6 py-16 max-w-6xl mx-auto'>
      <h1 className='text-4xl font-bold text-center mb-6'>Get in Touch</h1>
      <p className='text-muted-foreground text-center mb-12'>
        Need help with an order, have a question about our products, or want to
        request support? Fill out the form or reach us via the details below.
        Our team replies within 1 business day.
      </p>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-12'>
        {/* Left Column: Contact Details & FAQs */}
        <div className='space-y-8'>
          <div>
            <h2 className='text-2xl font-semibold mb-2'>Customer Support</h2>
            <ul className='space-y-2 text-gray-700'>
              <li className='flex items-center space-x-2'>
                <Phone className='w-5 h-5 text-primary' />
                <span>Phone:</span>
                <a
                  href='tel:+966530014707'
                  className='text-primary hover:underline'
                >
                  +966 53 001 4707
                </a>
              </li>
              <li className='flex items-center space-x-2'>
                <Mail className='w-5 h-5 text-primary' />
                <span>Email:</span>
                <a
                  href='mailto:support@marsos.com'
                  className='text-primary hover:underline'
                >
                  support@marsos.sa
                </a>
              </li>
              <li className='flex items-center space-x-2'>
                <MapPin className='w-5 h-5 text-primary' />
                <span>Address: 7253 Al Rayan, Rabwa, Riyadh, KSA</span>
              </li>
              <li className='flex items-center space-x-2'>
                <Clock className='w-5 h-5 text-primary' />
                <span>Hours: Mon–Thu, 9 AM–6 PM (GMT+3)</span>
              </li>
            </ul>
          </div>

          <div>
            <h2 className='text-2xl font-semibold mb-2'>FAQs</h2>
            <ul className='list-disc list-inside text-gray-700 space-y-1'>
              <li>
                <Link href='/' className='text-primary hover:underline'>
                  Shipping Information
                </Link>
              </li>
              <li>
                <Link href='/' className='text-primary hover:underline'>
                  Payment Options
                </Link>
              </li>
              <li>
                <Link href='/' className='text-primary hover:underline'>
                  Return Policy
                </Link>
              </li>
              <li>
                <Link href='/' className='text-primary hover:underline'>
                  Product Support
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: Contact Form */}
        <form
          onSubmit={handleSubmit}
          className='space-y-6 bg-white p-8 rounded-lg shadow-md'
          aria-label='Contact form'
        >
          <input
            type='text'
            name='honeypot'
            className='hidden'
            value={formData.honeypot}
            onChange={handleChange}
            autoComplete='off'
          />

          <div>
            <Label htmlFor='name'>Name</Label>
            <Input
              id='name'
              name='name'
              type='text'
              required
              value={formData.name}
              onChange={handleChange}
              placeholder='Your full name'
              className='mt-1'
            />
          </div>

          <div>
            <Label htmlFor='email'>Email</Label>
            <Input
              id='email'
              name='email'
              type='email'
              required
              value={formData.email}
              onChange={handleChange}
              placeholder='you@example.com'
              className='mt-1'
            />
          </div>

          <div>
            <Label htmlFor='category'>Category</Label>
            <Select
              onValueChange={handleSelect}
              value={formData.category}
              name='category'
            >
              <SelectTrigger id='category' className='mt-1 w-full'>
                <SelectValue placeholder='Select a category…' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='order'>Order Inquiry</SelectItem>
                <SelectItem value='returns'>Returns & Exchanges</SelectItem>
                <SelectItem value='product'>Product Question</SelectItem>
                <SelectItem value='technical'>Technical Support</SelectItem>
                <SelectItem value='other'>Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor='subject'>Subject</Label>
            <Input
              id='subject'
              name='subject'
              type='text'
              required
              value={formData.subject}
              onChange={handleChange}
              placeholder='Brief summary of your request'
              className='mt-1'
            />
          </div>

          <div>
            <Label htmlFor='orderNumber'>Order Number (optional)</Label>
            <Input
              id='orderNumber'
              name='orderNumber'
              type='text'
              value={formData.orderNumber}
              onChange={handleChange}
              placeholder='e.g., #MS-12345'
              className='mt-1'
            />
          </div>

          <div>
            <Label htmlFor='message'>Message</Label>
            <Textarea
              id='message'
              name='message'
              rows={5}
              required
              value={formData.message}
              onChange={handleChange}
              placeholder='Describe your issue or question…'
              className='mt-1'
            />
          </div>

          <Button
            type='submit'
            disabled={status === "submitting"}
            className='w-full bg-primary text-white py-3 rounded-lg hover:bg-primary/90 transition'
          >
            {status === "submitting" ? "Sending…" : "Send Message"}
          </Button>
        </form>
      </div>
    </section>
  );
}
