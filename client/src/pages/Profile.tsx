/** Design: Tenant profile preserves its account flows while using RentFLO violet accents. */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/hooks/use-i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User, Mail, Shield, CheckCircle, Loader2,
  Edit2, Save, X, LogOut, Trash2, AlertTriangle,
} from "lucide-react";
import type { User as UserType } from "@shared/schema";
import { safeImageSource } from "@/lib/safe-url";

export default function ProfilePage() {
  const { logout, isLoggingOut } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const { data: currentUser, isLoading } = useQuery<UserType>({ queryKey: ["/api/auth/user"] });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "" });

  // Delete account state
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const startEdit = () => {
    setForm({
      firstName: currentUser?.firstName ?? "",
      lastName: currentUser?.lastName ?? "",
    });
    setEditing(true);
  };

  const cancelEdit = () => setEditing(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await apiRequest("PATCH", "/api/auth/profile", form);
      if (!res.ok) throw new Error((await res.json()).message ?? "Failed to save");
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: t("profile_updated"), description: t("profile_name_saved") });
      setEditing(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const res = await apiRequest("DELETE", "/api/auth/account");
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? "Failed to delete account");
      }
      // Server destroys the session; clear client cache and redirect
      queryClient.clear();
      window.location.replace("/");
    } catch (e: any) {
      toast({ title: "Could not delete account", description: e.message, variant: "destructive" });
      setIsDeleting(false);
      setConfirmingDelete(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#8B5CF6]/40" />
      </div>
    );
  }

  const displayName = [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(" ") || currentUser?.email || "User";
  const initials = (currentUser?.firstName?.[0] ?? currentUser?.email?.[0] ?? "U").toUpperCase();
  const avatarUrl = safeImageSource(currentUser?.profileImageUrl);
  const roleBadge: Record<string, string> = {
    TENANT: t("profile_role_tenant"),
    OWNER: t("profile_role_owner"),
    ADMIN: t("profile_role_admin"),
  };

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="p-4 sm:p-6 md:p-10 pb-28 max-w-lg">

        <header className="mb-8">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">{t("profile_account_label")}</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter">{t("profile_title")}</h1>
        </header>

        {/* Avatar + name */}
        <div className="flex items-center gap-5 mb-8">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-16 h-16 rounded-full object-cover border-2 border-[#8B5CF6]/30"
              data-testid="img-profile-avatar"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-[#8B5CF6]/30 flex items-center justify-center text-2xl font-bold text-[#8B5CF6]" data-testid="div-profile-initials">
              {initials}
            </div>
          )}
          <div>
            <p className="text-xl font-bold" data-testid="text-display-name">{displayName}</p>
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[#8B5CF6] bg-[#8B5CF6]/10 px-2 py-0.5 mt-1">
              {roleBadge[currentUser?.role ?? ""] ?? currentUser?.role}
            </span>
          </div>
        </div>

        {/* Info cards */}
        <div className="space-y-3 mb-6">
          {/* Name */}
          <div className="border border-white/[0.07] bg-zinc-950 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <User size={14} className="text-zinc-500" />
                <span className="text-[10px] uppercase tracking-widest text-zinc-500">{t("profile_full_name")}</span>
              </div>
              {!editing && (
                <button onClick={startEdit} className="text-[10px] text-[#8B5CF6]/70 uppercase tracking-wider hover:text-[#8B5CF6] flex items-center gap-1" data-testid="button-edit-name">
                  <Edit2 size={10} /> {t("profile_edit")}
                </button>
              )}
            </div>
            {editing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5 block">{t("profile_first_name")}</Label>
                    <Input
                      value={form.firstName}
                      onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                      className="bg-zinc-900 border-zinc-700 text-white h-9 text-sm"
                      data-testid="input-first-name"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5 block">{t("profile_last_name")}</Label>
                    <Input
                      value={form.lastName}
                      onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                      className="bg-zinc-900 border-zinc-700 text-white h-9 text-sm"
                      data-testid="input-last-name"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={saving} size="sm" className="bg-[#8B5CF6] text-white hover:bg-[#7C3AED] rounded-none text-xs h-8" data-testid="button-save-name">
                    {saving ? <Loader2 size={12} className="animate-spin mr-1" /> : <Save size={12} className="mr-1" />}
                    {t("profile_save")}
                  </Button>
                  <Button onClick={cancelEdit} variant="ghost" size="sm" className="text-zinc-400 rounded-none text-xs h-8 hover:text-white" data-testid="button-cancel-edit">
                    <X size={12} className="mr-1" /> {t("profile_cancel")}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-white font-medium" data-testid="text-full-name">{displayName}</p>
            )}
          </div>

          {/* Email */}
          <div className="border border-white/[0.07] bg-zinc-950 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Mail size={14} className="text-zinc-500" />
              <span className="text-[10px] uppercase tracking-widest text-zinc-500">{t("profile_email")}</span>
            </div>
            <p className="text-white font-medium" data-testid="text-email">{currentUser?.email ?? "—"}</p>
            <p className="text-[10px] text-zinc-600 mt-0.5">{t("profile_login_provider")}</p>
          </div>

          {/* KYC Status */}
          <div className="border border-white/[0.07] bg-zinc-950 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Shield size={14} className="text-zinc-500" />
              <span className="text-[10px] uppercase tracking-widest text-zinc-500">{t("profile_kyc_status")}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {currentUser?.isVerified ? (
                <>
                  <CheckCircle size={15} className="text-[#8B5CF6]" />
                  <span className="text-sm text-[#8B5CF6] font-medium">{t("profile_verified")}</span>
                </>
              ) : currentUser?.panNumber ? (
                <span className="text-sm text-yellow-400 font-medium">{t("profile_under_review")}</span>
              ) : (
                <span className="text-sm text-zinc-500">{t("profile_not_submitted")}</span>
              )}
            </div>
          </div>

          {/* Legal Name */}
          {currentUser?.fullLegalName && (
            <div className="border border-white/[0.07] bg-zinc-950 p-4">
              <div className="flex items-center gap-2 mb-1">
                <User size={14} className="text-zinc-500" />
                <span className="text-[10px] uppercase tracking-widest text-zinc-500">{t("profile_legal_name")}</span>
              </div>
              <p className="text-white font-medium" data-testid="text-legal-name">{currentUser.fullLegalName}</p>
            </div>
          )}
        </div>

        {/* ── Account actions ── */}
        <div className="space-y-3 pt-2 border-t border-white/[0.06]">
          <p className="text-[10px] uppercase tracking-widest text-zinc-600 pt-4 pb-1">Account</p>

          {/* Sign out */}
          <button
            onClick={() => logout()}
            disabled={isLoggingOut}
            data-testid="button-sign-out-profile"
            className="w-full flex items-center gap-3 px-4 py-3.5 border border-white/[0.07] bg-zinc-950 hover:bg-zinc-900 hover:border-white/[0.13] transition-all text-left"
          >
            {isLoggingOut
              ? <Loader2 size={16} className="text-zinc-400 animate-spin flex-shrink-0" />
              : <LogOut size={16} className="text-zinc-400 flex-shrink-0" />
            }
            <span className="text-sm font-medium text-zinc-300">
              {isLoggingOut ? "Signing out…" : "Sign out"}
            </span>
          </button>

          {/* Delete account */}
          {!confirmingDelete ? (
            <button
              onClick={() => setConfirmingDelete(true)}
              data-testid="button-delete-account-trigger"
              className="w-full flex items-center gap-3 px-4 py-3.5 border border-red-500/20 bg-red-500/[0.04] hover:bg-red-500/[0.08] hover:border-red-500/35 transition-all text-left"
            >
              <Trash2 size={16} className="text-red-400/70 flex-shrink-0" />
              <span className="text-sm font-medium text-red-400/80">Delete account</span>
            </button>
          ) : (
            <div className="border border-red-500/40 bg-red-500/[0.06] p-4 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle size={15} className="text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-300">This is permanent</p>
                  <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                    Your account, KYC data, and all associated records will be deleted immediately and cannot be recovered.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  data-testid="button-delete-account-confirm"
                  className="flex-1 h-9 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  {isDeleting
                    ? <><Loader2 size={12} className="animate-spin" /> Deleting…</>
                    : <><Trash2 size={12} /> Yes, delete</>
                  }
                </button>
                <button
                  onClick={() => setConfirmingDelete(false)}
                  disabled={isDeleting}
                  data-testid="button-delete-account-cancel"
                  className="flex-1 h-9 flex items-center justify-center border border-white/[0.08] text-zinc-400 hover:text-white hover:border-white/[0.18] text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-white/[0.06] pt-6 mt-6">
          <p className="text-[10px] uppercase tracking-widest text-zinc-600 text-center">
            {t("profile_footer")}
          </p>
        </div>
      </div>
    </div>
  );
}
