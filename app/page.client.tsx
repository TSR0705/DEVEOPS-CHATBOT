"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useUser, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import LaserFlowBG from "@/components/laser/LaserFlowBG";

const CardNav = dynamic(() => import("@/components/nav/CardNav"), {
  ssr: false,
});

function UltraPremiumNavbar() {
  const { isSignedIn, user } = useUser();

  const navItems = [
    {
      label: "Product",
      bgColor: "#0D0716",
      textColor: "#ffffff",
      links: [
        { label: "Features", href: "#features", ariaLabel: "Features" },
        { label: "Security", href: "#security", ariaLabel: "Security" },
        {
          label: "Integrations",
          href: "#integrations",
          ariaLabel: "Integrations",
        },
        { label: "Pricing", href: "#pricing", ariaLabel: "Pricing" },
      ],
    },
    {
      label: "Developers",
      bgColor: "#170D27",
      textColor: "#ffffff",
      links: [
        { label: "Documentation", href: "#docs", ariaLabel: "Documentation" },
        { label: "API Reference", href: "#api", ariaLabel: "API Reference" },
        { label: "SDKs", href: "#sdks", ariaLabel: "SDKs" },
        { label: "Examples", href: "#examples", ariaLabel: "Examples" },
      ],
    },
    {
      label: "Community",
      bgColor: "#271E37",
      textColor: "#ffffff",
      links: [
        { label: "GitHub", href: "https://github.com", ariaLabel: "GitHub" },
        { label: "Discord", href: "https://discord.com", ariaLabel: "Discord" },
        { label: "Blog", href: "#blog", ariaLabel: "Blog" },
        { label: "Roadmap", href: "#roadmap", ariaLabel: "Roadmap" },
      ],
    },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-gradient-to-r from-black via-black/98 to-black/95 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-8">
          {/* Logo & Branding - LEFT */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C084FC] via-[#9BFFB0] to-[#6EDBD6] flex items-center justify-center shadow-[0_0_20px_rgba(192,132,252,0.3)]">
              <span className="text-white font-black text-xl">⚡</span>
            </div>
            <div className="flex flex-col">
              <Link
                href="/"
                className="text-lg font-bold text-white tracking-tight hover:text-[#C084FC] transition-colors duration-300"
              >
                DeployBot
              </Link>
              <span className="text-xs text-white/50 tracking-widest font-mono">
                Enterprise K8s
              </span>
            </div>
          </div>

          {/* Desktop Navigation - CENTER */}
          <div className="hidden lg:flex items-center">
            <CardNav
              logo={null}
              items={navItems}
              className="flex gap-8"
              ease="power3.out"
            />
          </div>

          {/* Right Actions - LINKS + CTA */}
          <div className="flex items-center gap-3 ml-auto">
            <Link
              href="https://github.com"
              className="hidden md:inline-flex px-4 py-2 text-white/80 hover:text-[#C084FC] transition-colors duration-300 text-sm border border-white/10 rounded-lg hover:border-[#C084FC]/50 hover:bg-[#C084FC]/5"
            >
              ★ Star
            </Link>
            <Link
              href="https://docs.example.com"
              className="hidden sm:inline-flex px-4 py-2 text-white/80 hover:text-white transition-colors duration-300 text-sm"
            >
              Docs
            </Link>
            
            {/* Auth-aware CTA button and profile */}
            <SignedOut>
              <Link
                href="/sign-in"
                className="px-6 py-2.5 bg-gradient-to-r from-[#C084FC] via-[#9BFFB0] to-[#6EDBD6] text-black font-bold rounded-xl hover:shadow-[0_0_40px_rgba(192,132,252,0.5)] transition-all duration-300 text-sm tracking-wide btn-premium"
              >
                Sign In →
              </Link>
            </SignedOut>
            
            <SignedIn>
              <Link
                href="/dashboard"
                className="px-6 py-2.5 bg-gradient-to-r from-[#C084FC] via-[#9BFFB0] to-[#6EDBD6] text-black font-bold rounded-xl hover:shadow-[0_0_40px_rgba(192,132,252,0.5)] transition-all duration-300 text-sm tracking-wide btn-premium"
              >
                Dashboard →
              </Link>
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10",
                    userButtonPopoverCard: "bg-black border border-white/20",
                    userButtonPopoverActionButton: "text-white hover:bg-white/10",
                    userButtonPopoverActionButtonText: "text-white",
                    userButtonPopoverFooter: "hidden"
                  }
                }}
                afterSignOutUrl="/"
              />
            </SignedIn>
          </div>
        </div>
      </div>
    </nav>
  );
}

