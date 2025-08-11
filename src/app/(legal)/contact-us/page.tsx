
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Mail } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function ContactUsPage() {
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="font-headline text-3xl">Contact Us</CardTitle>
        <CardDescription>
          Have questions? We'd love to hear from you. Reach out via the details below or fill out the form and we'll get back to you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid sm:grid-cols-3 gap-8 mb-8 text-sm">
            <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 mt-1 text-primary"/>
                <div>
                    <h3 className="font-semibold">Address</h3>
                    <p className="text-muted-foreground">330, 2nd Street, Swamy Ramalingam Colony, Kolathur, Chennai, Tamil Nadu 600110</p>
                </div>
            </div>
            <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 mt-1 text-primary"/>
                <div>
                    <h3 className="font-semibold">Phone</h3>
                    <p className="text-muted-foreground">+91 93451 11211</p>
                </div>
            </div>
            <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 mt-1 text-primary"/>
                <div>
                    <h3 className="font-semibold">Email</h3>
                    <p className="text-muted-foreground">info@veltron.in</p>
                </div>
            </div>
        </div>

        <Separator className="my-6" />

        <form className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first-name">First Name</Label>
              <Input id="first-name" placeholder="Anand" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last-name">Last Name</Label>
              <Input id="last-name" placeholder="Kumar" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="anand@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" placeholder="Enter your message" className="min-h-[120px]" />
          </div>
          <Button type="submit" className="w-full">
            Send Message
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
