
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ShippingAndDeliveryPage() {
  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="font-headline text-3xl">Shipping and Delivery Policy</CardTitle>
      </CardHeader>
      <CardContent className="prose prose-sm sm:prose-base dark:prose-invert max-w-none space-y-4">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        
        <p>
          This Shipping and Delivery Policy applies to all services provided by Tabill.
        </p>

        <h2 className="font-headline text-2xl">1. Service Delivery</h2>
        <p>
          Tabill provides a digital service for restaurant management, including menu management, order taking, and billing. Our service is delivered digitally through our web application. There are no physical products that are shipped or delivered.
        </p>
        
        <h2 className="font-headline text-2xl">2. Food and Beverage Delivery</h2>
        <p>
          Tabill is a software platform and is not directly involved in the preparation, sale, or delivery of food and beverages. All food and beverage items ordered through our application are for dine-in purposes at the respective restaurant. 
        </p>
        <p>
          We do not offer a shipping or home delivery service for food items. Any delivery services offered by the restaurant are separate from the Tabill platform and are subject to the restaurant's own policies and terms.
        </p>

        <h2 className="font-headline text-2xl">3. Account Access</h2>
        <p>
          Access to your Tabill account and services is granted immediately upon successful registration and login. You will be able to use the features of the application as per your subscription plan.
        </p>
        
        <h2 className="font-headline text-2xl">4. Contact Us</h2>
        <p>
          If you have any questions about our Shipping and Delivery Policy, please contact us.
        </p>
      </CardContent>
    </Card>
  );
}
