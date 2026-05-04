import { LegalHeader } from "@/components/LegalHeader";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8 pb-24" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="max-w-3xl mx-auto">
        <LegalHeader />
        <h1 className="text-4xl font-bold mb-8 tracking-tighter" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
          Terms of Service
        </h1>
        
        <div className="space-y-6 text-zinc-300">
          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">1. Agreement to Terms</h2>
            <p>By accessing or using RentFlo's services, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">2. Description of Service</h2>
            <p>RentFlo is a rent-advance service that provides liquidity to property owners by advancing rent payments before tenant collection. Our platform manages property registration, payment processing, KYC verification, and tenant-landlord coordination.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">3. Service Fee</h2>
            <p><strong className="text-white">RentFlo charges a 5% service fee</strong> on all rent advances provided to property owners. This fee is deducted from the advance amount before disbursement. For example, if the monthly rent is ₹10,000, the property owner will receive ₹9,500 (after deducting the 5% service fee of ₹500). The tenant remains obligated to pay the full rent amount.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">4. User Responsibilities</h2>
            <p>Users are responsible for maintaining the confidentiality of their account credentials and for all activities that occur under their account. Users must provide accurate and complete information during registration.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">5. Payment Terms</h2>
            <p>All payments are processed through Razorpay. By using our payment services, you agree to Razorpay's terms of service. RentFlo charges a service fee as disclosed during the transaction process.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">6. Limitation of Liability</h2>
            <p>RentFlo shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">7. Changes to Terms</h2>
            <p>We reserve the right to modify these terms at any time. We will notify users of any material changes via email or through the platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">8. Contact</h2>
            <p>For questions about these Terms, please contact us at <a href="mailto:legal@rentflo.com" className="text-white underline">legal@rentflo.com</a>.</p>
          </section>
        </div>

        <p className="mt-12 text-zinc-500 text-sm">Last updated: February 2026</p>
      </div>
    </div>
  );
}
