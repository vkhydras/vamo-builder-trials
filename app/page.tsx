import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Rocket,
  Users,
  Monitor,
  TrendingUp,
  Sparkles,
  BarChart3,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-50 glass border-b border-gray-100">
        <div className="px-6 sm:px-8 lg:px-12 py-3 flex items-center justify-between">
          <Link href="/">
            <Image
              src="/logo.svg"
              alt="Vamo"
              width={90}
              height={22}
              priority
            />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/marketplace">
              <Button
                variant="ghost"
                size="sm"
                className="text-sm text-gray-500 hover:text-gray-900"
              >
                Marketplace
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="outline"
                size="sm"
                className="text-sm border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                Log In
              </Button>
            </Link>
            <Link href="/signup">
              <Button
                size="sm"
                className="text-sm bg-gray-900 hover:bg-gray-800 text-white font-medium"
              >
                Start Building
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero — tight, editorial, no fluff */}
        <section className="relative pt-24 pb-14 md:pt-32 md:pb-16 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-dot-grid opacity-30" />

          <div className="relative max-w-2xl mx-auto space-y-5">
            <p className="animate-fade-in font-mono text-xs text-gray-400 tracking-wider uppercase">
              Builder workspace for non-technical founders
            </p>
            <h1 className="animate-fade-in text-[2.75rem] sm:text-5xl md:text-[3.5rem] font-black tracking-tight leading-[1.05] text-gray-900">
              Ship your startup.
              <br />
              <span className="text-gradient">Prove it happened.</span>
            </h1>
            <p className="animate-fade-in-delay text-base text-gray-500 max-w-md leading-relaxed">
              Chat your updates. AI logs them as verified events.
              Your progress score, valuation, and activity timeline
              build themselves.
            </p>
            <div className="animate-fade-in-delay-2 flex items-center gap-3 pt-1">
              <Link href="/signup">
                <Button className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-7 h-11 text-sm rounded-lg shadow-lg shadow-gray-900/10 hover:shadow-xl transition-all">
                  Start building
                  <ArrowRight className="h-3.5 w-3.5 ml-2" />
                </Button>
              </Link>
              <Link href="/marketplace">
                <Button
                  variant="ghost"
                  className="h-11 px-5 text-sm text-gray-500 hover:text-gray-900"
                >
                  Browse marketplace
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Product mockup — browser chrome with real panels */}
        <section className="animate-fade-in-delay-3 pb-20 md:pb-28 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="rounded-xl border border-gray-200 bg-white shadow-2xl shadow-gray-200/50 overflow-hidden">
              {/* Title bar */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-white border border-gray-200 rounded-md px-4 py-1 text-[11px] text-gray-400 font-mono w-64 text-center">
                    vamo.app/builder/my-startup
                  </div>
                </div>
                <div className="w-16" />
              </div>

              {/* 3-panel layout */}
              <div className="grid grid-cols-12 min-h-[360px] sm:min-h-[420px]">
                {/* Chat */}
                <div className="col-span-3 border-r border-gray-100 p-3 hidden sm:flex flex-col">
                  <div className="flex items-center gap-1.5 mb-3 pb-2 border-b border-gray-100">
                    <div className="h-5 w-5 rounded-full bg-gray-900 flex items-center justify-center">
                      <Sparkles className="h-2.5 w-2.5 text-white" />
                    </div>
                    <span className="text-[10px] font-semibold text-gray-900">Chat</span>
                  </div>
                  <div className="space-y-3 flex-1">
                    {/* User msg */}
                    <div className="ml-auto max-w-[85%]">
                      <div className="bg-gray-900 text-white rounded-xl rounded-tr-sm px-2.5 py-1.5">
                        <p className="text-[9px] leading-relaxed">
                          Shipped onboarding flow. 3 sign-ups from Twitter today.
                        </p>
                      </div>
                    </div>
                    {/* Bot msg */}
                    <div className="max-w-[90%]">
                      <div className="border-l-2 border-emerald-400 pl-2">
                        <p className="text-[9px] text-gray-600 leading-relaxed">
                          Logged <span className="font-mono text-[8px] bg-gray-100 px-1 rounded">feature_shipped</span> + <span className="font-mono text-[8px] bg-gray-100 px-1 rounded">customer_added</span>
                        </p>
                        <span className="text-[8px] font-bold text-amber-600 mt-0.5 inline-block">+8 🍍</span>
                      </div>
                    </div>
                    {/* User msg */}
                    <div className="ml-auto max-w-[85%]">
                      <div className="bg-gray-900 text-white rounded-xl rounded-tr-sm px-2.5 py-1.5">
                        <p className="text-[9px] leading-relaxed">
                          First paying customer — $49/mo
                        </p>
                      </div>
                    </div>
                    {/* Bot msg */}
                    <div className="max-w-[90%]">
                      <div className="border-l-2 border-emerald-400 pl-2">
                        <p className="text-[9px] text-gray-600 leading-relaxed">
                          Revenue logged. Progress now <span className="font-semibold text-gray-900">42/100</span>.
                        </p>
                        <span className="text-[8px] font-bold text-amber-600 mt-0.5 inline-block">+10 🍍</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-auto pt-2 border-t border-gray-100">
                    <div className="bg-gray-50 rounded-md px-2 py-1.5 text-[9px] text-gray-400">
                      What did you ship today?
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="col-span-12 sm:col-span-6 border-r border-gray-100 bg-[#FAFAFA] p-4 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <Monitor className="h-3 w-3 text-gray-400" />
                      <span className="text-[10px] font-semibold text-gray-900">Preview</span>
                    </div>
                    <div className="flex gap-0.5">
                      <div className="w-5 h-4 rounded-sm bg-gray-900 flex items-center justify-center">
                        <Monitor className="h-2.5 w-2.5 text-white" />
                      </div>
                      <div className="w-5 h-4 rounded-sm bg-gray-200" />
                      <div className="w-5 h-4 rounded-sm bg-gray-200" />
                    </div>
                  </div>
                  <div className="flex-1 bg-white rounded-lg border border-gray-200 p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-gray-900" />
                      <div className="space-y-1 flex-1">
                        <div className="h-2 w-24 bg-gray-900 rounded" />
                        <div className="h-1.5 w-16 bg-gray-200 rounded" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 w-full bg-gray-100 rounded" />
                      <div className="h-2 w-[85%] bg-gray-100 rounded" />
                      <div className="h-2 w-[70%] bg-gray-100 rounded" />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <div className="h-8 flex-1 bg-gray-900 rounded-md" />
                      <div className="h-8 flex-1 bg-white rounded-md border border-gray-200" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <div className="h-20 bg-gray-50 rounded-lg border border-gray-100" />
                      <div className="h-20 bg-gray-50 rounded-lg border border-gray-100" />
                      <div className="h-20 bg-gray-50 rounded-lg border border-gray-100" />
                    </div>
                  </div>
                </div>

                {/* Business */}
                <div className="col-span-3 p-3 hidden sm:flex flex-col">
                  <div className="flex items-center gap-1.5 mb-3 pb-2 border-b border-gray-100">
                    <BarChart3 className="h-3 w-3 text-gray-400" />
                    <span className="text-[10px] font-semibold text-gray-900">Business</span>
                  </div>
                  <div className="space-y-3 flex-1">
                    <div className="bg-emerald-50/80 rounded-lg p-2.5 border border-emerald-100">
                      <p className="text-[8px] text-emerald-600 font-medium mb-0.5">VALUATION</p>
                      <p className="text-sm font-black text-emerald-900">$12k – $28k</p>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <p className="text-[8px] text-gray-400 font-medium">PROGRESS</p>
                        <p className="text-[10px] font-black text-gray-900">42<span className="text-gray-400 font-normal">/100</span></p>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full w-[42%] bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" />
                      </div>
                    </div>
                    <div>
                      <p className="text-[8px] text-gray-400 font-medium mb-1.5">TRACTION</p>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                          <span className="text-[9px] text-gray-600">Onboarding shipped</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span className="text-[9px] text-gray-600">3 customers added</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                          <span className="text-[9px] text-gray-600">$49/mo revenue</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-[8px] text-gray-400 font-medium mb-1.5">LINKED</p>
                      <div className="flex gap-1">
                        <span className="text-[8px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">github</span>
                        <span className="text-[8px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">linkedin</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works — horizontal flow, not cards */}
        <section className="py-20 md:py-28 border-t border-gray-100">
          <div className="max-w-5xl mx-auto px-4">
            <div className="max-w-lg mb-16">
              <p className="font-mono text-xs text-gray-400 tracking-wider uppercase mb-3">
                How it works
              </p>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 leading-tight">
                Three actions.<br />Everything else is automatic.
              </h2>
            </div>

            <div className="space-y-0">
              {/* Step 1 */}
              <div className="grid md:grid-cols-[1fr_2fr] gap-8 md:gap-16 py-10 border-t border-gray-100 group">
                <div>
                  <span className="font-mono text-[11px] text-gray-300 block mb-2">01</span>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Chat what you shipped
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Type a natural-language update. Tag it as feature, customer,
                    or revenue if you want — or let AI figure it out.
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <div className="space-y-2.5">
                    <div className="ml-auto max-w-[70%]">
                      <div className="bg-gray-900 text-white rounded-xl rounded-tr-sm px-3 py-2 text-xs">
                        Launched the waitlist page. Got 12 sign-ups in the first hour.
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="h-5 w-5 rounded-full bg-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles className="h-2.5 w-2.5 text-white" />
                      </div>
                      <div className="border-l-2 border-emerald-400 pl-2.5">
                        <p className="text-xs text-gray-600">
                          Logged as <span className="font-mono text-[11px] bg-gray-100 px-1 rounded">feature_shipped</span> and <span className="font-mono text-[11px] bg-gray-100 px-1 rounded">customer_added</span>.
                          Progress updated to 28/100.
                        </p>
                        <p className="text-[11px] font-bold text-amber-600 mt-1">+8 🍍 earned</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="grid md:grid-cols-[1fr_2fr] gap-8 md:gap-16 py-10 border-t border-gray-100">
                <div>
                  <span className="font-mono text-[11px] text-gray-300 block mb-2">02</span>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Your business panel builds itself
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Valuation range, progress score, traction signals, linked
                    assets — all populated from your chat history.
                    No spreadsheets.
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-[10px] text-gray-400 font-medium mb-1">VALUATION</p>
                      <p className="text-base font-black text-gray-900">$12k – $28k</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-[10px] text-gray-400 font-medium mb-1">PROGRESS</p>
                      <div className="flex items-baseline gap-1">
                        <p className="text-base font-black text-gray-900">42</p>
                        <p className="text-xs text-gray-400">/100</p>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200 col-span-2">
                      <p className="text-[10px] text-gray-400 font-medium mb-2">TRACTION SIGNALS</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1 text-[11px] text-gray-600 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                          3 features shipped
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-gray-600 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          12 customers
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-gray-600 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                          <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                          $49/mo MRR
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="grid md:grid-cols-[1fr_2fr] gap-8 md:gap-16 py-10 border-t border-gray-100">
                <div>
                  <span className="font-mono text-[11px] text-gray-300 block mb-2">03</span>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Get valued. Get listed.
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    At 10% progress, request an AI valuation. At 20%, list on
                    the marketplace. Your verified timeline is the proof buyers
                    need.
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-xs font-bold text-gray-900">Vamo Instant Offer</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Based on 42 verified events</p>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
                        <p className="text-sm font-black text-emerald-700">$12k – $28k</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 h-8 bg-gray-900 rounded-md flex items-center justify-center">
                        <span className="text-[11px] text-white font-medium">List for Sale</span>
                      </div>
                      <div className="flex-1 h-8 bg-white rounded-md border border-gray-200 flex items-center justify-center">
                        <span className="text-[11px] text-gray-600 font-medium">Dismiss</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dark CTA band */}
        <section className="bg-gray-900 py-16 md:py-20">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight mb-4">
              Your startup deserves a progress trail.
            </h2>
            <p className="text-gray-400 text-sm max-w-md mx-auto mb-8">
              Stop building in the dark. Every update you log becomes a
              verified event with a timestamp and AI analysis.
            </p>
            <Link href="/signup">
              <Button className="bg-white hover:bg-gray-100 text-gray-900 font-semibold px-8 h-11 text-sm rounded-lg shadow-lg shadow-black/20 transition-all">
                Start building — it&apos;s free
                <ArrowRight className="h-3.5 w-3.5 ml-2" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="px-6 sm:px-8 lg:px-12 flex items-center justify-between">
          <Image
            src="/logo.svg"
            alt="Vamo"
            width={64}
            height={16}
            className="opacity-40"
          />
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <Link
              href="/marketplace"
              className="hover:text-gray-600 transition-colors"
            >
              Marketplace
            </Link>
            <Link
              href="/login"
              className="hover:text-gray-600 transition-colors"
            >
              Log in
            </Link>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
