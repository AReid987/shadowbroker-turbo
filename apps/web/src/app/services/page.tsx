import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Services — Shadowbroker Turbo",
  description: "Professional solutions for impossible problems.",
};

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
      " nine-life estate planning",
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
        <span
          key={star}
          className={
            star <= rating
              ? "text-amber-500"
              : "text-stone-300"
          }
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      {/* Header */}
      <header className="border-b-2 border-stone-900 bg-stone-100">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <div className="flex items-baseline gap-4">
            <h1 className="text-4xl font-black tracking-tight uppercase">
              Professional Services
            </h1>
            <span className="rounded-full bg-stone-900 px-3 py-1 text-xs font-bold uppercase tracking-wider text-stone-50">
              Form 27-B/6 Required
            </span>
          </div>
          <p className="mt-2 text-lg text-stone-600">
            Impossible problems. Improbable solutions. Invoices due net 30.
          </p>
        </div>
      </header>

      {/* Services */}
      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="space-y-16">
          {services.map((service, index) => (
            <article
              key={service.id}
              className="relative border-2 border-stone-900 bg-white"
            >
              {/* Service number badge */}
              <div className="absolute -left-3 -top-3 flex h-10 w-10 items-center justify-center border-2 border-stone-900 bg-stone-900 text-sm font-black text-stone-50">
                {String(index + 1).padStart(2, "0")}
              </div>

              {/* Badge */}
              {service.badge && (
                <div className="absolute -right-2 -top-2 rotate-3 border-2 border-stone-900 bg-amber-400 px-3 py-1 text-xs font-black uppercase tracking-wider text-stone-900 shadow-[4px_4px_0px_0px_rgba(28,25,23,1)]">
                  {service.badge}
                </div>
              )}

              <div className="p-8">
                {/* Service header */}
                <div className="mb-6 border-b border-stone-200 pb-6">
                  <h2 className="text-3xl font-black tracking-tight">
                    {service.name}
                  </h2>
                  <p className="mt-1 text-lg font-medium italic text-stone-500">
                    {service.tagline}
                  </p>
                </div>

                {/* Description */}
                <p className="mb-6 leading-relaxed text-stone-700">
                  {service.description}
                </p>

                {/* Features */}
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

                {/* Meta */}
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

                {/* Reviews */}
                <div className="border-t-2 border-stone-900 bg-stone-50 p-6">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider">
                    <span>Verified Testimonials</span>
                    <span className="h-px flex-1 bg-stone-300" />
                  </h3>
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

        {/* Footer note */}
        <div className="mt-16 border-t-2 border-stone-900 pt-8 text-center">
          <p className="text-sm font-bold uppercase tracking-wider text-stone-500">
            All services subject to availability in this timeline
          </p>
          <p className="mt-2 text-xs text-stone-400">
            No cats were audited in the making of this page. One was mildly inconvenienced.
          </p>
        </div>
      </main>
    </div>
  );
}
