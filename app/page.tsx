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
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">VAMO</h1>
          <div className="flex items-center gap-3">
            <Link href="/marketplace">
              <Button variant="ghost" size="sm">
                Marketplace
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="py-20 md:py-32 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm text-muted-foreground">
              <span className="text-lg">🍍</span>
              Earn pineapples for real progress
            </div>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
              Build your startup.
              <br />
              <span className="text-muted-foreground">
                Track what matters.
              </span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Vamo is a builder where founders iterate on their product and
              business progress side by side. Log updates, earn rewards, get
              instant valuations, and list your project for sale.
            </p>
            <div className="flex items-center justify-center gap-4 pt-2">
              <Link href="/signup">
                <Button size="lg" className="h-12 px-8 text-base">
                  Start Building
                </Button>
              </Link>
              <Link href="/marketplace">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 px-8 text-base"
                >
                  Browse Marketplace
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 border-t bg-muted/30">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h3 className="text-2xl md:text-3xl font-bold">
                How Vamo Works
              </h3>
              <p className="text-muted-foreground mt-2">
                Three panels. One workspace. Real progress.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6 text-center space-y-3">
                  <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-semibold text-lg">Builder Chat</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Log updates, ship features, and track customer conversations.
                    Our AI co-pilot extracts intent and awards pineapples for
                    every meaningful update.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6 text-center space-y-3">
                  <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-semibold text-lg">Business Panel</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    See your valuation range, progress score, traction signals,
                    and activity timeline update in real-time as you build.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6 text-center space-y-3">
                  <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Store className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-semibold text-lg">Marketplace</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Get instant AI-powered offers on your project or list it for
                    sale. Your activity timeline serves as verified proof of
                    progress.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Rewards */}
        <section className="py-16 border-t">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h3 className="text-2xl md:text-3xl font-bold">
                Earn Pineapples for Progress
              </h3>
              <p className="text-muted-foreground mt-2">
                Real rewards for real building. Redeem for Uber Eats credits.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
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
                  className="flex items-center gap-3 p-4 rounded-lg border"
                >
                  <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
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
        <section className="py-20 border-t bg-muted/30">
          <div className="max-w-2xl mx-auto px-4 text-center space-y-6">
            <h3 className="text-2xl md:text-3xl font-bold">
              Ready to build?
            </h3>
            <p className="text-muted-foreground">
              Join founders who track their progress, earn rewards, and get their
              projects valued — all in one workspace.
            </p>
            <Link href="/signup">
              <Button size="lg" className="h-12 px-8 text-base">
                Create Your First Project
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        Vamo &copy; {new Date().getFullYear()}. Build. Track. Grow.
      </footer>
    </div>
  );
}
