import { Mail, Phone, Clock } from "lucide-react";
import { LegalHeader } from "@/components/LegalHeader";

export default function Support() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8 pb-24" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="max-w-3xl mx-auto">
        <LegalHeader />
        <h1 className="text-4xl font-bold mb-8 tracking-tighter" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
          Contact Support | RentFLO
        </h1>
        <p className="text-zinc-400 mb-8">Get help with KYC, rent payments, property setup, and maintenance requests.</p>

        <div className="space-y-8 text-zinc-300">
          <section className="bg-zinc-900 p-8 border-2 border-white">
            <h2 className="text-2xl font-semibold mb-6 text-white" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
              We're Here to Help
            </h2>
            <p className="mb-6">
              Our support team is available to assist you with any questions about rent advances, payments, 
              property management, or KYC verification. We aim to respond to all inquiries within 24 hours.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Mail className="w-6 h-6 text-white" />
                <div>
                  <p className="text-white font-medium">Email Support</p>
                  <a 
                    href="mailto:support@rentflo.com" 
                    className="text-zinc-400 hover:text-white transition-colors"
                    data-testid="support-email"
                  >
                    support@rentflo.com
                  </a>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Phone className="w-6 h-6 text-white" />
                <div>
                  <p className="text-white font-medium">Phone Support</p>
                  <a 
                    href="tel:+911234567890" 
                    className="text-zinc-400 hover:text-white transition-colors"
                    data-testid="support-phone"
                  >
                    +91 123 456 7890
                  </a>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Clock className="w-6 h-6 text-white" />
                <div>
                  <p className="text-white font-medium">Business Hours</p>
                  <p className="text-zinc-400">Monday - Friday: 9:00 AM - 6:00 PM IST</p>
                  <p className="text-zinc-400">Saturday: 10:00 AM - 2:00 PM IST</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-white">Frequently Asked Questions</h2>
            
            <div className="space-y-4">
              <div className="border border-zinc-800 p-4">
                <h3 className="text-white font-medium mb-2">How long does KYC verification take?</h3>
                <p className="text-zinc-400">KYC verification typically takes 1-2 business days after document submission.</p>
              </div>
              
              <div className="border border-zinc-800 p-4">
                <h3 className="text-white font-medium mb-2">When will I receive my rent advance?</h3>
                <p className="text-zinc-400">Once your KYC is verified and property is registered, rent advances are processed on the payout day you specified.</p>
              </div>
              
              <div className="border border-zinc-800 p-4">
                <h3 className="text-white font-medium mb-2">Can I make partial rent payments?</h3>
                <p className="text-zinc-400">Yes, tenants can make flexible partial payments. Toggle the "Flexible Payment" option on your dashboard.</p>
              </div>
              
              <div className="border border-zinc-800 p-4">
                <h3 className="text-white font-medium mb-2">What documents are required for KYC?</h3>
                <p className="text-zinc-400">PAN card, Aadhaar card, and identity document. Landlords also need bank account details and a cancelled cheque.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-white">Escalation</h2>
            <p>
              If your issue remains unresolved after 48 hours, please escalate to our senior support team at{" "}
              <a href="mailto:escalation@rentflo.com" className="text-white underline">escalation@rentflo.com</a>
            </p>
          </section>
        </div>

        <p className="mt-12 text-zinc-500 text-sm">Response time: Within 24 business hours</p>
      </div>
    </div>
  );
}
