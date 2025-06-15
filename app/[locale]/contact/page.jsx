import ContactForm from "./form"; // Imports the client-side form

export const metadata = {
  title: {
    default: "Contact Us | Marsos",
    ar: "اتصل بنا | مرصوص",
  },
  description: {
    default:
      "Have a question about your order, a product detail, or need help with returns? Reach out to Marsos and we’ll respond within 1 business day. Friendly, efficient support for all your shopping needs.",
    ar: "هل لديك سؤال حول طلبك أو تفاصيل منتج، أو تحتاج إلى مساعدة في الإرجاع؟ تواصل مع مرصوص وسنرد عليك خلال يوم عمل واحد. دعم ودود وكفؤ لجميع احتياجات التسوق الخاصة بك.",
  },
  keywords: [
    "contact marsos",
    "marsos support",
    "order inquiry",
    "ecommerce customer support",
    "product question",
    "returns and exchanges",
    "marsos help",
  ],
  openGraph: {
    title: {
      default: "Contact Marsos",
      ar: "اتصل بمرصوص",
    },
    description: {
      default:
        "Let’s help you with your Marsos order or product question—no hassle, no jargon.",
      ar: "دعنا نساعدك في استفسارك عن طلبك في مرصوص أو سؤال المنتج—بدون تعقيد أو مصطلحات صعبة.",
    },
    url: "https://marsos.com/contact",
    siteName: "Marsos",
    images: [
      {
        url: "https://marsos.com/og-image-contact.jpg",
        width: 1200,
        height: 630,
        alt: "Contact Marsos Customer Support",
      },
    ],
    locale: "en_US",
    alternates: {
      languages: {
        ar: "https://marsos.com/ar/contact",
      },
    },
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: {
      default: "Contact Us | Marsos",
      ar: "اتصل بنا | مرصوص",
    },
    description: {
      default:
        "Get in touch about your order, returns, or product questions. Marsos support responds within 1 business day.",
      ar: "تواصل معنا حول طلبك أو الإرجاع أو استفسارات المنتج. يستجيب دعم مرصوص خلال يوم عمل واحد.",
    },
    images: ["https://marsos.com/og-image-contact.jpg"],
  },
  alternates: {
    languages: {
      ar: "/ar/contact",
    },
  },
};

export default function ContactPage() {
  return <ContactForm />;
}
