import { Link, createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  Building2,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  FileText,
  Gavel,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Quote,
  Scale,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Video,
} from "lucide-react";
import heroImage from "@/assets/hero-lawyer.jpg";
import { NyayaAIWidget } from "@/components/ai/NyayaAI";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LAWYERS, LEGAL_CATEGORIES } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Legal Consultancy Service — Smart Legal Consultation Platform" },
      {
        name: "description",
        content:
          "Book verified lawyers online, share documents securely, pay safely and get instant guidance across 25+ legal categories.",
      },
      { property: "og:title", content: "Legal Consultancy Service — Smart Legal Consultation Platform" },
      {
        property: "og:description",
        content:
          "Verified advocates, online consultations, secure documents and AI legal guidance in one premium platform.",
      },
    ],
  }),
  component: Landing,
});

const STATS = [
  { value: "100+", label: "Verified Lawyers" },
  { value: "1000+", label: "Consultations" },
  { value: "25+", label: "Legal Categories" },
  { value: "4.9★", label: "Average Rating" },
];

const FEATURES = [
  {
    icon: BadgeCheck,
    title: "Bar-verified advocates",
    body: "Every lawyer is checked against Bar Council registration, practice history and client outcomes before going live.",
  },
  {
    icon: CalendarClock,
    title: "Real-time availability",
    body: "See open slots for the next 14 days and lock a consultation in under a minute — no phone tag, no waiting rooms.",
  },
  {
    icon: Video,
    title: "Consult your way",
    body: "Video, audio, chat or in-person. Encrypted rooms, shareable notes and automatic follow-up reminders.",
  },
  {
    icon: FileText,
    title: "Secure document vault",
    body: "Upload FIRs, deeds and agreements once. Share selectively with your advocate and revoke access anytime.",
  },
  {
    icon: Bot,
    title: "TekoraAI guidance",
    body: "Understand your situation before you spend. TekoraAI identifies your case category and drafts your questions.",
  },
  {
    icon: CreditCard,
    title: "Escrow-style payments",
    body: "Transparent fees, UPI and cards, GST invoices and refunds handled by the platform, not by chat messages.",
  },
];

const STEPS = [
  { icon: Search, title: "Describe your matter", body: "Search by category or let TekoraAI classify your issue in seconds." },
  { icon: Gavel, title: "Pick a verified lawyer", body: "Compare experience, languages, fees and genuine client reviews." },
  { icon: CalendarClock, title: "Book a slot", body: "Choose date, time and consultation mode, then upload documents." },
  { icon: ShieldCheck, title: "Consult & resolve", body: "Join securely, get written next steps and a downloadable invoice." },
];

const TESTIMONIALS = [
  {
    name: "Rohit Deshmukh",
    role: "Founder, SaaS Company",
    text: "Saved us weeks of back-and-forth on our founder agreement. Adv. Rajeshwar was spot on, and the document vault made sharing drafts effortless.",
  },
  {
    name: "Meera Krishnan",
    role: "Property Buyer, Bengaluru",
    text: "Title verification completed within 24 hours. The advocate flagged two missing encumbrance entries that the broker conveniently skipped.",
  },
  {
    name: "Adv. Siddharth Rao",
    role: "High Court of Karnataka",
    text: "The best consultation platform I've used. Clients come with uploaded documents and clear questions, which makes every 30-minute slot meaningful.",
  },
];

const FAQS = [
  {
    q: "How are advocates verified on Legal Consultancy Service?",
    a: "Every advocate must submit their State Bar Council enrolment certificate and undergo credential validation by our Admin panel. Only advocates in good standing with active practice records are approved.",
  },
  {
    q: "How does the document vault protect client confidentiality?",
    a: "Documents are stored with 256-bit AES encryption. Only you and your explicitly chosen advocate can view them during and after the consultation.",
  },
  {
    q: "Can I get a refund if the advocate misses the scheduled consultation?",
    a: "Yes. All consultation fees are held in an escrow mechanism until the session concludes. If an advocate does not join, you can reschedule immediately or receive an instant 100% refund.",
  },
  {
    q: "How do I get an official tax invoice / receipt for my consultation?",
    a: "As soon as your payment is processed via Razorpay or UPI, a GST-compliant Consultation Tax Invoice is generated automatically. You can view or download it anytime.",
  },
  {
    q: "What languages does the AI Legal Assistant (TekoraAI) support?",
    a: "TekoraAI natively understands English, Hindi, and Kannada, helping you analyze legal notices, translate legal terminology, and structure questions for your advocate.",
  },
];

