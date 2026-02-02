import { useState } from "react";
import { Building2, Home, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const setRoleMutation = useMutation({
    mutationFn: async (role: string) => {
      const response = await apiRequest("POST", "/api/auth/set-role", { role });
      return response.json();
    },
    onSuccess: (_, role) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Welcome to RentBro",
        description: role === "OWNER" ? "Let's set up your first property." : "Find your home and start paying rent.",
      });
      setLocation(role === "OWNER" ? "/owner" : "/tenant");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to set your role. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    setRoleMutation.mutate(role);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center mb-16">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
          RENTBRO
        </h1>
        <p className="text-zinc-400 text-lg">
          The future of rent management. Tell us who you are.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
        <Button
          onClick={() => handleRoleSelect("OWNER")}
          disabled={setRoleMutation.isPending}
          className="h-64 bg-white text-black hover:bg-zinc-200 border-2 border-white rounded-none flex flex-col items-center justify-center gap-6 transition-all hover:scale-[1.02] active:scale-[0.98]"
          data-testid="button-select-landlord"
        >
          {setRoleMutation.isPending && selectedRole === "OWNER" ? (
            <Loader2 className="w-16 h-16 animate-spin" />
          ) : (
            <>
              <Building2 className="w-16 h-16" strokeWidth={1.5} />
              <span className="text-2xl font-bold tracking-tight">I AM A LANDLORD</span>
              <span className="text-sm text-zinc-600">Receive rent advances upfront</span>
            </>
          )}
        </Button>

        <Button
          onClick={() => handleRoleSelect("TENANT")}
          disabled={setRoleMutation.isPending}
          className="h-64 bg-black text-white hover:bg-zinc-900 border-2 border-white rounded-none flex flex-col items-center justify-center gap-6 transition-all hover:scale-[1.02] active:scale-[0.98]"
          data-testid="button-select-tenant"
        >
          {setRoleMutation.isPending && selectedRole === "TENANT" ? (
            <Loader2 className="w-16 h-16 animate-spin" />
          ) : (
            <>
              <Home className="w-16 h-16" strokeWidth={1.5} />
              <span className="text-2xl font-bold tracking-tight">I AM A TENANT</span>
              <span className="text-sm text-zinc-500">Pay rent in flexible installments</span>
            </>
          )}
        </Button>
      </div>

      <p className="text-zinc-600 text-sm mt-16">
        You can change your role later in settings
      </p>
    </div>
  );
}