function HeroSection() {
  const { isSignedIn } = useUser();

  return (
    <section className="relative pt-32 pb-20 min-h-screen flex items-center justify-center overflow-hidden">
      {/* LaserFlow ONLY in Hero Section - z-0, positioned RIGHT */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-end pr-40">
        <div className="w-2/3 h-full">
          <LaserFlowBG />
        </div>
      </div>

      {/* LEFT: Branding Column - z-10 */}
      <div className="flex-1 px-8 md:px-12 z-10 relative">
        <div className="max-w-2xl">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 bg-[#C084FC]/10 border border-[#C084FC]/30 rounded-full backdrop-blur-sm">
            <span className="w-2.5 h-2.5 bg-[#9BFFB0] rounded-full animate-pulse"></span>
            <span className="text-sm text-[#C084FC] font-semibold">
              Enterprise Ready • 99.9% Uptime
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-6xl md:text-7xl font-black text-white leading-tight mb-6 tracking-tight">
            Control Your <br />
            <span className="bg-gradient-to-r from-[#C084FC] via-[#9BFFB0] to-[#6EDBD6] bg-clip-text text-transparent">
              Kubernetes Safely
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-white/70 mb-8 max-w-xl leading-relaxed font-light">
            The AI-powered control plane for teams that demand safety, speed,
            and confidence in every deployment.
          </p>

          {/* Three-Column Value Props */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#9BFFB0]/20 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-[#9BFFB0] font-bold">→</span>
              </div>
              <div>
                <p className="font-semibold text-white mb-1">Safe Operations</p>
                <p className="text-sm text-white/60">
                  Role-based access, audit trails
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#6EDBD6]/20 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-[#6EDBD6] font-bold">⚡</span>
              </div>
              <div>
                <p className="font-semibold text-white mb-1">Chat-Driven</p>
                <p className="text-sm text-white/60">
                  Natural language commands
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#D6A65A]/20 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-[#D6A65A] font-bold">✓</span>
              </div>
              <div>
                <p className="font-semibold text-white mb-1">Real-Time</p>
                <p className="text-sm text-white/60">
                  Instant cluster feedback
                </p>
              </div>
            </div>
          </div>

          {/* Primary CTA Buttons - Auth-aware */}
          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            {isSignedIn ? (
              <Link
                href="/dashboard"
                className="px-10 py-4 bg-gradient-to-r from-[#C084FC] to-[#9BFFB0] text-black font-bold rounded-xl hover:shadow-[0_0_50px_rgba(192,132,252,0.6)] transition-all duration-300 text-center text-lg btn-premium"
              >
                Go to Dashboard
              </Link>
            ) : (
              <Link
                href="/sign-in"
                className="px-10 py-4 bg-gradient-to-r from-[#C084FC] to-[#9BFFB0] text-black font-bold rounded-xl hover:shadow-[0_0_50px_rgba(192,132,252,0.6)] transition-all duration-300 text-center text-lg btn-premium"
              >
                Get Started
              </Link>
            )}
            <Link
              href="#"
              className="px-10 py-4 border-2 border-white/20 text-white font-bold rounded-xl hover:bg-white/5 hover:border-[#C084FC]/50 transition-all duration-300 text-center text-lg"
            >
              Watch Demo (2 min)
            </Link>
          </div>

          {/* Trust Signals */}
          <div className="flex items-center gap-8">
            <div>
              <p className="text-3xl font-black text-[#9BFFB0]">500+</p>
              <p className="text-sm text-white/60">Teams Deployed</p>
            </div>
            <div className="w-px h-12 bg-white/10"></div>
            <div>
              <p className="text-3xl font-black text-[#6EDBD6]">2M+</p>
              <p className="text-sm text-white/60">Commands Executed</p>
            </div>
            <div className="w-px h-12 bg-white/10"></div>
            <div>
              <p className="text-3xl font-black text-[#D6A65A]">99.9%</p>
              <p className="text-sm text-white/60">Uptime SLA</p>
            </div>
          </div>
        </div>
      </div>

      {/* Empty right column - no floating card here */}
      <div className="flex-1 hidden lg:block"></div>
    </section>
  );
}

function DashboardSection() {
  return (
    <section className="relative py-24 px-8 md:px-12 bg-black overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C084FC]/10 border border-[#C084FC]/30 rounded-full mb-6">
            <span className="w-2 h-2 bg-[#C084FC] rounded-full"></span>
            <span className="text-sm text-[#C084FC] font-semibold">
              Live Experience
            </span>
          </div>
          <h2 className="text-5xl font-black text-white mb-4">
            Control Everything from One Place
          </h2>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Intuitive dashboard with real-time metrics, command palette, and
            activity tracking
          </p>
        </div>

        {/* Premium Card - GROUNDED, NOT FLOATING */}
        <div className="relative w-full max-w-3xl mx-auto">
          {/* Card with Enhanced Border Glow */}
          <div className="relative border-2 border-[#C084FC]/40 bg-[#0B0F1A]/70 backdrop-blur-3xl rounded-3xl p-10 overflow-hidden shadow-[0_20px_60px_rgba(192,132,252,0.2)]">
            {/* Animated Gradient Border */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#C084FC]/10 to-transparent rounded-3xl pointer-events-none"></div>

            {/* Top Glow Bar */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-[#C084FC] to-transparent shadow-[0_0_30px_rgba(192,132,252,0.8)]"></div>

            <div className="relative z-10">
              {/* Status Badge */}
              <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 bg-[#9BFFB0]/15 border border-[#9BFFB0]/30 rounded-full">
                <span className="w-2 h-2 bg-[#9BFFB0] rounded-full animate-pulse"></span>
                <span className="text-sm text-[#9BFFB0] font-semibold">
                  Live Cluster Connected
                </span>
              </div>

              {/* Title */}
              <h3 className="text-3xl font-bold text-white mb-8">
                Kubernetes Dashboard
              </h3>

              {/* Two-Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Command Palette - Left */}
                <div>
                  <p className="text-xs text-white/50 uppercase tracking-widest font-mono mb-4">
                    Command Palette
                  </p>
                  <div className="space-y-3 bg-black/50 border border-[#C084FC]/20 rounded-lg p-6">
                    <div className="flex items-center gap-3">
                      <span className="text-[#C084FC] font-bold">›</span>
                      <span className="text-white/70 font-mono text-sm">
                        scale frontend 5
                      </span>
                      <span className="ml-auto text-[#9BFFB0] text-xs font-bold">
                        ✓ executed
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[#C084FC] font-bold">›</span>
                      <span className="text-white/70 font-mono text-sm">
                        status all pods
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[#C084FC] font-bold">›</span>
                      <span className="text-white/70 font-mono text-sm">
                        restart deployment api
                      </span>
                    </div>
                  </div>
                </div>

                {/* Live Stats - Right */}
                <div>
                  <p className="text-xs text-white/50 uppercase tracking-widest font-mono mb-4">
                    Live Metrics
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#9BFFB0]/10 border border-[#9BFFB0]/25 rounded-lg p-4 backdrop-blur-sm">
                      <p className="text-xs text-white/50 mb-2 font-mono">
                        PODS
                      </p>
                      <p className="text-2xl font-black text-[#9BFFB0]">24</p>
                    </div>
                    <div className="bg-[#6EDBD6]/10 border border-[#6EDBD6]/25 rounded-lg p-4 backdrop-blur-sm">
                      <p className="text-xs text-white/50 mb-2 font-mono">
                        CPU
                      </p>
                      <p className="text-2xl font-black text-[#6EDBD6]">42%</p>
                    </div>
                    <div className="bg-[#D6A65A]/10 border border-[#D6A65A]/25 rounded-lg p-4 backdrop-blur-sm">
                      <p className="text-xs text-white/50 mb-2 font-mono">
                        MEMORY
                      </p>
                      <p className="text-2xl font-black text-[#D6A65A]">68G</p>
                    </div>
                    <div className="bg-[#C084FC]/10 border border-[#C084FC]/25 rounded-lg p-4 backdrop-blur-sm">
                      <p className="text-xs text-white/50 mb-2 font-mono">
                        UPTIME
                      </p>
                      <p className="text-2xl font-black text-[#C084FC]">
                        99.9%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Feed */}
              <div className="mb-8">
                <p className="text-xs text-white/50 uppercase tracking-widest font-mono mb-4">
                  Recent Activity
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-4 bg-black/30 border border-white/5 rounded-lg">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#9BFFB0] flex-shrink-0"></span>
                    <span className="text-sm text-white/70">
                      Pod autoscaled to 5 replicas
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-black/30 border border-white/5 rounded-lg">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#6EDBD6] flex-shrink-0"></span>
                    <span className="text-sm text-white/70">
                      API deployment updated successfully
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-black/30 border border-white/5 rounded-lg">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D6A65A] flex-shrink-0"></span>
                    <span className="text-sm text-white/70">
                      Database backup completed
                    </span>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <Link
                href="/dashboard"
                className="w-full py-4 bg-gradient-to-r from-[#C084FC] to-[#9BFFB0] text-black font-bold rounded-lg hover:shadow-[0_0_40px_rgba(192,132,252,0.6)] transition-all duration-300 text-center text-lg btn-premium"
              >
                Explore Full Dashboard →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: "🔒",
      title: "Enterprise Security",
      description:
        "Role-based access control, audit logs, and compliance reporting built-in",
    },
    {
      icon: "💬",
      title: "AI Chat Interface",
      description:
        "Natural language commands with multi-turn conversations and context awareness",
    },
    {
      icon: "⚡",
      title: "Real-Time Feedback",
      description:
        "Instant cluster updates, pod metrics, and deployment status tracking",
    },
    {
      icon: "🔄",
      title: "Auto-Remediation",
      description:
        "Automatic healing for failed pods and self-healing deployments",
    },
    {
      icon: "📊",
      title: "Advanced Analytics",
      description:
        "Performance dashboards, resource optimization, and cost analysis",
    },
    {
      icon: "🌐",
      title: "Multi-Cluster",
      description:
        "Manage multiple Kubernetes clusters from a single unified interface",
    },
  ];

  return (
    <section className="relative py-24 px-8 md:px-12 bg-gradient-to-b from-black via-[#0A0E1B]/30 to-black overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C084FC]/10 border border-[#C084FC]/30 rounded-full mb-6">
            <span className="w-2 h-2 bg-[#C084FC] rounded-full"></span>
            <span className="text-sm text-[#C084FC] font-semibold">
              Features
            </span>
          </div>
          <h2 className="text-5xl font-black text-white mb-4">
            Everything You Need
          </h2>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Powerful tools designed for teams that demand reliability and ease
            of use
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="group p-8 bg-[#0B0F1A]/40 border border-white/5 rounded-2xl hover:border-[#C084FC]/30 transition-all duration-300 hover:bg-[#0B0F1A]/60 hover:shadow-[0_0_30px_rgba(192,132,252,0.15)]"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-white/60 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  const plans = [
    {
      name: "Starter",
      price: "Free",
      description: "Perfect for learning",
      features: [
        "1 Cluster",
        "Basic Commands",
        "Community Support",
        "API Access",
      ],
      cta: "Get Started",
      highlight: false,
    },
    {
      name: "Professional",
      price: "$99",
      period: "/month",
      description: "For growing teams",
      features: [
        "5 Clusters",
        "Advanced Commands",
        "Priority Support",
        "RBAC",
        "Audit Logs",
        "API Access",
      ],
      cta: "Start Free Trial",
      highlight: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For large organizations",
      features: [
        "Unlimited Clusters",
        "Custom Integrations",
        "24/7 Support",
        "RBAC",
        "Compliance",
        "SLA",
      ],
      cta: "Contact Sales",
      highlight: false,
    },
  ];

  return (
    <section className="relative py-24 px-8 md:px-12 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C084FC]/10 border border-[#C084FC]/30 rounded-full mb-6">
            <span className="w-2 h-2 bg-[#C084FC] rounded-full"></span>
            <span className="text-sm text-[#C084FC] font-semibold">
              Pricing
            </span>
          </div>
          <h2 className="text-5xl font-black text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-white/60">
            Choose the plan that scales with your team
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`relative p-10 rounded-2xl transition-all duration-300 ${
                plan.highlight
                  ? "border-2 border-[#C084FC] bg-[#0B0F1A]/80 shadow-[0_0_40px_rgba(192,132,252,0.3)] scale-105"
                  : "border border-white/10 bg-[#0B0F1A]/40 hover:border-[#C084FC]/30 hover:bg-[#0B0F1A]/60"
              }`}
            >
              {plan.highlight && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-gradient-to-r from-[#C084FC] to-[#9BFFB0] text-black font-bold rounded-full text-sm">
                  Most Popular
                </div>
              )}

              <h3 className="text-2xl font-bold text-white mb-2">
                {plan.name}
              </h3>
              <p className="text-white/60 mb-6 text-sm">{plan.description}</p>

              <div className="mb-6">
                <span className="text-4xl font-black text-white">
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="text-white/60 text-sm">{plan.period}</span>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, fidx) => (
                  <li
                    key={fidx}
                    className="flex items-center gap-3 text-white/80"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#9BFFB0]"></span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href="/dashboard"
                className={`w-full py-3 rounded-xl font-bold transition-all duration-300 text-center block ${
                  plan.highlight
                    ? "bg-gradient-to-r from-[#C084FC] to-[#9BFFB0] text-black hover:shadow-[0_0_30px_rgba(192,132,252,0.5)]"
                    : "border border-white/20 text-white hover:bg-white/5 hover:border-[#C084FC]/50"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const testimonials = [
    {
      quote:
        "DeployBot transformed how we manage our Kubernetes infrastructure. What used to take hours now takes minutes.",
      author: "Sarah Chen",
      role: "DevOps Lead, TechCorp",
      avatar: "SC",
    },
    {
      quote:
        "The safety features and audit logs give us the confidence to delegate Kubernetes operations to more team members.",
      author: "James Wilson",
      role: "Engineering Manager, StartupXYZ",
      avatar: "JW",
    },
    {
      quote:
        "Best investment in our DevOps toolchain. The ROI was immediate with reduced deployment time and fewer incidents.",
      author: "Priya Sharma",
      role: "CTO, CloudFirst Inc",
      avatar: "PS",
    },
  ];

  return (
    <section className="relative py-24 px-8 md:px-12 bg-gradient-to-b from-black to-[#0A0E1B]/50 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C084FC]/10 border border-[#C084FC]/30 rounded-full mb-6">
            <span className="w-2 h-2 bg-[#C084FC] rounded-full"></span>
            <span className="text-sm text-[#C084FC] font-semibold">
              Testimonials
            </span>
          </div>
          <h2 className="text-5xl font-black text-white mb-4">
            Loved by Teams Worldwide
          </h2>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, idx) => (
            <div
              key={idx}
              className="p-8 bg-[#0B0F1A]/40 border border-white/5 rounded-2xl hover:border-[#C084FC]/30 transition-all duration-300"
            >
              {/* Stars */}
              <div className="mb-4 text-xl">⭐⭐⭐⭐⭐</div>

              {/* Quote */}
              <p className="text-white/80 mb-6 leading-relaxed italic">
                &ldquo;{testimonial.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C084FC] to-[#9BFFB0] flex items-center justify-center text-black font-bold text-sm">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-bold text-white">{testimonial.author}</p>
                  <p className="text-sm text-white/60">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FooterSection() {
  return (
    <footer className="relative py-16 px-8 md:px-12 border-t border-white/5 bg-black">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-12">
          {/* Logo Column */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#C084FC] to-[#9BFFB0] flex items-center justify-center">
                <span className="text-white font-bold">⚡</span>
              </div>
              <span className="font-bold text-white">DeployBot</span>
            </div>
            <p className="text-white/60 text-sm">
              Enterprise-grade Kubernetes management
            </p>
          </div>

          {/* Links */}
          {[
            { title: "Product", links: ["Features", "Pricing", "Security"] },
            { title: "Developers", links: ["Documentation", "API", "SDKs"] },
            { title: "Company", links: ["Blog", "GitHub", "Discord"] },
          ].map((col, idx) => (
            <div key={idx}>
              <p className="font-bold text-white mb-4">{col.title}</p>
              <ul className="space-y-2">
                {col.links.map((link, lidx) => (
                  <li key={lidx}>
                    <Link
                      href="#"
                      className="text-white/60 hover:text-white transition-colors text-sm"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* CTA */}
          <div className="flex flex-col gap-4">
            <p className="font-bold text-white">Ready to Get Started?</p>
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-gradient-to-r from-[#C084FC] to-[#9BFFB0] text-black font-bold rounded-lg text-center text-sm hover:shadow-[0_0_30px_rgba(192,132,252,0.5)] transition-all"
            >
              Start Free
            </Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/60">
          <p>© 2025 DeployBot. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Terms
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPageClient() {
  return (
    <main className="relative bg-black overflow-hidden">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 z-0 opacity-15 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(192,132,252,.1)_1px,transparent_1px),linear-gradient(90deg,rgba(192,132,252,.1)_1px,transparent_1px)] bg-[size:80px_80px]"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <UltraPremiumNavbar />
        <HeroSection />
        <DashboardSection />
        <FeaturesSection />
        <PricingSection />
        <TestimonialsSection />
        <FooterSection />
      </div>
    </main>
  );
}
