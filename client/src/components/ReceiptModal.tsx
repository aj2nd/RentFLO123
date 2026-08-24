import { X, Download, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { appendDivider, appendTextElement, openPrintDocument } from "@/lib/print-document";

interface ReceiptData {
  amount: number;
  paymentId: string;
  orderId: string;
  date: Date;
  property: string;
  tenantName: string;
  monthYear?: string;
}

interface ReceiptModalProps {
  data: ReceiptData;
  onClose: () => void;
}

const receiptPrintCss = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #000; color: #fff; font-family: Inter, sans-serif; padding: 40px; }
  .brand { font-size: 28px; font-weight: 900; letter-spacing: -1px; margin-bottom: 4px; color: #6FFFE9; }
  .subtitle { font-size: 11px; text-transform: uppercase; letter-spacing: 4px; color: #6FFFE9; margin-bottom: 32px; }
  .amount { font-size: 52px; font-weight: 900; letter-spacing: -2px; margin: 28px 0 8px; font-family: Georgia, serif; }
  .status { font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #6FFFE9; margin-bottom: 32px; }
  .divider { border: none; border-top: 1px solid rgba(111,255,233,0.15); margin: 20px 0; }
  .row { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; margin: 10px 0; }
  .label { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #71717a; }
  .value { font-size: 13px; color: #fff; text-align: right; max-width: 60%; overflow-wrap: anywhere; }
  .footer { margin-top: 32px; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #3f3f46; text-align: center; }
`;

export function ReceiptModal({ data, onClose }: ReceiptModalProps) {
  const refNo = `RFL-${data.paymentId?.slice(-8)?.toUpperCase() ?? data.orderId?.slice(-8)?.toUpperCase() ?? "N/A"}`;
  const dateStr = data.date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const timeStr = data.date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  const handlePrint = () => {
    const print = openPrintDocument(`RentFLO Receipt ${refNo}`, receiptPrintCss, 480, 700);
    if (!print) return;
    const addRow = (label: string, value: unknown) => {
      const row = print.doc.createElement("div");
      row.className = "row";
      appendTextElement(print.doc, row, "span", label, "label");
      appendTextElement(print.doc, row, "span", value, "value");
      print.body.append(row);
    };
    appendTextElement(print.doc, print.body, "div", "RentFLO", "brand");
    appendTextElement(print.doc, print.body, "div", "Payment Receipt", "subtitle");
    appendDivider(print.doc, print.body);
    appendTextElement(print.doc, print.body, "div", `₹${data.amount.toLocaleString()}`, "amount");
    appendTextElement(print.doc, print.body, "div", "✓ Payment Successful", "status");
    appendDivider(print.doc, print.body);
    addRow("Reference", refNo);
    addRow("Date", `${dateStr}, ${timeStr}`);
    addRow("Property", data.property);
    addRow("Tenant", data.tenantName);
    if (data.monthYear) addRow("Period", data.monthYear);
    addRow("Payment ID", data.paymentId);
    appendDivider(print.doc, print.body);
    appendTextElement(print.doc, print.body, "div", "rentflo.com · Secured by Cashfree · Keep for your records", "footer");
    print.win.focus();
    setTimeout(() => print.win.print(), 400);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full sm:max-w-sm bg-zinc-950 border-t sm:border border-[#6FFFE9]/20 sm:shadow-2xl flex flex-col"
        style={{ maxHeight: "90vh" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500">RentFLO</p>
            <p className="text-xs text-zinc-400 uppercase tracking-widest mt-0.5">Payment Receipt</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors" data-testid="button-close-receipt">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-6 overflow-y-auto" id="receipt-printable">
          <div className="flex items-center gap-2 mb-5">
            <CheckCircle2 size={18} className="text-[#6FFFE9]" />
            <span className="text-xs text-[#6FFFE9] uppercase tracking-widest font-medium">Payment Successful</span>
          </div>

          <p className="text-4xl sm:text-5xl font-black tracking-tighter text-white mb-1" style={{ fontFamily: "Georgia, serif" }}>
            ₹{data.amount.toLocaleString()}
          </p>
          <p className="text-xs text-zinc-500 mb-6">{dateStr} · {timeStr}</p>

          <div className="space-y-3 border-t border-white/[0.06] pt-5">
            {[
              { label: "Reference", value: refNo },
              { label: "Property", value: data.property },
              { label: "Tenant", value: data.tenantName },
              ...(data.monthYear ? [{ label: "Period", value: data.monthYear }] : []),
              { label: "Payment ID", value: data.paymentId, mono: true },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-baseline gap-3">
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 shrink-0">{row.label}</span>
                <span className={`text-xs text-zinc-200 text-right break-all ${row.mono ? "font-mono text-[10px]" : ""}`}>{row.value}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-white/[0.06]">
            <p className="text-[9px] uppercase tracking-widest text-zinc-600 text-center">
              Secured by Cashfree · rentflo.com
            </p>
          </div>
        </div>

        <div className="px-5 pb-6 pt-2 flex gap-3">
          <Button
            onClick={handlePrint}
            className="flex-1 bg-[#6FFFE9] hover:bg-[#6FFFE9]/90 text-black font-semibold text-xs uppercase tracking-widest rounded-none h-11"
            data-testid="button-download-receipt"
          >
            <Download size={14} className="mr-2" />
            Save / Print
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 border-white/10 text-zinc-400 hover:text-white hover:border-white/20 rounded-none h-11 text-xs uppercase tracking-widest bg-transparent"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
