import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Phone, Shield, CheckCircle, Loader2, Edit2, Save, X } from "lucide-react";
import type { User as UserType } from "@shared/schema";

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: currentUser, isLoading } = useQuery<UserType>({ queryKey: ["/api/auth/user"] });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "" });

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
      toast({ title: "Profile Updated", description: "Your name has been saved." });
      setEditing(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#6FFFE9]/40" />
      </div>
    );
  }

  const displayName = [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(" ") || currentUser?.email || "User";
  const initials = (currentUser?.firstName?.[0] ?? currentUser?.email?.[0] ?? "U").toUpperCase();
  const roleBadge: Record<string, string> = { TENANT: "Tenant", OWNER: "Property Owner", ADMIN: "Administrator" };

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="p-4 sm:p-6 md:p-10 pb-24 max-w-lg">

        <header className="mb-8">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Account</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter">Profile</h1>
        </header>

        {/* Avatar + name */}
        <div className="flex items-center gap-5 mb-8">
          {currentUser?.profileImageUrl ? (
            <img
              src={currentUser.profileImageUrl}
              alt={displayName}
              className="w-16 h-16 rounded-full object-cover border-2 border-[#6FFFE9]/30"
              data-testid="img-profile-avatar"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-[#6FFFE9]/30 flex items-center justify-center text-2xl font-bold text-[#6FFFE9]" data-testid="div-profile-initials">
              {initials}
            </div>
          )}
          <div>
            <p className="text-xl font-bold" data-testid="text-display-name">{displayName}</p>
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[#6FFFE9] bg-[#6FFFE9]/10 px-2 py-0.5 mt-1">
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
                <span className="text-[10px] uppercase tracking-widest text-zinc-500">Full Name</span>
              </div>
              {!editing && (
                <button onClick={startEdit} className="text-[10px] text-[#6FFFE9]/70 uppercase tracking-wider hover:text-[#6FFFE9] flex items-center gap-1" data-testid="button-edit-name">
                  <Edit2 size={10} /> Edit
                </button>
              )}
            </div>
            {editing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5 block">First Name</Label>
                    <Input
                      value={form.firstName}
                      onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                      className="bg-zinc-900 border-zinc-700 text-white h-9 text-sm"
                      data-testid="input-first-name"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5 block">Last Name</Label>
                    <Input
                      value={form.lastName}
                      onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                      className="bg-zinc-900 border-zinc-700 text-white h-9 text-sm"
                      data-testid="input-last-name"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={saving} size="sm" className="bg-[#6FFFE9] text-black hover:bg-[#6FFFE9]/90 rounded-none text-xs h-8" data-testid="button-save-name">
                    {saving ? <Loader2 size={12} className="animate-spin mr-1" /> : <Save size={12} className="mr-1" />}
                    Save
                  </Button>
                  <Button onClick={cancelEdit} variant="ghost" size="sm" className="text-zinc-400 rounded-none text-xs h-8 hover:text-white" data-testid="button-cancel-edit">
                    <X size={12} className="mr-1" /> Cancel
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
              <span className="text-[10px] uppercase tracking-widest text-zinc-500">Email</span>
            </div>
            <p className="text-white font-medium" data-testid="text-email">{currentUser?.email ?? "—"}</p>
            <p className="text-[10px] text-zinc-600 mt-0.5">Managed by your login provider</p>
          </div>

          {/* KYC Status */}
          <div className="border border-white/[0.07] bg-zinc-950 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Shield size={14} className="text-zinc-500" />
              <span className="text-[10px] uppercase tracking-widest text-zinc-500">KYC Status</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {currentUser?.isVerified ? (
                <>
                  <CheckCircle size={15} className="text-[#6FFFE9]" />
                  <span className="text-sm text-[#6FFFE9] font-medium">Verified</span>
                </>
              ) : currentUser?.panNumber ? (
                <span className="text-sm text-yellow-400 font-medium">Under Review</span>
              ) : (
                <span className="text-sm text-zinc-500">Not Submitted</span>
              )}
            </div>
          </div>

          {/* Legal Name */}
          {currentUser?.fullLegalName && (
            <div className="border border-white/[0.07] bg-zinc-950 p-4">
              <div className="flex items-center gap-2 mb-1">
                <User size={14} className="text-zinc-500" />
                <span className="text-[10px] uppercase tracking-widest text-zinc-500">Legal Name (KYC)</span>
              </div>
              <p className="text-white font-medium" data-testid="text-legal-name">{currentUser.fullLegalName}</p>
            </div>
          )}
        </div>

        <div className="border-t border-white/[0.06] pt-6">
          <p className="text-[10px] uppercase tracking-widest text-zinc-600 text-center">
            RentFLO · Secured Platform · rentflo.com
          </p>
        </div>
      </div>
    </div>
  );
}
