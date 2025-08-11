
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Logo from '@/components/logo';
import { Check, BarChart2, ChefHat, ShoppingCart, Users, Utensils, Zap } from 'lucide-react';
import Link from 'next/link';
import { useScrollAnimation } from '@/hooks/use-scroll-animation';
import { useRef } from 'react';
import { cn } from '@/lib/utils';

const proFeatures = [
    "Table & Order Management",
    "Billing & KOT Printing",
    "Menu & Category Management",
    "Advanced Sales Reports",
    "Staff Management & Permissions",
    "Full Inventory Control",
    "Procurement & Supplier Database",
    "Kitchen Production Logging"
];

const liteFeatures = [
    "Table & Order Management",
    "Billing & KOT Printing",
    "Menu & Category Management",
    "Basic Sales Reports",
    "Staff Management (up to 5)",
];

const footerLinks = [
    { href: "/contact-us", label: "Contact Us" },
    { href: "/terms-and-conditions", label: "Terms & Conditions" },
    { href: "/privacy-policy", label: "Privacy Policy" },
    { href: "/cancellation-and-refund", label: "Cancellation & Refund" },
    { href: "/shipping-and-delivery", label: "Shipping & Delivery" },
];

const coreFeatures = [
    {
        icon: Utensils,
        title: "Effortless Order & Table Management",
        description: "A simple, intuitive interface for your staff to take orders, manage tables, and print KOTs instantly, reducing errors and speeding up service."
    },
    {
        icon: Zap,
        title: "Streamlined Billing",
        description: "Generate accurate bills in seconds. Apply taxes, manage payment methods, and provide customers with professional, printed receipts."
    },
    {
        icon: BarChart2,
        title: "Data-Driven Reports",
        description: "Gain valuable insights with comprehensive reports on sales, top-selling items, and peak business hours to make smarter decisions."
    },
    {
        icon: ChefHat,
        title: "Total Kitchen Control (PRO)",
        description: "Log daily production, manage kitchen requests for raw materials, and assign specific items to chefs to optimize kitchen workflow."
    },
    {
        icon: ShoppingCart,
        title: "Full Inventory & Procurement (PRO)",
        description: "Track raw materials, get low-stock alerts, manage suppliers, and create purchase orders to control costs and reduce waste."
    },
    {
        icon: Users,
        title: "Flexible Staff Management",
        description: "Create accounts for your staff, assign roles, and control access to different modules, ensuring secure and efficient team management."
    }
];

export default function HomePage() {
  const featuresRef = useScrollAnimation();
  const pricingRef = useScrollAnimation();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
                <Logo />
            </Link>
            <nav className="flex items-center gap-4">
                <Button asChild variant="ghost">
                    <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild>
                    <Link href="/signup">Get Started</Link>
                </Button>
            </nav>
        </div>
      </header>
      <main className="flex-1">
        <section className="container flex flex-col items-center text-center py-20 sm:py-32">
            <h1 className="text-4xl md:text-6xl font-extrabold font-headline tracking-tight">
                The New Standard in Restaurant Management
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
                From taking orders to tracking inventory, Tabill provides the tools you need to run your restaurant efficiently and boost your profits.
            </p>
            <div className="mt-8 flex justify-center gap-4">
                 <Button asChild size="lg">
                    <Link href="#pricing">Choose Your Plan</Link>
                </Button>
                 <Button asChild size="lg" variant="outline">
                    <Link href="/signup">Try for Free</Link>
                </Button>
            </div>
        </section>

        <section ref={featuresRef as React.RefObject<HTMLDivElement>} className="container py-20 sm:py-24 animated-section">
             <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold font-headline">One App to Manage It All</h2>
                <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
                    Tabill simplifies your restaurant's daily operations, saving you time and money so you can focus on what matters most: your customers.
                </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {coreFeatures.map(feature => (
                    <div key={feature.title} className="flex items-start gap-4">
                        <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                            <feature.icon className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold font-headline">{feature.title}</h3>
                            <p className="text-muted-foreground mt-1">{feature.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>

        <section ref={pricingRef as React.RefObject<HTMLDivElement>} id="pricing" className="container py-20 sm:py-24 bg-muted/20 rounded-lg animated-section">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold font-headline">Simple, Transparent Pricing</h2>
                <p className="mt-4 max-w-xl mx-auto text-muted-foreground">
                    Choose the plan that's right for your business. No hidden fees.
                </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Tabill Lite</CardTitle>
                        <CardDescription>Perfect for small cafes and restaurants getting started.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                        <div className="flex items-baseline gap-2">
                           <span className="text-4xl font-bold">Rs. 700</span>
                           <span className="text-xl font-medium text-muted-foreground line-through">Rs. 1000</span>
                           <span className="text-lg font-normal text-muted-foreground self-end">/ month</span>
                        </div>
                        <ul className="space-y-3">
                            {liteFeatures.map((feature, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <Check className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                                    <span className="text-muted-foreground">{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button asChild className="w-full">
                            <Link href="/signup">Try for Free</Link>
                        </Button>
                    </CardFooter>
                </Card>
                 <Card className="border-primary flex flex-col shadow-lg">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle className="font-headline text-2xl">Tabill PRO</CardTitle>
                            <div className="px-3 py-1 text-sm font-semibold rounded-full bg-primary text-primary-foreground">Most Popular</div>
                        </div>
                        <CardDescription>For growing restaurants that need full control over their operations.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                        <div className="flex items-baseline gap-2">
                           <span className="text-4xl font-bold">Rs. 1400</span>
                           <span className="text-xl font-medium text-muted-foreground line-through">Rs. 2000</span>
                           <span className="text-lg font-normal text-muted-foreground self-end">/ month</span>
                        </div>
                         <ul className="space-y-3">
                            {proFeatures.map((feature, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <Check className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                    <CardFooter>
                         <Button asChild className="w-full">
                            <Link href="/signup">Try for Free</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </section>
      </main>
       <footer className="bg-muted/40 border-t">
          <div className="container py-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <Logo />
                <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                    {footerLinks.map(link => (
                        <Link key={link.href} href={link.href} className="hover:text-primary transition-colors">
                            {link.label}
                        </Link>
                    ))}
                </nav>
            </div>
            <div className="mt-6 pt-6 border-t text-center text-sm text-muted-foreground">
                © {new Date().getFullYear()} Tabill. All Rights Reserved.
            </div>
          </div>
        </footer>
    </div>
  );
}
