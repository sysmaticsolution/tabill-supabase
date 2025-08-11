
'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart2, BookOpen, ChefHat, CreditCard, LayoutGrid, ListChecks, PlusCircle, ShoppingCart, Table as TableIcon, UserPlus, Users, Utensils, Warehouse } from "lucide-react";

const steps = [
    {
        icon: UserPlus,
        title: "Step 1: Complete Your Profile & Add Staff",
        content: [
            {
                heading: "Complete Your Profile",
                text: "When you first log in, you'll be directed to the Profile page. It's crucial to fill in all the details, such as your restaurant's name, full address, and contact information. This information is used for generating bills and configuring your account."
            },
            {
                heading: "Manage Staff Members",
                text: "Navigate to 'Staff Management' from the sidebar. Here, you can click 'Add Staff' to create accounts for your team members. Assign specific roles (like Manager, Waitstaff, or Kitchen Staff) and grant access to different modules (e.g., Billing, Inventory) to control what each staff member can see and do."
            }
        ]
    },
    {
        icon: LayoutGrid,
        title: "Step 2: Set Up Your Menu & Inventory",
        content: [
            {
                heading: "Create Menu Categories",
                text: "Go to the 'Menu & Categories' page. Before adding individual food items, it's best to set up categories like 'Appetizers', 'Main Course', 'Beverages', etc. This will help keep your menu organized and easy to navigate."
            },
            {
                heading: "Add Menu Items",
                text: "Once your categories are ready, click 'Add New Item'. You can specify the item name, assign it to a category, and add different versions or sizes (e.g., Half, Full) as 'variants', each with its own cost and selling price. You can also assign a specific chef to an item if needed."
            },
            {
                heading: "Define Inventory Items",
                text: "In the 'Inventory' section, click 'Add New Item' to list all your raw materials and supplies (e.g., 'Onions', 'Chicken', 'Olive Oil'). For each item, set its measurement unit (like kg, L, or pack) and a reorder level to receive alerts when you're running low on stock."
            }
        ]
    },
     {
        icon: Utensils,
        title: "Step 3: Daily Operations",
        content: [
            {
                heading: "Taking an Order",
                text: "To start taking orders, go to the 'Tables' page. Select an available table, which will take you to the order screen. You can add items to the order from the menu panel on the right. If an item has multiple sizes, you'll be prompted to choose one."
            },
            {
                heading: "Printing KOTs (Kitchen Order Tickets)",
                text: "After adding items, you can click 'Print KOT'. This sends a ticket to the kitchen with the list of prepared items for that table, ensuring the chefs know what to cook."
            },
            {
                heading: "Managing Kitchen Requests (Indents)",
                text: "Kitchen staff can visit the 'Kitchen Requests' page to request raw materials from the main inventory or store. Inventory managers will see these requests on the 'Inventory' page and can mark them as 'Fulfilled', which automatically deducts the stock."
            },
            {
                heading: "Handling Billing and Payments",
                text: "From the order screen for a specific table, click 'Proceed to Bill'. This will take you to the billing page where you can apply taxes, and finalize the bill. Choose a payment method (like Cash or Card/UPI) to complete the transaction and then print the final bill for the customer."
            },
        ]
    },
    {
        icon: BarChart2,
        title: "Step 4: Track Your Performance",
        content: [
            {
                heading: "View Sales Reports",
                text: "The 'Reports' page provides a comprehensive overview of your business. You can filter by date to see total revenue, profit, and GST collected. Analyze which items and categories are your best-sellers and identify your peak business hours to optimize operations."
            },
            {
                heading: "Monitor Staff Performance",
                text: "Go to the 'Staff Performance' page to view sales data for each staff member. This helps you track productivity, identify top-performing employees, and manage your team more effectively."
            },
        ]
    }
];

export default function GuidePage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center justify-between gap-4 text-center">
                <h1 className="text-2xl md:text-3xl font-bold font-headline">How-to Guide</h1>
                <p className="text-muted-foreground max-w-2xl">
                    Welcome to Tabill! This guide will walk you through the essential steps to get your restaurant up and running smoothly.
                </p>
            </div>
            
            <div className="max-w-4xl mx-auto w-full space-y-4">
                 <Accordion type="single" collapsible defaultValue="item-0" className="w-full">
                    {steps.map((step, index) => (
                        <AccordionItem value={`item-${index}`} key={index}>
                            <AccordionTrigger>
                                <div className="flex items-center gap-4 text-lg font-semibold">
                                    <step.icon className="h-6 w-6 text-primary"/>
                                    {step.title}
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="pl-10 space-y-4">
                                {step.content.map((item, contentIndex) => (
                                    <div key={contentIndex}>
                                        <h4 className="font-semibold mb-1">{item.heading}</h4>
                                        <p className="text-muted-foreground text-sm">{item.text}</p>
                                    </div>
                                ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>

             <Card>
                <CardHeader>
                    <CardTitle>Need More Help?</CardTitle>
                    <CardDescription>If you have any questions or run into issues, please don't hesitate to reach out to our support team.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm">Contact us via the details on the <a href="/contact-us" className="text-primary underline">Contact Us</a> page.</p>
                </CardContent>
            </Card>
        </div>
    )
}
