
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsAndConditionsPage() {
  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="font-headline text-3xl">Terms and Conditions</CardTitle>
      </CardHeader>
      <CardContent className="prose prose-sm sm:prose-base dark:prose-invert max-w-none space-y-4">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        <p>Please read these terms and conditions carefully before using Our Service.</p>

        <h2 className="font-headline text-2xl">1. Interpretation and Definitions</h2>
        <p>
          The words of which the initial letter is capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.
        </p>
        
        <h2 className="font-headline text-2xl">2. Acknowledgment</h2>
        <p>
          These are the Terms and Conditions governing the use of this Service and the agreement that operates between You and the Company. These Terms and Conditions set out the rights and obligations of all users regarding the use of the Service.
        </p>
        <p>
          Your access to and use of the Service is conditioned on Your acceptance of and compliance with these Terms and Conditions. These Terms and Conditions apply to all visitors, users, and others who access or use the Service.
        </p>

        <h2 className="font-headline text-2xl">3. User Accounts</h2>
        <p>
          When You create an account with Us, You must provide Us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of Your account on Our Service.
        </p>

        <h2 className="font-headline text-2xl">4. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by applicable law, in no event shall the Company or its suppliers be liable for any special, incidental, indirect, or consequential damages whatsoever (including, but not limited to, damages for loss of profits, loss of data or other information, for business interruption, for personal injury, loss of privacy arising out of or in any way related to the use of or inability to use the Service).
        </p>

        <h2 className="font-headline text-2xl">5. Governing Law</h2>
        <p>
          The laws of the Country, excluding its conflicts of law rules, shall govern this Terms and Your use of the Service.
        </p>

        <h2 className="font-headline text-2xl">6. Contact Us</h2>
        <p>
          If you have any questions about these Terms and Conditions, You can contact us.
        </p>
      </CardContent>
    </Card>
  );
}
