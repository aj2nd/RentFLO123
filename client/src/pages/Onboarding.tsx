import { useState } from "react";
import { Building2, Home, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useI18n } from "@/hooks/use-i18n";

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useI18n();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const setRoleMutation = useMutation({
    mutationFn: async (role: string) => {
      const response = await apiRequest("POST", "/api/auth/set-role", { role });
      return response.json();
    },
    onSuccess: (_, role) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: t('welcome_message'),
        description: role === "OWNER" ? t('onboarding_owner_next_step') : t('onboarding_tenant_next_step'),
      });
      setLocation("/setup");
    },
    onError: () => {
      toast({
        title: t('generic_error_title'),
        description: t('onboarding_role_error'),
        variant: "destructive",
      });
    },
  });

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    setRoleMutation.mutate(role);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center mb-16">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
          RentFLO
        </h1>
        <p className="text-zinc-400 text-lg">
          {t('onboarding_subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
        <Button
          onClick={() => handleRoleSelect("OWNER")}
          disabled={setRoleMutation.isPending}
          className="h-64 bg-white text-black hover:bg-zinc-200 border-2 border-white rounded-none flex flex-col items-center justify-center gap-6"
          data-testid="button-select-landlord"
        >
          {setRoleMutation.isPending && selectedRole === "OWNER" ? (
            <Loader2 className="w-16 h-16 animate-spin" />
          ) : (
            <>
              <Building2 className="w-16 h-16" strokeWidth={1.5} />
              <span className="text-2xl font-bold tracking-tight">{t('onboarding_iam_landlord')}</span>
              <span className="text-sm text-zinc-600">{t('onboarding_landlord_desc')}</span>
            </>
          )}
        </Button>

        <Button
          onClick={() => handleRoleSelect("TENANT")}
          disabled={setRoleMutation.isPending}
          className="h-64 bg-secondary text-foreground hover:bg-muted border-2 border-border rounded-none flex flex-col items-center justify-center gap-6"
          data-testid="button-select-tenant"
        >
          {setRoleMutation.isPending && selectedRole === "TENANT" ? (
            <Loader2 className="w-16 h-16 animate-spin" />
          ) : (
            <>
              <Home className="w-16 h-16" strokeWidth={1.5} />
              <span className="text-2xl font-bold tracking-tight">{t('onboarding_iam_tenant')}</span>
              <span className="text-sm text-zinc-600">{t('onboarding_tenant_desc')}</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
