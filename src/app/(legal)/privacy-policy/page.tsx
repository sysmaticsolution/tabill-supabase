
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPolicyPage() {
  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="font-headline text-3xl">Privacy Policy</CardTitle>
      </CardHeader>
      <CardContent className="prose prose-sm sm:prose-base dark:prose-invert max-w-none space-y-4">
        <p>Last updated: {new Date().toLocaleDateString()}</p>

        <p>
          Welcome to Tabill. We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application.
        </p>

        <h2 className="font-headline text-2xl">1. Information We Collect</h2>
        <p>
          We may collect personal identification information from you in a variety of ways, including, but not limited to, when you register on the application, place an order, and in connection with other activities, services, features, or resources we make available. You may be asked for, as appropriate, name, email address, etc.
        </p>

        <h2 className="font-headline text-2xl">2. How We Use Your Information</h2>
        <p>
          We may use the information we collect from you to:
        </p>
        <ul>
          <li>Personalize your experience and to allow us to deliver the type of content and product offerings in which you are most interested.</li>
          <li>Improve our application in order to better serve you.</li>
          <li>Process your transactions quickly.</li>
          <li>Send periodic emails regarding your order or other products and services.</li>
        </ul>

        <h2 className="font-headline text-2xl">3. How We Protect Your Information</h2>
        <p>
          We implement a variety of security measures to maintain the safety of your personal information when you place an order or enter, submit, or access your personal information.
        </p>

        <h2 className="font-headline text-2xl">4. Changes to This Privacy Policy</h2>
        <p>
          We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.
        </p>

        <h2 className="font-headline text-2xl">5. Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy, please contact us.
        </p>
      </CardContent>
    </Card>
  );
}
