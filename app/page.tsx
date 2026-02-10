import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  BarChart3,
  Store,
  ArrowRight,
  Rocket,
  Users,
  Zap,
  Shield,
  Monitor,
  TrendingUp,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
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
        {/* Hero */}
        <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 px-4 overflow-hidden">
          {/* Soft gradient blobs */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-50 rounded-full blur-[120px] opacity-60 -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-50 rounded-full blur-[100px] opacity-50 translate-y-1/3 -translate-x-1/4" />

          <div className="relative max-w-3xl mx-auto text-center space-y-8">
            <div className="animate-fade-in inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm text-gray-600 shadow-sm">
              <span className="text-lg">🍍</span>
              Earn pineapples for every real update you ship
            </div>

            <h1 className="animate-fade-in text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] text-gray-900">
              The workspace where
              <br />
              founders ship faster
            </h1>

            <p className="animate-fade-in-delay text-base sm:text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
              Vamo is a builder for non-technical founders. Iterate on your
              product UI and business progress side by side &mdash; with AI
              that tracks what you ship, scores your traction, and rewards you
              with pineapples.
            </p>

            <div className="animate-fade-in-delay-2 flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link href="/signup">
                <Button className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-8 h-12 text-base rounded-full">
                  Create Your Project
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link href="/marketplace">
                <Button
                  variant="outline"
                  className="h-12 px-8 text-base font-medium border-gray-200 text-gray-700 hover:bg-gray-50 rounded-full"
                >
                  Browse Marketplace
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* 3-panel preview */}
        <section className="py-16 md:py-24 border-t border-gray-100">
          <div className="max-w-5xl mx-auto px-4">
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 sm:p-6">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 space-y-2">
                  <MessageSquare className="h-5 w-5 text-emerald-500 mx-auto" />
                  <p className="text-xs sm:text-sm font-semibold text-gray-900">
                    Builder Chat
                  </p>
                  <p className="text-[11px] sm:text-xs text-gray-400 leading-relaxed">
                    Log updates. AI extracts intent and awards pineapples.
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 space-y-2">
                  <Monitor className="h-5 w-5 text-emerald-500 mx-auto" />
                  <p className="text-xs sm:text-sm font-semibold text-gray-900">
                    UI Preview
                  </p>
                  <p className="text-[11px] sm:text-xs text-gray-400 leading-relaxed">
                    Live preview of your linked project in any viewport.
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 space-y-2">
                  <BarChart3 className="h-5 w-5 text-emerald-500 mx-auto" />
                  <p className="text-xs sm:text-sm font-semibold text-gray-900">
                    Business Panel
                  </p>
                  <p className="text-[11px] sm:text-xs text-gray-400 leading-relaxed">
                    Valuation, progress score, traction signals &mdash; live.
                  </p>
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-gray-400 mt-4">
              Three panels. One workspace. Track UI and business progress in
              parallel.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900">
              How Vamo works
            </h2>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Stop toggling between tools. Vamo keeps your product and business
              in one place.
            </p>
          </div>

          <div className="max-w-5xl mx-auto px-4 mt-12 grid md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                icon: MessageSquare,
                title: "Chat your progress",
                desc: "Tell Vamo what you shipped, who you talked to, or what revenue you made. The AI extracts intent and logs it as a verified event.",
              },
              {
                step: "02",
                icon: TrendingUp,
                title: "Watch your score grow",
                desc: "Every meaningful update increases your progress score and valuation range. Traction signals appear automatically in the business panel.",
              },
              {
                step: "03",
                icon: Store,
                title: "Get offers or list for sale",
                desc: "At 10% progress, request an AI-powered valuation. At 20%, list on the marketplace. Your activity timeline is verified proof of work.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 hover:shadow-md transition-shadow space-y-4"
              >
                <span className="text-emerald-500 font-mono text-xs font-bold">
                  {item.step}
                </span>
                <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <item.icon className="h-5 w-5 text-emerald-600" />
                </div>
                <h3 className="font-bold text-lg text-gray-900">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Why not just a spreadsheet? */}
        <section className="py-16 md:py-24 bg-gray-50/70">
          <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900">
              You&apos;re building alone.
              <br />
              Vamo keeps you accountable.
            </h2>
            <p className="text-gray-500 text-sm max-w-lg mx-auto leading-relaxed">
              Most founders have no way to prove progress to investors,
              co-founders, or themselves. Vamo turns every update into a
              verified event with a timestamp and AI analysis.
            </p>
          </div>

          <div className="max-w-5xl mx-auto px-4 mt-12 grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm space-y-4">
              <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                Without Vamo
              </div>
              <div className="space-y-3 text-sm text-gray-500">
                <div className="flex items-center gap-3">
                  <span className="text-red-400">&#10005;</span>
                  Scattered updates across Notion, Slack, and email
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-red-400">&#10005;</span>
                  No way to measure real progress week over week
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-red-400">&#10005;</span>
                  Can&apos;t show investors a verified activity trail
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border-2 border-emerald-200 p-8 shadow-sm space-y-4 relative">
              <div className="absolute -top-3 right-6 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                VAMO
              </div>
              <div className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">
                With Vamo
              </div>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center gap-3">
                  <span className="text-emerald-500">&#10003;</span>
                  One chat to log features, customers, and revenue
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-500">&#10003;</span>
                  Live progress score and AI-powered valuation range
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-500">&#10003;</span>
                  Immutable activity timeline as proof of work
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pineapple rewards */}
        <section className="py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900">
              Ship progress. Earn 🍍.
            </h2>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Every meaningful update earns pineapples. Redeem them for Uber
              Eats credits. Real rewards for real building.
            </p>
          </div>

          <div className="max-w-3xl mx-auto px-4 mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { action: "Send an update", reward: "1 🍍", icon: MessageSquare },
              { action: "Tag with intent", reward: "+1 🍍", icon: Zap },
              { action: "Link GitHub", reward: "5 🍍", icon: Shield },
              { action: "Ship a feature", reward: "3 🍍", icon: Rocket },
              { action: "Add a customer", reward: "5 🍍", icon: Users },
              { action: "Log revenue", reward: "10 🍍", icon: BarChart3 },
            ].map((item) => (
              <div
                key={item.action}
                className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-5 py-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    {item.action}
                  </span>
                </div>
                <span className="text-sm font-bold text-emerald-600">
                  {item.reward}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Stats pill */}
        <section className="py-16 md:py-20 bg-gray-50/70">
          <div className="max-w-3xl mx-auto px-4">
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl sm:text-4xl font-black text-gray-900">
                  3
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Panels in one
                  <br />
                  workspace
                </p>
              </div>
              <div>
                <div className="text-3xl sm:text-4xl font-black text-gray-900">
                  &lt;3s
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  AI response
                  <br />
                  time
                </p>
              </div>
              <div>
                <div className="text-3xl sm:text-4xl font-black text-emerald-600">
                  🍍
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Redeemable for
                  <br />
                  Uber Eats
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative py-20 md:py-28 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-50 rounded-full blur-[100px] opacity-40" />

          <div className="relative max-w-2xl mx-auto px-4 text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900">
              Your startup deserves
              <br />
              a progress trail.
            </h2>
            <p className="text-gray-500 text-sm max-w-lg mx-auto">
              Stop building in the dark. Create a project, start logging
              updates, and watch your business panel come to life.
            </p>
            <Link href="/signup">
              <Button className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-10 h-12 text-base rounded-full mt-2">
                Start Building Now
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <Image
            src="/logo.svg"
            alt="Vamo"
            width={64}
            height={16}
            className="opacity-50"
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
