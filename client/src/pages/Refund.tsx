import { LegalHeader } from "@/components/LegalHeader";

export default function Refund() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8 pb-24" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="max-w-3xl mx-auto">
        <LegalHeader />
        <h1 className="text-4xl font-bold mb-8 tracking-tighter" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
          Cancellation & Refund Policy | RentFLO
        </h1>
        <p className="text-zinc-400 mb-8">How cancellations and refunds work for RentFLO rent advances and payments.</p>

        <div className="space-y-6 text-zinc-300">
          <section className="bg-zinc-900 p-6 border-2 border-white">
            <h2 className="text-xl font-semibold mb-3 text-white">IMPORTANT: Non-Refundable Advances</h2>
            <p className="text-white font-medium">Rent advances are non-refundable once disbursed to the property owner. Once RentFlo has transferred the advance amount to the landlord's bank account, the transaction is final and cannot be reversed. The tenant remains legally obligated to complete all scheduled payments as agreed in the rent advance agreement.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">1. Rent Advance Cancellation</h2>
            <p>Once a rent advance has been disbursed to a property owner, it cannot be cancelled. The advance is a commitment made by RentFlo on behalf of the tenant, and the tenant must fulfill their payment obligations according to the agreed schedule.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">2. Payment Refunds</h2>
            <p>Tenant payments are non-refundable once processed. In case of overpayment or duplicate transactions, refunds will be processed within 7-10 business days after verification.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">3. Service Fee Refunds</h2>
            <p>Service fees charged by RentFlo are non-refundable. These fees compensate for the financial risk and administrative costs incurred in providing the rent advance service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">4. Property Owner Refunds</h2>
            <p>Property owners who have received advances are not eligible for refunds. In case of disputes, the advance amount will be adjusted in subsequent payment cycles.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">5. Account Closure</h2>
            <p>Users may request account closure at any time. However, any outstanding payment obligations must be fulfilled before the account can be closed.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">6. Dispute Resolution</h2>
            <p>For payment disputes or refund requests, please contact our support team at <a href="mailto:support@rentflo.com" className="text-white underline">support@rentflo.com</a>. We will investigate and respond within 5 business days.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">7. Processing Time</h2>
            <p>Approved refunds are processed within 7-10 business days. The actual credit to your bank account may take an additional 3-5 business days depending on your bank.</p>
          </section>
        </div>

        <p className="mt-12 text-zinc-500 text-sm">Last updated: February 2026</p>
      </div>
    </div>
  );
}