function Landing() {
  // Contact Form State
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactCategory, setContactCategory] = useState("General Legal Inquiry");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSubmitting, setContactSubmitting] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setContactSubmitting(true);
    await new Promise((r) => setTimeout(r, 1000));
    toast.success("Thank you! Your legal inquiry has been submitted. Our legal desk will contact you within 2 hours.");
    setContactName("");
    setContactEmail("");
    setContactPhone("");
    setContactMessage("");
    setContactSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-hero py-20 text-[oklch(0.98_0.004_250)] sm:py-28">
        <div className="pointer-events-none absolute -left-40 top-1/2 size-96 -translate-y-1/2 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-10 size-80 rounded-full bg-gold/15 blur-3xl" />

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-amber-300 backdrop-blur">
              <Sparkles className="size-3.5" />
              India's Premier Legal Consultation Platform
            </span>

            <h1 className="mt-6 font-serif text-4xl leading-tight sm:text-5xl lg:text-6xl text-[oklch(0.98_0.004_250)]">
              Verified legal advice. <br />
              <span className="text-gold italic">Zero confusion.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-[oklch(0.85_0.02_250)] sm:text-lg">
              Consult with Bar-verified advocates across 25+ practice areas. Secure encrypted document vault,
              upfront escrow payments, and instant AI legal guidance in your language.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="rounded-full bg-gold px-7 text-[oklch(0.22_0.045_260)] font-semibold hover:opacity-90 shadow-lift">
                <Link to="/get-started">
                  Find an Advocate <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-white/30 bg-white/5 px-7 text-[oklch(0.96_0.006_250)] hover:bg-white/15 hover:text-[oklch(0.98_0.004_250)]"
              >
                <Link to="/auth/$role/login" params={{ role: "lawyer" }}>Advocate Portal</Link>
              </Button>
            </div>

            <dl className="mt-12 grid grid-cols-2 gap-6 border-t border-white/15 pt-8 sm:grid-cols-4">
              {STATS.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.08 }}
                >
                  <dt className="text-2xl font-bold font-serif text-gold sm:text-3xl">{s.value}</dt>
                  <dd className="mt-1 text-xs text-[oklch(0.82_0.02_250)] sm:text-sm">{s.label}</dd>
                </motion.div>
              ))}
            </dl>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative mx-auto w-full max-w-md"
          >
            <img
              src={heroImage}
              alt="Verified advocate available for consultation on Legal Consultancy Service"
              width={1200}
              height={1408}
              className="w-full rounded-[2rem] object-cover shadow-lift"
            />
            <div className="glass absolute -bottom-6 -left-6 hidden rounded-2xl p-4 shadow-lift sm:block">
              <p className="text-xs text-amber-500 font-semibold flex items-center gap-1">
                <Bot className="size-3.5" /> TekoraAI Legal Assistant
              </p>
              <p className="mt-1 text-sm font-bold">Multilingual Guidance</p>
              <p className="mt-1 text-xs text-muted-foreground">English · हिन्दी · ಕನ್ನಡ</p>
            </div>
            <div className="glass absolute -right-4 top-8 hidden rounded-2xl px-4 py-3 shadow-lift sm:block">
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                <Star className="size-4 fill-accent text-accent" /> 4.9 / 5.0
              </p>
              <p className="text-xs text-muted-foreground">1,000+ Consultations</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-20 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <Badge variant="secondary" className="rounded-full">Legal Services & Categories</Badge>
            <h2 className="mt-4 text-3xl font-serif sm:text-4xl text-foreground">
              Expert legal counsel across 25+ practice domains
            </h2>
            <p className="mt-3 text-muted-foreground">
              Whether you need urgent bail assistance, property title verification, or startup contract drafting, our verified advocates are ready.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/get-started">View all 25+ categories</Link>
          </Button>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {LEGAL_CATEGORIES.map((c, i) => {
            const count = 12 + ((i * 7) % 24);
            return (
              <Link
                key={c}
                to="/get-started"
                className="group rounded-2xl border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:border-primary hover:shadow-lift"
              >
                <div className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Scale className="size-5" />
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full">
                    Verified
                  </span>
                </div>
                <p className="mt-4 font-bold text-base text-foreground group-hover:text-primary transition-colors">
                  {c}
                </p>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {count} Verified Advocates · From ₹{1200 + i * 150}
                </p>
                <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary">
                  <span>Book Consultation</span>
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="scroll-mt-24 bg-secondary/50 py-20 border-y border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <Badge variant="secondary" className="rounded-full bg-background">About Our Platform</Badge>
              <h2 className="mt-4 text-3xl font-serif sm:text-4xl text-foreground leading-snug">
                Built to make high-quality legal consultation transparent, secure & accessible.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Legal Consultancy Service was founded to eliminate the friction, opacity, and uncertainty in legal consulting across India. We bridge the gap between citizens seeking trusted counsel and senior advocates practicing before the Supreme Court, High Courts, and District Tribunals.
              </p>

              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <CheckCircle2 className="size-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">100% Bar Council Verified Advocates</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Every practitioner's enrolment number, court experience, and disciplinary record are authenticated by administrators.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">Bank-Grade 256-Bit SSL & Vault Privacy</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Client-attorney privileged documents (FIRs, wills, agreements) are encrypted end-to-end and shared only upon authorization.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <CreditCard className="size-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">Escrow Payment Protection & Tax Invoices</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Fees remain safely locked until consultation completion. Full GST invoices and instant receipts provided.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card className="p-6 rounded-2xl bg-card border-border shadow-soft">
                <Building2 className="size-8 text-primary mb-3" />
                <h3 className="font-bold text-2xl font-serif text-foreground">20+</h3>
                <p className="text-xs text-muted-foreground mt-1">High Courts & Appellate Tribunals Covered</p>
              </Card>
              <Card className="p-6 rounded-2xl bg-card border-border shadow-soft">
                <Users className="size-8 text-primary mb-3" />
                <h3 className="font-bold text-2xl font-serif text-foreground">1,000+</h3>
                <p className="text-xs text-muted-foreground mt-1">Satisfied Clients Counseled</p>
              </Card>
              <Card className="p-6 rounded-2xl bg-card border-border shadow-soft">
                <Scale className="size-8 text-primary mb-3" />
                <h3 className="font-bold text-2xl font-serif text-foreground">99.4%</h3>
                <p className="text-xs text-muted-foreground mt-1">Consultation Completion Rate</p>
              </Card>
              <Card className="p-6 rounded-2xl bg-card border-border shadow-soft">
                <ShieldCheck className="size-8 text-primary mb-3" />
                <h3 className="font-bold text-2xl font-serif text-foreground">₹0</h3>
                <p className="text-xs text-muted-foreground mt-1">Hidden Charges or Surprise Extra Fees</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <Badge variant="secondary" className="rounded-full">Why Choose Us</Badge>
          <h2 className="mt-4 text-3xl font-serif sm:text-4xl text-foreground">Everything your legal matter needs</h2>
          <p className="mt-3 text-muted-foreground">
            From preliminary AI case structuring to courtroom-ready advocate consultations, we provide a unified workspace.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
            >
              <Card className="h-full rounded-2xl p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift border-border">
                <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="size-5" />
                </span>
                <h3 className="mt-4 text-lg font-bold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-24 bg-secondary/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <Badge variant="secondary" className="rounded-full bg-background">How it works</Badge>
            <h2 className="mt-4 text-3xl font-serif sm:text-4xl text-foreground">Four steps from confusion to clarity</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <Card key={s.title} className="relative h-full rounded-2xl p-6 shadow-soft border-border">
                <span className="absolute right-5 top-5 text-4xl font-bold text-muted-foreground/20 font-serif">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground">
                  <s.icon className="size-5" />
                </span>
                <h3 className="mt-4 text-base font-bold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="scroll-mt-24 bg-background py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <Badge variant="secondary" className="rounded-full">Client Experiences</Badge>
            <h2 className="mt-4 text-3xl font-serif sm:text-4xl text-foreground">Trusted by clients and advocates alike</h2>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <Card key={t.name} className="h-full rounded-2xl p-6 shadow-soft border-border">
                <Quote className="size-7 text-gold" />
                <p className="mt-4 text-sm leading-relaxed text-foreground">{t.text}</p>
                <div className="mt-5 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="mt-3 text-sm font-bold text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="scroll-mt-24 bg-secondary/40 py-20 border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <Badge variant="secondary" className="rounded-full bg-background">Contact Us</Badge>
              <h2 className="mt-4 text-3xl font-serif sm:text-4xl text-foreground">
                Get in touch with our Legal Support Desk
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Have a question about booking an advocate, corporate partnerships, or need urgent grievance support? We're here to assist.
              </p>

              <div className="mt-8 space-y-5">
                <div className="flex items-center gap-4">
                  <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Phone className="size-5" />
                  </span>
                  <div>
                    <p className="text-xs text-muted-foreground">Toll-Free Legal Helpline</p>
                    <p className="text-sm font-bold text-foreground">1800-202-LEGAL (Mon-Sat, 9am - 8pm)</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Mail className="size-5" />
                  </span>
                  <div>
                    <p className="text-xs text-muted-foreground">General & Corporate Inquiries</p>
                    <p className="text-sm font-bold text-foreground">support@legalconsultancy.in</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                    <MapPin className="size-5" />
                  </span>
                  <div>
                    <p className="text-xs text-muted-foreground">Headquarters</p>
                    <p className="text-sm font-bold text-foreground">
                      Level 14, Supreme Business Towers, BKC, Mumbai, MH 400051
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Contact Form */}
            <Card className="p-8 rounded-3xl border-border bg-card shadow-soft">
              <h3 className="text-xl font-bold font-serif text-foreground">Send us a message</h3>
              <p className="text-xs text-muted-foreground mt-1">Our team typically responds within 2 hours.</p>

              <form onSubmit={handleContactSubmit} className="mt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Your Name *</label>
                    <Input
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="e.g. Priya Sharma"
                      className="rounded-xl h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Email Address *</label>
                    <Input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="priya@example.com"
                      className="rounded-xl h-11"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Phone Number</label>
                    <Input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="rounded-xl h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Case / Inquiry Category</label>
                    <select
                      value={contactCategory}
                      onChange={(e) => setContactCategory(e.target.value)}
                      className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="General Legal Inquiry">General Legal Inquiry</option>
                      <option value="Criminal Defense / Bail">Criminal Defense / Bail</option>
                      <option value="Property / RERA Matter">Property / RERA Matter</option>
                      <option value="Corporate / Contracts">Corporate / Contracts</option>
                      <option value="Family / Matrimonial">Family / Matrimonial</option>
                      <option value="Advocate Enrolment Query">Advocate Enrolment Query</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Your Message or Query *</label>
                  <Textarea
                    required
                    rows={4}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="Briefly describe your legal inquiry or requirement..."
                    className="rounded-xl resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={contactSubmitting}
                  className="w-full rounded-xl h-11 font-semibold gap-2 shadow-soft"
                >
                  {contactSubmitting ? (
                    "Sending Message…"
                  ) : (
                    <>
                      <Send className="size-4" /> Send Inquiry
                    </>
                  )}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-4 py-20 sm:px-6">
        <div className="text-center">
          <Badge variant="secondary" className="rounded-full">FAQ</Badge>
          <h2 className="mt-4 text-3xl font-serif sm:text-4xl text-foreground">Frequently Asked Questions</h2>
        </div>
        <Accordion type="single" collapsible className="mt-8">
          {FAQS.map((f) => (
            <AccordionItem key={f.q} value={f.q} className="border-b border-border">
              <AccordionTrigger className="text-left text-base font-semibold">{f.q}</AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-hero px-6 py-14 text-center shadow-lift sm:px-12">
          <div className="pointer-events-none absolute -right-16 -top-16 size-72 rounded-full bg-accent/20 blur-3xl" />
          <h2 className="relative font-serif text-3xl text-[oklch(0.98_0.004_250)] sm:text-4xl">
            Your first step towards clarity begins now
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-[oklch(0.85_0.02_250)] text-sm sm:text-base">
            Ask TekoraAI about your situation for free, then connect with verified legal counsel when you're ready.
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="rounded-full bg-gold px-7 text-[oklch(0.22_0.045_260)] font-bold hover:opacity-90">
              <Link to="/get-started">Get Started</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-white/30 bg-white/5 px-7 text-[oklch(0.96_0.006_250)] hover:bg-white/15 hover:text-[oklch(0.98_0.004_250)]"
            >
              <Link to="/auth/$role/login" params={{ role: "client" }}>Client Login</Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
      <NyayaAIWidget />
    </div>
  );
}
