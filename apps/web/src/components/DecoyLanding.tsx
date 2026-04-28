"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Table, ChevronRight, FileSpreadsheet, Shield, Star } from "lucide-react";
import { CovertLogin } from "./CovertLogin";

const KONAMI = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
  "b", "a",
];

interface Review {
  author: string;
  rating: number;
  date: string;
  text: string;
}

interface Service {
  id: string;
  name: string;
  tagline: string;
  description: string;
  features: string[];
  startingPrice: string;
  turnaround: string;
  reviews: Review[];
  badge?: string;
}

const services: Service[] = [
  {
    id: "feline-tax",
    name: "Whiskers & Associates",
    tagline: "Feline Tax Preparation Since 1987",
    description:
      "Your cat cannot read. Your cat cannot sign. Your cat has no concept of fiscal years. And yet, the IRS does not care. Our certified feline tax preparers specialize in Schedule C for independent contractors of the scratching-post economy, 1099-MISC for mousers, and aggressive depreciation of cat trees.",
    features: [
      "Litter box deduction maximization",
      "Fish income amortization schedules",
      "Nine-life estate planning",
      "Hairball-related medical expense itemization",
    ],
    startingPrice: "$347 per whisker",
    turnaround: "2-4 business naps",
    badge: "IRS Meowthorized",
    reviews: [
      {
        author: "Margaret H., owner of Mr. Mittens",
        rating: 5,
        date: "2025-04-12",
        text: "Mr. Mittens received a $4,200 refund. He slept through the entire appointment. 10/10.",
      },
      {
        author: "Dr. Rajesh P., DVM",
        rating: 4,
        date: "2025-03-28",
        text: "Professional, thorough, and they did not flinch when my patient knocked every document off the table. The tuna-scented W-2s were a nice touch.",
      },
      {
        author: "Chairman Meow (verified feline client)",
        rating: 5,
        date: "2025-02-14",
        text: "...",
      },
    ],
  },
  {
    id: "redundancy-dept",
    name: "Department of Redundancy Department",
    tagline: "Repeatedly Repeating Repeated Processes",
    description:
      "Are you tired of only doing things once? Do you yearn for unnecessary duplication? The DRD offers triple-verified, cross-referenced, redundantly redundant redundancy services. We check our checks. We review our reviews. We validate our validations. And then we do it again.",
    features: [
      "Duplicate duplicate forms",
      "Redundant backup backups",
      "Pre-approved approval pre-approvals",
      "Circular reference cross-referencing",
    ],
    startingPrice: "$500 (billed twice)",
    turnaround: "7-10 business days (estimated twice)",
    badge: "Certified Redundant",
    reviews: [
      {
        author: "Bureaucrat #7342",
        rating: 5,
        date: "2025-04-01",
        text: "I submitted one request. They processed it twice. I received two confirmations confirming the same confirmation. Exactly what I needed.",
      },
      {
        author: "Bureaucrat #7342",
        rating: 5,
        date: "2025-04-01",
        text: "I submitted one request. They processed it twice. I received two confirmations confirming the same confirmation. Exactly what I needed.",
      },
      {
        author: "Quality Assurance Analyst",
        rating: 5,
        date: "2025-03-15",
        text: "Their form 27-B/6 requires you to fill out form 27-B/6. I have never been more satisfied with a paradox.",
      },
    ],
  },
  {
    id: "retrospect-markets",
    name: "Retrospect Markets",
    tagline: "The Future is History",
    description:
      "Why gamble on uncertain outcomes when you can bet on events that have already happened? Retrospect Markets offers liquidity on historical events with 100% known outcomes. Our proprietary hindsight engine guarantees zero volatility. All events are past tense. All results are final. No refunds.",
    features: [
      "1929 Crash: Over/Under 89% decline",
      "Y2K Bug: Will it happen? (Spoiler: No)",
      "Dinosaurs: Extinction prop bets settled",
      "Titanic Float Duration futures",
    ],
    startingPrice: "$100 minimum (paid in 1910 dollars)",
    turnaround: "Resolves immediately (retroactively)",
    badge: "20/20 Hindsight",
    reviews: [
      {
        author: "Time-Traveling Day Trader",
        rating: 1,
        date: "1847-05-03",
        text: "I tried to short the tulip mania but the platform insisted it had already happened. This is blatant temporal discrimination.",
      },
      {
        author: "Nostradamus (verified)",
        rating: 5,
        date: "1555-07-20",
        text: "I predicted I would give this five stars. The prophecy is fulfilled.",
      },
      {
        author: "History Professor, PhD",
        rating: 4,
        date: "2025-01-10",
        text: "The odds on the fall of Rome were insultingly low. It definitely happened. I have a book about it.",
      },
    ],
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3.5 w-3.5 ${star <= rating ? "fill-amber-400 text-amber-400" : "text-stone-300"}`}
        />
      ))}
    </div>
  );
}

export function DecoyLanding() {
  const [showLogin, setShowLogin] = useState(false);
  const [konamiIndex, setKonamiIndex] = useState(0);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === KONAMI[konamiIndex]) {
        const next = konamiIndex + 1;
        if (next === KONAMI.length) {
          setShowLogin(true);
          setKonamiIndex(0);
        } else {
          setKonamiIndex(next);
        }
      } else {
        setKonamiIndex(0);
      }
    },
    [konamiIndex]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-900">
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-600 p-2">
              <Table className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-lg tracking-tight">IASE</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <a href="#about" className="hover:text-slate-900">About</a>
            <a href="#events" className="hover:text-slate-900">Events</a>
            <a href="#membership" className="hover:text-slate-900">Membership</a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            International Association of{" "}
            <span className="text-emerald-700">Spreadsheet Enthusiasts</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Promoting excellence in spreadsheet craftsmanship since 1987.
            Join thousands of professionals who believe every cell tells a story.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {[
            { icon: FileSpreadsheet, title: "Best Practices", desc: "Learn formatting standards from industry veterans." },
            { icon: Shield, title: "Data Integrity", desc: "Master validation techniques that prevent errors." },
            { icon: Table, title: "Community", desc: "Connect with fellow enthusiasts worldwide." },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="rounded-xl border bg-white p-6 shadow-sm"
            >
              <item.icon className="h-8 w-8 text-emerald-600 mb-4" />
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-slate-600">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="rounded-2xl border bg-white p-8 md:p-12 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-emerald-100 p-3">
              <ChevronRight className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Annual Conference 2025</h2>
              <p className="text-slate-600 mb-4">
                Join us in Des Moines for three days of pivot tables, VLOOKUP deep-dives,
                and conditional formatting workshops.
              </p>
              <button className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
                Register Now <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Services Section */}
      <section className="border-t-2 border-stone-900 bg-stone-50">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="mb-12 flex items-baseline gap-4">
            <h2 className="text-3xl font-black tracking-tight uppercase">
              Professional Services
            </h2>
            <span className="rounded-full bg-stone-900 px-3 py-1 text-xs font-bold uppercase tracking-wider text-stone-50">
              Form 27-B/6 Required
            </span>
          </div>
          <p className="mb-12 text-lg text-stone-600">
            Impossible problems. Improbable solutions. Invoices due net 30.
          </p>

          <div className="space-y-16">
            {services.map((service, index) => (
              <article
                key={service.id}
                className="relative border-2 border-stone-900 bg-white"
              >
                <div className="absolute -left-3 -top-3 flex h-10 w-10 items-center justify-center border-2 border-stone-900 bg-stone-900 text-sm font-black text-stone-50">
                  {String(index + 1).padStart(2, "0")}
                </div>

                {service.badge && (
                  <div className="absolute -right-2 -top-2 rotate-3 border-2 border-stone-900 bg-amber-400 px-3 py-1 text-xs font-black uppercase tracking-wider text-stone-900 shadow-[4px_4px_0px_0px_rgba(28,25,23,1)]">
                    {service.badge}
                  </div>
                )}

                <div className="p-8">
                  <div className="mb-6 border-b border-stone-200 pb-6">
                    <h3 className="text-2xl font-black tracking-tight">
                      {service.name}
                    </h3>
                    <p className="mt-1 text-lg font-medium italic text-stone-500">
                      {service.tagline}
                    </p>
                  </div>

                  <p className="mb-6 leading-relaxed text-stone-700">
                    {service.description}
                  </p>

                  <div className="mb-6 grid gap-3 sm:grid-cols-2">
                    {service.features.map((feature, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 border-l-2 border-stone-300 pl-3"
                      >
                        <span className="mt-0.5 text-sm font-black text-stone-400">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="text-sm text-stone-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mb-8 flex flex-wrap gap-6 border-t border-stone-200 pt-4 text-sm">
                    <div>
                      <span className="font-bold uppercase tracking-wider text-stone-500">
                        Starting At
                      </span>
                      <p className="mt-1 text-lg font-black">{service.startingPrice}</p>
                    </div>
                    <div>
                      <span className="font-bold uppercase tracking-wider text-stone-500">
                        Turnaround
                      </span>
                      <p className="mt-1 text-lg font-black">{service.turnaround}</p>
                    </div>
                  </div>

                  <div className="border-t-2 border-stone-900 bg-stone-50 p-6">
                    <h4 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider">
                      <span>Verified Testimonials</span>
                      <span className="h-px flex-1 bg-stone-300" />
                    </h4>
                    <div className="space-y-4">
                      {service.reviews.map((review, i) => (
                        <div
                          key={i}
                          className="border border-stone-200 bg-white p-4"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <div>
                              <p className="text-sm font-bold">{review.author}</p>
                              <p className="text-xs text-stone-500">{review.date}</p>
                            </div>
                            <StarRating rating={review.rating} />
                          </div>
                          <p className="text-sm italic text-stone-700">
                            &ldquo;{review.text}&rdquo;
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-16 border-t-2 border-stone-900 pt-8 text-center">
            <p className="text-sm font-bold uppercase tracking-wider text-stone-500">
              All services subject to availability in this timeline
            </p>
            <p className="mt-2 text-xs text-stone-400">
              No cats were audited in the making of this page. One was mildly inconvenienced.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t bg-white mt-16">
        <div className="mx-auto max-w-5xl px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>© 2025 International Association of Spreadsheet Enthusiasts</p>
          <button
            onClick={() => setShowLogin(true)}
            className="hover:text-slate-700 transition-colors"
          >
            Privacy Policy
          </button>
        </div>
      </footer>

      <CovertLogin open={showLogin} onClose={() => setShowLogin(false)} />
    </div>
  );
}
