export default function Privacy() {
  return (
    <div className="min-h-screen bg-black text-white p-8 pb-24" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 tracking-tighter" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
          Privacy Policy
        </h1>
        
        <div className="space-y-6 text-zinc-300">
          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">1. Information We Collect</h2>
            <p>We collect information you provide directly, including name, email, phone number, bank account details, and property information. We also collect usage data and device information automatically.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">2. How We Use Your Information</h2>
            <p>We use your information to provide our services, process payments, communicate with you, improve our platform, and comply with legal obligations. We do not sell your personal information to third parties.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">3. Data Security</h2>
            <p>We implement industry-standard security measures to protect your data. All financial transactions are encrypted and processed through PCI-compliant payment processors.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">4. Data Sharing</h2>
            <p>We share your information with payment processors (Razorpay), property owners/tenants as necessary, and service providers who assist in operating our platform. We may also disclose information when required by law.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">5. Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal information. You may also opt out of marketing communications at any time.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">6. Data Retention</h2>
            <p>We retain your information for as long as your account is active or as needed to provide services. Financial records are retained as required by applicable laws.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">7. Contact</h2>
            <p>For privacy-related inquiries, contact us at <a href="mailto:privacy@rentflo.com" className="text-white underline">privacy@rentflo.com</a>.</p>
          </section>
        </div>

        <p className="mt-12 text-zinc-500 text-sm">Last updated: February 2026</p>
      </div>
    </div>
  );
}
