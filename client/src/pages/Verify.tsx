import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Navigation } from "@/components/Navigation";
import { Upload, CheckCircle, Clock, AlertCircle } from "lucide-react";
import type { User } from "@shared/schema";

export default function Verify() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    fullLegalName: "",
    panNumber: "",
    aadhaarNumber: "",
    kycDocumentUrl: "",
    bankAccountNumber: "",
    ifscCode: "",
    cancelledChequeUrl: "",
  });

  const { data: currentUser, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  const submitKycMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/kyc/submit", data);
    },
    onSuccess: () => {
      toast({
        title: "KYC Submitted",
        description: "Your verification documents have been submitted. We'll review them within 1-2 business days.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "kycDocumentUrl" | "cancelledChequeUrl"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setFormData((prev) => ({ ...prev, [field]: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitKycMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  const isOwner = currentUser?.role === "OWNER";
  const isVerified = currentUser?.isVerified;
  const hasPendingKyc = currentUser?.panNumber && !isVerified;

  return (
    <div className="min-h-screen bg-black text-white" style={{ fontFamily: "Inter, sans-serif" }}>
      <Navigation />
      <div className="p-8 pb-24">
        <div className="max-w-2xl mx-auto">
          <h1
            className="text-4xl font-bold mb-2 tracking-tighter"
            style={{ fontFamily: "Playfair Display, Georgia, serif" }}
          >
            KYC Verification
          </h1>
          <p className="text-zinc-400 mb-8">Complete your identity verification to unlock all features</p>

          {isVerified ? (
            <div className="bg-zinc-900 p-8 border-2 border-green-500">
              <div className="flex items-center gap-4 mb-4">
                <CheckCircle className="w-12 h-12 text-green-500" />
                <div>
                  <h2 className="text-2xl font-bold text-green-500">Verified</h2>
                  <p className="text-zinc-400">Your identity has been verified. All features are unlocked.</p>
                </div>
              </div>
            </div>
          ) : hasPendingKyc ? (
            <div className="bg-zinc-900 p-8 border-2 border-yellow-500">
              <div className="flex items-center gap-4 mb-4">
                <Clock className="w-12 h-12 text-yellow-500" />
                <div>
                  <h2 className="text-2xl font-bold text-yellow-500">Verification in Progress</h2>
                  <p className="text-zinc-400">
                    Your documents are being reviewed. This usually takes 1-2 business days.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-zinc-900 p-6 border border-zinc-800">
                <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Identity Information
                </h2>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="fullLegalName" className="text-zinc-300">
                      Full Legal Name (as per PAN)
                    </Label>
                    <Input
                      id="fullLegalName"
                      value={formData.fullLegalName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, fullLegalName: e.target.value }))}
                      className="bg-black border-zinc-700 text-white mt-1"
                      placeholder="Enter your full legal name"
                      required
                      data-testid="input-full-legal-name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="panNumber" className="text-zinc-300">
                      PAN Number
                    </Label>
                    <Input
                      id="panNumber"
                      value={formData.panNumber}
                      onChange={(e) => setFormData((prev) => ({ ...prev, panNumber: e.target.value.toUpperCase() }))}
                      className="bg-black border-zinc-700 text-white mt-1"
                      placeholder="ABCDE1234F"
                      pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                      maxLength={10}
                      required
                      data-testid="input-pan-number"
                    />
                  </div>

                  <div>
                    <Label htmlFor="aadhaarNumber" className="text-zinc-300">
                      Aadhaar Number
                    </Label>
                    <Input
                      id="aadhaarNumber"
                      value={formData.aadhaarNumber}
                      onChange={(e) => setFormData((prev) => ({ ...prev, aadhaarNumber: e.target.value.replace(/\D/g, "") }))}
                      className="bg-black border-zinc-700 text-white mt-1"
                      placeholder="1234 5678 9012"
                      maxLength={12}
                      required
                      data-testid="input-aadhaar-number"
                    />
                  </div>

                  <div>
                    <Label htmlFor="kycDocument" className="text-zinc-300">
                      Identity Document (PAN/Aadhaar - PDF or Image)
                    </Label>
                    <div className="mt-1 flex items-center gap-4">
                      <label className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 cursor-pointer hover:bg-zinc-700 transition-colors">
                        <Upload className="w-4 h-4" />
                        <span>Upload Document</span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileUpload(e, "kycDocumentUrl")}
                          className="hidden"
                          data-testid="input-kyc-document"
                        />
                      </label>
                      {formData.kycDocumentUrl && (
                        <span className="text-green-500 text-sm">Document uploaded</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {isOwner && (
                <div className="bg-zinc-900 p-6 border border-zinc-800">
                  <h2 className="text-xl font-semibold mb-4 text-white">Bank Details (Landlord Only)</h2>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="bankAccountNumber" className="text-zinc-300">
                        Bank Account Number
                      </Label>
                      <Input
                        id="bankAccountNumber"
                        value={formData.bankAccountNumber}
                        onChange={(e) => setFormData((prev) => ({ ...prev, bankAccountNumber: e.target.value.replace(/\D/g, "") }))}
                        className="bg-black border-zinc-700 text-white mt-1"
                        placeholder="Enter bank account number"
                        required
                        data-testid="input-bank-account"
                      />
                    </div>

                    <div>
                      <Label htmlFor="ifscCode" className="text-zinc-300">
                        IFSC Code
                      </Label>
                      <Input
                        id="ifscCode"
                        value={formData.ifscCode}
                        onChange={(e) => setFormData((prev) => ({ ...prev, ifscCode: e.target.value.toUpperCase() }))}
                        className="bg-black border-zinc-700 text-white mt-1"
                        placeholder="HDFC0001234"
                        pattern="[A-Z]{4}0[A-Z0-9]{6}"
                        maxLength={11}
                        required
                        data-testid="input-ifsc-code"
                      />
                    </div>

                    <div>
                      <Label htmlFor="cancelledCheque" className="text-zinc-300">
                        Cancelled Cheque (PDF or Image)
                      </Label>
                      <div className="mt-1 flex items-center gap-4">
                        <label className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 cursor-pointer hover:bg-zinc-700 transition-colors">
                          <Upload className="w-4 h-4" />
                          <span>Upload Cheque</span>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => handleFileUpload(e, "cancelledChequeUrl")}
                            className="hidden"
                            data-testid="input-cancelled-cheque"
                          />
                        </label>
                        {formData.cancelledChequeUrl && (
                          <span className="text-green-500 text-sm">Cheque uploaded</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-white text-black hover:bg-zinc-200 py-6 text-lg font-semibold"
                disabled={submitKycMutation.isPending}
                data-testid="button-submit-kyc"
              >
                {submitKycMutation.isPending ? "Submitting..." : "Submit for Verification"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
