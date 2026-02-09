import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  MessageSquare,
  BarChart3,
  Trophy,
  Store,
  Zap,
  Shield,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-base font-black tracking-tighter">&gt;&gt;&gt;VAMO</span>
          <div className="flex items-center gap-2">
            <Link href="/marketplace">
              <Button variant="ghost" size="sm" className="text-sm">
                Marketplace
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-sm">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="text-sm">
                Get Started
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="py-24 md:py-36 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm text-muted-foreground">
              <span className="text-lg">🍍</span>
              Earn pineapples for real startup progress
              <ChevronRight className="h-3.5 w-3.5" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1]">
              Build your startup.
              <br />
              <span className="text-muted-foreground">
                Track what matters.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Vamo is a builder where founders iterate on their product and
              business progress side by side. Log updates, earn rewards, get
              instant valuations, and list your project for sale.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Link href="/signup">
                <Button size="lg" className="h-12 px-8 text-base font-medium">
                  Start Building
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link href="/marketplace">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 px-8 text-base font-medium"
                >
                  Browse Marketplace
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 border-t bg-muted/20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                How Vamo Works
              </h2>
              <p className="text-muted-foreground mt-3 text-lg">
                Three panels. One workspace. Real progress.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: MessageSquare,
                  title: "Builder Chat",
                  desc: "Log updates, ship features, and track customer conversations. Our AI co-pilot extracts intent and awards pineapples for every meaningful update.",
                },
                {
                  icon: BarChart3,
                  title: "Business Panel",
                  desc: "See your valuation range, progress score, traction signals, and activity timeline update in real-time as you build.",
                },
                {
                  icon: Store,
                  title: "Marketplace",
                  desc: "Get instant AI-powered offers on your project or list it for sale. Your activity timeline serves as verified proof of progress.",
                },
              ].map((item) => (
                <Card key={item.title} className="border-0 shadow-none bg-transparent">
                  <CardContent className="p-0 text-center space-y-4">
                    <div className="mx-auto h-14 w-14 rounded-2xl bg-foreground/5 flex items-center justify-center">
                      <item.icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Rewards */}
        <section className="py-20 border-t">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Earn Pineapples for Progress
              </h2>
              <p className="text-muted-foreground mt-3 text-lg">
                Real rewards for real building. Redeem for Uber Eats credits.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl mx-auto">
              {[
                { action: "Send an update", reward: "1", icon: MessageSquare },
                { action: "Tag with intent", reward: "+1 bonus", icon: Zap },
                { action: "Link GitHub", reward: "5", icon: Shield },
                { action: "Ship a feature", reward: "3", icon: Zap },
                { action: "Add a customer", reward: "5", icon: Trophy },
                { action: "Log revenue", reward: "10", icon: BarChart3 },
              ].map((item) => (
                <div
                  key={item.action}
                  className="flex items-center gap-3 p-4 rounded-xl border hover:border-foreground/20 transition-colors"
                >
                  <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                    <span className="text-lg">🍍</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.reward} pineapple{item.reward !== "1" && item.reward !== "+1 bonus" ? "s" : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 border-t bg-foreground text-background">
          <div className="max-w-2xl mx-auto px-4 text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Ready to build?
            </h2>
            <p className="text-background/70 text-lg">
              Join founders who track their progress, earn rewards, and get their
              projects valued &mdash; all in one workspace.
            </p>
            <Link href="/signup">
              <Button
                size="lg"
                variant="secondary"
                className="h-12 px-8 text-base font-medium mt-4"
              >
                Create Your First Project
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <span className="font-black tracking-tighter">&gt;&gt;&gt;VAMO</span>
        {" "}&copy; {new Date().getFullYear()}. Build. Track. Grow.
      </footer>
    </div>
  );
}
