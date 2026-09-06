import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function HomePage() {
  return (
    <>
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="border-b border-sand-400 bg-sand-100">
          <div className="container-content grid gap-12 py-20 md:grid-cols-2 md:py-28">
            <div>
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em] text-graystone">
                For Florida residential agents
              </p>
              <h1 className="font-serif text-4xl leading-tight text-navy md:text-5xl">
                Win the listing with a development-potential story you can&rsquo;t write yourself.
              </h1>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-navy-600">
                Submit any land or teardown address. Our team of development experts prepares a
                professional analysis — delivered as a polished PDF carrying your name, license, and
                brokerage. Present it to sellers to win the listing. Present it to buyers to justify
                the price.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link href="/signup" className="btn-primary">
                  Order your first analysis
                </Link>
                <Link href="#pricing" className="btn-secondary">
                  See pricing
                </Link>
              </div>
              <p className="mt-4 text-xs text-graystone">
                Your first 3 analyses are free. No credit card required to start.
              </p>
            </div>
            <div className="flex items-center justify-center">
              <div className="w-full max-w-sm border border-sand-400 bg-white p-8 shadow-sm">
                <div className="h-1 w-16 bg-navy" />
                <p className="mt-6 text-xs uppercase tracking-[0.2em] text-graystone">
                  Development Potential Analysis
                </p>
                <p className="mt-3 font-serif text-2xl text-navy">4210 SW 12th Terrace</p>
                <p className="mt-1 text-sm text-graystone">Miami, FL 33134</p>
                <div className="mt-8 space-y-3 border-t border-sand-400 pt-6 text-sm text-navy-600">
                  <div className="flex justify-between">
                    <span>Zoning</span>
                    <span className="text-navy">T4-R</span>
                  </div>
                  <div className="flex justify-between">
                    <span>By-right units</span>
                    <span className="text-navy">3</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overlay potential</span>
                    <span className="text-navy">Up to 6</span>
                  </div>
                </div>
                <div className="mt-10 flex items-center gap-3 border-t border-sand-400 pt-6">
                  <div className="h-10 w-10 rounded-full bg-sand-300" />
                  <div>
                    <p className="text-sm font-medium text-navy">Prepared for Maria Alves</p>
                    <p className="text-xs text-graystone">FL License #3456789 · Coastal Realty</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Honesty about turnaround */}
        <section className="border-b border-sand-400 bg-white">
          <div className="container-content py-16">
            <p className="mx-auto max-w-2xl text-center font-serif text-xl italic text-navy-600">
              &ldquo;This is not an instant report generator. Every analysis is prepared by a Site
              Brief expert — that is what makes it worth presenting to your client.&rdquo;
            </p>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="border-b border-sand-400 bg-sand-100">
          <div className="container-content py-20">
            <h2 className="font-serif text-3xl text-navy">How it works</h2>
            <div className="mt-12 grid gap-10 md:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Submit the address",
                  body: "Tell us the property, the asking price, your relationship to the deal, and your deadline. Takes under two minutes, even from a showing.",
                },
                {
                  step: "02",
                  title: "We prepare the analysis",
                  body: "A Site Brief expert reviews zoning, overlays, and market data for the site. Standard turnaround is 48 hours; rush is 24.",
                },
                {
                  step: "03",
                  title: "Download your branded PDF",
                  body: "We email you when it's ready. Every page carries your name, license, and brokerage — ready to present.",
                },
              ].map((item) => (
                <div key={item.step}>
                  <p className="font-serif text-4xl text-sand-400">{item.step}</p>
                  <h3 className="mt-4 text-lg font-medium text-navy">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-navy-600">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sample report */}
        <section id="sample" className="border-b border-sand-400 bg-white">
          <div className="container-content py-20">
            <div className="grid gap-12 md:grid-cols-2 md:items-center">
              <div>
                <h2 className="font-serif text-3xl text-navy">A report your clients keep.</h2>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-navy-600">
                  Cover page, running header and footer with your brand on every page, and a closing
                  contact page with your details. Editorial layout, not a spreadsheet export.
                </p>
                <Link href="/signup" className="btn-secondary mt-8 inline-flex">
                  See it on your first order
                </Link>
              </div>
              <div className="border border-sand-400 bg-sand-100 p-10">
                <div className="aspect-[8.5/11] w-full border border-sand-400 bg-white shadow-sm" />
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="border-b border-sand-400 bg-sand-100">
          <div className="container-content py-20">
            <h2 className="font-serif text-3xl text-navy">Pricing</h2>
            <p className="mt-3 max-w-lg text-sm text-navy-600">
              Try it for free. Subscribe if you order regularly. Pay per analysis if you don&rsquo;t.
            </p>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              <div className="card flex flex-col">
                <p className="text-xs uppercase tracking-wide text-graystone">Start free</p>
                <p className="mt-3 font-serif text-3xl text-navy">$0</p>
                <p className="mt-1 text-sm text-graystone">Your first 3 analyses</p>
                <ul className="mt-6 flex-1 space-y-2 text-sm text-navy-600">
                  <li>One per license number and brokerage</li>
                  <li>Full branded PDF report</li>
                  <li>No credit card required</li>
                </ul>
                <Link href="/signup" className="btn-secondary mt-8">
                  Get started
                </Link>
              </div>
              <div className="card flex flex-col border-navy">
                <p className="text-xs uppercase tracking-wide text-graystone">Subscription</p>
                <p className="mt-3 font-serif text-3xl text-navy">
                  $99<span className="text-base text-graystone">/mo</span>
                </p>
                <p className="mt-1 text-sm text-graystone">2 analyses included monthly</p>
                <ul className="mt-6 flex-1 space-y-2 text-sm text-navy-600">
                  <li>Additional analyses at a reduced overage rate</li>
                  <li>Cancel anytime, effective at period end</li>
                  <li>Priority queue placement</li>
                </ul>
                <Link href="/signup" className="btn-primary mt-8">
                  Subscribe
                </Link>
              </div>
              <div className="card flex flex-col">
                <p className="text-xs uppercase tracking-wide text-graystone">Single analysis</p>
                <p className="mt-3 font-serif text-3xl text-navy">$250</p>
                <p className="mt-1 text-sm text-graystone">No subscription required</p>
                <ul className="mt-6 flex-1 space-y-2 text-sm text-navy-600">
                  <li>Same expert analysis and branded PDF</li>
                  <li>Rush 24-hour turnaround available (+$150)</li>
                  <li>Pay per order</li>
                </ul>
                <Link href="/signup" className="btn-secondary mt-8">
                  Order one analysis
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-navy py-20 text-sand-100">
          <div className="container-content text-center">
            <h2 className="font-serif text-3xl">Ready to win your next listing?</h2>
            <Link href="/signup" className="btn-primary mt-8 inline-flex bg-sand-100 text-navy hover:bg-sand-200">
              Order an analysis
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
