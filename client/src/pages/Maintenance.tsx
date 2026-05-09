import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useProperties } from "@/hooks/use-properties";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/hooks/use-i18n";
import {
  Wrench, Plus, X, CheckCircle, Clock, AlertCircle,
  Upload, Image as ImageIcon, Building2, Loader2, ChevronDown
} from "lucide-react";
import type { MaintenanceTicket, Property } from "@shared/schema";

type TicketWithProperty = MaintenanceTicket & { property: Property };

const STATUS_CONFIG = {
  OPEN:        { label: "Open",        color: "text-white/70",     border: "border-white/20",       dot: "bg-white/50" },
  IN_PROGRESS: { label: "In Progress", color: "text-[#6FFFE9]/80", border: "border-[#6FFFE9]/30",   dot: "bg-[#6FFFE9]" },
  RESOLVED:    { label: "Resolved",    color: "text-white/30",     border: "border-white/[0.06]",   dot: "bg-white/20" },
};

function StatusBadge({ status }: { status: keyof typeof STATUS_CONFIG }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.OPEN;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 border text-[10px] font-bold uppercase tracking-[1.5px] ${cfg.color} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export default function Maintenance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const { data: properties = [] } = useProperties();
  const role = user?.role;

  const [tab, setTab] = useState<"open" | "resolved">("open");
  const [showForm, setShowForm] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [formPropertyId, setFormPropertyId] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPhoto, setFormPhoto] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: tickets = [], isLoading } = useQuery<TicketWithProperty[]>({
    queryKey: ["/api/tickets"],
  });

  const createMutation = useMutation({
    mutationFn: (data: { propertyId: string; tenantId: string; title: string; description: string; photoUrl?: string }) =>
      apiRequest("POST", "/api/tickets", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({ title: t("maint_ticket_submitted"), description: t("maint_ticket_sent") });
      setShowForm(false);
      setFormTitle(""); setFormDesc(""); setFormPhoto(""); setFormPropertyId("");
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/tickets/${id}/resolve`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({ title: t("maint_resolved"), description: t("maint_resolved_desc") });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: t("maint_file_too_large"), description: t("maint_file_max"), variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setFormPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!formPropertyId) { toast({ title: t("maint_select_property_toast"), variant: "destructive" }); return; }
    if (!formTitle.trim()) { toast({ title: t("maint_enter_title_toast"), variant: "destructive" }); return; }
    if (!formDesc.trim()) { toast({ title: t("maint_describe_issue_toast"), variant: "destructive" }); return; }
    if (!user?.id) return;
    createMutation.mutate({
      propertyId: formPropertyId,
      tenantId: user.id,
      title: formTitle.trim(),
      description: formDesc.trim(),
      photoUrl: formPhoto || undefined,
    });
  };

  const open = tickets.filter(t => t.status === "OPEN" || t.status === "IN_PROGRESS");
  const resolved = tickets.filter(t => t.status === "RESOLVED");
  const displayed = tab === "open" ? open : resolved;

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <div className="max-w-5xl mx-auto px-6 md:px-10 py-10">

        {/* ── Header ──────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 border border-white/10 mb-4">
              <Wrench size={11} className="text-white/30" />
              <span className="text-[10px] font-bold uppercase tracking-[2px] text-white/30">{t("maint_badge")}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-[-1.5px] text-white leading-tight">
              {t("maint_page_title")}
            </h1>
            <p className="text-sm text-white/30 mt-2 font-light">
              {role === "TENANT" ? t("maint_tenant_subtitle") :
               role === "OWNER"  ? t("maint_owner_subtitle") :
               t("maint_admin_subtitle")}
            </p>
          </div>

          {role === "TENANT" && (
            <button
              onClick={() => setShowForm(v => !v)}
              data-testid="button-new-ticket"
              className="flex-shrink-0 flex items-center gap-2 px-5 py-3 border border-white/15 text-white/60 hover:text-white hover:border-white/30 hover:bg-white/[0.04] transition-all duration-200 text-sm font-semibold uppercase tracking-[1px]"
            >
              {showForm ? <X size={14} /> : <Plus size={14} />}
              {showForm ? t("maint_cancel_btn") : t("maint_new_request")}
            </button>
          )}
        </div>

        {/* ── Stat bar ────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-px bg-white/[0.05] mb-8">
          {[
            { label: t("maint_total"),    value: tickets.length,  dim: false },
            { label: t("maint_open"),     value: open.length,     dim: false },
            { label: t("maint_resolved"), value: resolved.length, dim: true  },
          ].map(s => (
            <div key={s.label} className={`px-6 py-5 ${s.dim ? "bg-zinc-950/60" : "bg-zinc-950"}`}>
              <p className="text-[10px] font-bold uppercase tracking-[2px] text-white/25 mb-1">{s.label}</p>
              <p className={`text-3xl font-bold tracking-tight font-mono ${s.dim ? "text-white/25" : "text-white"}`}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* ── New ticket form ─────────────────────────────── */}
        {showForm && role === "TENANT" && (
          <div className="border border-white/[0.08] bg-zinc-950 p-6 md:p-8 mb-8 space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-[2px] text-white/50 border-b border-white/[0.06] pb-4">
              {t("maint_form_heading")}
            </h2>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[1.5px] text-white/30">{t("maint_property_label")}</label>
              <div className="relative">
                <select
                  value={formPropertyId}
                  onChange={e => setFormPropertyId(e.target.value)}
                  data-testid="select-ticket-property"
                  className="w-full appearance-none bg-white/[0.04] border border-white/[0.08] focus:border-[#6FFFE9]/30 outline-none px-4 py-3 pr-10 text-sm text-white/70 transition-colors duration-200"
                >
                  <option value="">{t("maint_select_property")}</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.address}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[1.5px] text-white/30">{t("maint_issue_title_label")}</label>
              <input
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                placeholder="e.g. Leaking bathroom tap"
                maxLength={120}
                data-testid="input-ticket-title"
                className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-[#6FFFE9]/30 outline-none px-4 py-3 text-sm text-white/75 placeholder:text-white/20 transition-colors duration-200"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[1.5px] text-white/30">{t("maint_description_label")}</label>
              <textarea
                value={formDesc}
                onChange={e => setFormDesc(e.target.value)}
                placeholder="Describe the issue in detail…"
                rows={4}
                maxLength={1000}
                data-testid="input-ticket-description"
                className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-[#6FFFE9]/30 outline-none px-4 py-3 text-sm text-white/75 placeholder:text-white/20 resize-none transition-colors duration-200"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[1.5px] text-white/30">{t("maint_photo_optional")}</label>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              {formPhoto ? (
                <div className="relative inline-block">
                  <img src={formPhoto} alt="Preview" className="h-24 w-auto border border-white/10 object-cover" />
                  <button onClick={() => setFormPhoto("")}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-zinc-800 border border-white/10 flex items-center justify-center hover:bg-zinc-700 transition-colors">
                    <X size={10} className="text-white/60" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  data-testid="button-upload-photo"
                  className="flex items-center gap-2.5 px-4 py-3 border border-dashed border-white/[0.12] text-white/30 hover:text-white/55 hover:border-white/25 transition-all duration-200 text-sm"
                >
                  <Upload size={14} />
                  <span>{t("maint_upload_photo_btn")}</span>
                </button>
              )}
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={handleSubmit}
                disabled={createMutation.isPending}
                data-testid="button-submit-ticket"
                className="flex items-center gap-2 px-8 py-3 bg-white text-black text-sm font-bold uppercase tracking-[1px] hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
              >
                {createMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                {t("maint_submit_request")}
              </button>
              <button onClick={() => setShowForm(false)} className="px-4 py-3 text-sm text-white/30 hover:text-white/60 transition-colors">
                {t("maint_cancel_btn")}
              </button>
            </div>
          </div>
        )}

        {/* ── Tab bar ─────────────────────────────────────── */}
        <div className="flex items-center gap-0 border-b border-white/[0.06] mb-8">
          {([
            { key: "open",     label: t("maint_tab_active"),  count: open.length },
            { key: "resolved", label: t("maint_resolved"),    count: resolved.length },
          ] as const).map(tb => (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              data-testid={`tab-${tb.key}`}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-[1.5px] border-b-2 transition-all duration-150 ${
                tab === tb.key
                  ? "border-[#6FFFE9] text-white"
                  : "border-transparent text-white/30 hover:text-white/55"
              }`}
            >
              {tb.label}
              <span className={`px-1.5 py-0.5 text-[9px] font-bold ${tab === tb.key ? "bg-[#6FFFE9]/15 text-[#6FFFE9]" : "bg-white/[0.05] text-white/25"}`}>
                {tb.count}
              </span>
            </button>
          ))}
        </div>

        {/* ── Ticket list ─────────────────────────────────── */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={20} className="animate-spin text-white/20" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            {tab === "open"
              ? <CheckCircle size={32} className="text-white/[0.08]" />
              : <Wrench size={32} className="text-white/[0.08]" />}
            <p className="text-sm text-white/25 font-medium">
              {tab === "open" ? t("maint_no_active") : t("maint_no_resolved")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayed.map(ticket => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                role={role}
                onResolve={() => resolveMutation.mutate(ticket.id)}
                isResolving={resolveMutation.isPending && resolveMutation.variables === ticket.id}
                onViewPhoto={() => setSelectedImage(ticket.photoUrl ?? null)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Image lightbox ──────────────────────────────── */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/92 flex items-center justify-center z-50 cursor-pointer p-8"
          onClick={() => setSelectedImage(null)}
          data-testid="modal-image"
        >
          <div className="relative max-w-3xl max-h-[80vh]" onClick={e => e.stopPropagation()}>
            <img src={selectedImage} alt="Maintenance issue" className="max-w-full max-h-[80vh] object-contain border border-white/[0.08]" />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-3 -right-3 w-7 h-7 bg-zinc-900 border border-white/10 flex items-center justify-center hover:bg-zinc-800 transition-colors"
            >
              <X size={12} className="text-white/60" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TicketCard({
  ticket, role, onResolve, isResolving, onViewPhoto,
}: {
  ticket: TicketWithProperty;
  role?: string;
  onResolve: () => void;
  isResolving: boolean;
  onViewPhoto: () => void;
}) {
  const { t } = useI18n();
  const canResolve = role === "ADMIN" && ticket.status !== "RESOLVED";

  return (
    <div
      className="border border-white/[0.06] bg-zinc-950/60 hover:border-white/[0.12] transition-colors duration-200 p-5 md:p-6"
      data-testid={`ticket-${ticket.id}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
        <div className="flex-1 min-w-0 space-y-2.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <StatusBadge status={ticket.status as keyof typeof STATUS_CONFIG} />
            <span className="text-[10px] text-white/20 font-mono tracking-wide">
              {new Date(ticket.createdAt!).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>

          <h3 className="text-base font-semibold text-white/85 leading-snug tracking-tight">{ticket.title}</h3>
          <p className="text-sm text-white/35 leading-relaxed font-light line-clamp-2">{ticket.description}</p>

          <div className="flex items-center gap-2 pt-1">
            <Building2 size={11} className="text-white/20 flex-shrink-0" />
            <span className="text-[10px] text-white/25 uppercase tracking-[1px] truncate font-medium">{ticket.property.address}</span>
          </div>

          {ticket.status === "RESOLVED" && ticket.resolvedAt && (
            <div className="flex items-center gap-2">
              <CheckCircle size={11} className="text-white/20 flex-shrink-0" />
              <span className="text-[10px] text-white/20 font-mono">
                {t("maint_resolved_on")} {new Date(ticket.resolvedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
          )}
        </div>

        <div className="flex sm:flex-col items-center sm:items-end gap-2.5 flex-shrink-0">
          {ticket.photoUrl && (
            <button
              onClick={onViewPhoto}
              data-testid={`button-photo-${ticket.id}`}
              className="flex items-center gap-1.5 px-3 py-2 border border-white/[0.08] text-white/30 hover:text-white/60 hover:border-white/20 transition-all duration-150 text-xs font-medium"
            >
              <ImageIcon size={12} />
              <span>{t("maint_photo_btn")}</span>
            </button>
          )}
          {canResolve && (
            <button
              onClick={onResolve}
              disabled={isResolving}
              data-testid={`button-resolve-${ticket.id}`}
              className="flex items-center gap-1.5 px-4 py-2 bg-white text-black text-xs font-bold uppercase tracking-[1px] hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isResolving ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
              {t("maint_resolve_btn")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
