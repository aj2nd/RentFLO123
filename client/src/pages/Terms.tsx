export default function Terms() {
  return (
    <div className="min-h-screen bg-black text-white p-8 pb-24" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 tracking-tighter" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
          Terms of Service
        </h1>
        
        <div className="space-y-6 text-zinc-300">
          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">1. Agreement to Terms</h2>
            <p>By accessing or using RentBro's services, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">2. Description of Service</h2>
            <p>RentBro provides a rent advance platform that offers liquidity to property owners by advancing rent payments before tenant collection. Our services include property management, payment processing, and tenant-landlord coordination.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">3. User Responsibilities</h2>
            <p>Users are responsible for maintaining the confidentiality of their account credentials and for all activities that occur under their account. Users must provide accurate and complete information during registration.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">4. Payment Terms</h2>
            <p>All payments are processed through Razorpay. By using our payment services, you agree to Razorpay's terms of service. RentBro charges a service fee as disclosed during the transaction process.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">5. Limitation of Liability</h2>
            <p>RentBro shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">6. Changes to Terms</h2>
            <p>We reserve the right to modify these terms at any time. We will notify users of any material changes via email or through the platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">7. Contact</h2>
            <p>For questions about these Terms, please contact us at <a href="mailto:legal@rentbro.com" className="text-white underline">legal@rentbro.com</a>.</p>
          </section>
        </div>

        <p className="mt-12 text-zinc-500 text-sm">Last updated: February 2026</p>
      </div>
    </div>
  );
}
