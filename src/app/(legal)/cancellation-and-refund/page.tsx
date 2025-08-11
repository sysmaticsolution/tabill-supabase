
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CancellationAndRefundPage() {
  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="font-headline text-3xl">Cancellation and Refund Policy</CardTitle>
      </CardHeader>
      <CardContent className="prose prose-sm sm:prose-base dark:prose-invert max-w-none space-y-4">
        <p>Last updated: {new Date().toLocaleDateString()}</p>

        <h2 className="font-headline text-2xl">1. Order Cancellation</h2>
        <p>
          Orders placed through our application can be cancelled before they are finalized and the bill is printed. Once an order is finalized, it cannot be cancelled through the application. Please contact restaurant staff for any cancellations of finalized orders.
        </p>
        
        <h2 className="font-headline text-2xl">2. Refund Policy</h2>
        <p>
          We do not offer refunds for services rendered. All sales are final. In case of any disputes or issues with your order, please contact the restaurant management directly.
        </p>
        <p>
          Any refunds, if applicable, will be at the sole discretion of the restaurant management and will be processed according to their policies. Tabill is a software provider and is not responsible for any refund claims.
        </p>

        <h2 className="font-headline text-2xl">3. How to Request a Refund</h2>
        <p>
          To request a refund for a disputed charge or order, please speak with the manager on duty at the restaurant location. You will need to provide your order ID and a reason for the request.
        </p>

        <h2 className="font-headline text-2xl">4. Contact Us</h2>
        <p>
          If you have any questions about our Cancellation and Refund Policy, please contact us.
        </p>
      </CardContent>
    </Card>
  );
}
