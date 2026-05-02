import { useTickets, useResolveTicket } from "@/hooks/use-ledgers";
import { Loader2, CheckCircle, Clock, AlertCircle, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { useI18n } from "@/hooks/use-i18n";

export default function AdminMaintenance() {
  const { data: tickets, isLoading } = useTickets();
  const { mutate: resolveTicket, isPending: isResolving } = useResolveTicket();
  const { toast } = useToast();
  const { t } = useI18n();
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleResolve = (ticketId: string) => {
    setResolvingId(ticketId);
    resolveTicket(ticketId, {
      onSuccess: () => {
        toast({ title: "Ticket Resolved", description: "The maintenance request has been marked as resolved." });
        queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
        setResolvingId(null);
      },
      onError: (error: any) => {
        toast({ title: "Failed", description: error.message, variant: "destructive" });
        setResolvingId(null);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <Loader2 className="w-8 h-8 animate-spin" data-testid="loader-maintenance" />
      </div>
    );
  }

  const openTickets = tickets?.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS') || [];
  const resolvedTickets = tickets?.filter(t => t.status === 'RESOLVED') || [];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="p-4 sm:p-6 md:p-10">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>{t('maint_title')}</h1>
          <p className="text-zinc-500 text-sm">{t('maint_subtitle')}</p>
        </header>

        <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-8">
          <div className="border border-zinc-800 p-3 sm:p-6 bg-zinc-950" data-testid="stat-total-tickets">
            <p className="text-zinc-400 text-xs uppercase tracking-wider mb-1 sm:mb-2">{t('maint_total')}</p>
            <p className="text-2xl sm:text-4xl font-bold font-mono">{tickets?.length || 0}</p>
          </div>
          <div className="border border-zinc-700 p-3 sm:p-6 bg-zinc-900" data-testid="stat-open-tickets">
            <p className="text-zinc-300 text-xs uppercase tracking-wider mb-1 sm:mb-2">{t('maint_open')}</p>
            <p className="text-2xl sm:text-4xl font-bold font-mono text-white">{openTickets.length}</p>
          </div>
          <div className="border border-zinc-800 p-3 sm:p-6 bg-zinc-950" data-testid="stat-resolved-tickets">
            <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1 sm:mb-2">{t('maint_resolved')}</p>
            <p className="text-2xl sm:text-4xl font-bold font-mono text-zinc-400">{resolvedTickets.length}</p>
          </div>
        </div>

        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <AlertCircle className="text-white" />
            <h2 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>{t('maint_open_requests')}</h2>
          </div>
          {openTickets.length === 0 ? (
            <div className="border border-zinc-800 p-8 text-center text-zinc-500">{t('maint_no_open')}</div>
          ) : (
            <div className="space-y-4">
              {openTickets.map(ticket => (
                <div key={ticket.id} className="border border-zinc-800 p-6 bg-zinc-950 hover:border-zinc-600 transition-colors" data-testid={`ticket-open-${ticket.id}`}>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Clock size={14} className="text-white shrink-0" />
                        <span className="text-xs uppercase tracking-wider text-white border border-zinc-600 px-2 py-0.5">{ticket.status}</span>
                        <span className="text-zinc-500 text-xs font-mono">{new Date(ticket.createdAt!).toLocaleDateString()}</span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold mb-1">{ticket.title}</h3>
                      <p className="text-zinc-400 text-sm mb-2">{ticket.description}</p>
                      <p className="text-zinc-600 text-xs uppercase tracking-wider truncate">{t('maint_property')}: {ticket.property.address}</p>
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end gap-3 shrink-0">
                      {ticket.photoUrl && (
                        <button onClick={() => setSelectedImage(ticket.photoUrl)}
                          className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1 text-sm"
                          data-testid={`button-view-photo-${ticket.id}`}>
                          <ImageIcon size={14} />
                          <span className="hidden sm:inline">{t('maint_view_photo')}</span>
                        </button>
                      )}
                      <Button onClick={() => handleResolve(ticket.id)} disabled={isResolving && resolvingId === ticket.id}
                        className="bg-white text-black border border-white hover:bg-zinc-200 text-xs sm:text-sm px-3"
                        data-testid={`button-resolve-${ticket.id}`}>
                        {isResolving && resolvingId === ticket.id ? <Loader2 className="animate-spin mr-1 w-3 h-3" /> : <CheckCircle size={14} className="mr-1" />}
                        {t('maint_resolve')}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle className="text-zinc-500" />
            <h2 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>{t('maint_resolved')}</h2>
          </div>
          {resolvedTickets.length === 0 ? (
            <div className="border border-zinc-800 p-8 text-center text-zinc-500">{t('maint_no_resolved')}</div>
          ) : (
            <div className="border border-zinc-800 overflow-x-auto">
              <table className="w-full text-left min-w-[480px]">
                <thead className="bg-zinc-900 text-zinc-400 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="p-4 font-medium">{t('maint_date')}</th>
                    <th className="p-4 font-medium">{t('maint_title_col')}</th>
                    <th className="p-4 font-medium">{t('maint_property')}</th>
                    <th className="p-4 font-medium">{t('maint_resolved')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {resolvedTickets.map(ticket => (
                    <tr key={ticket.id} className="hover:bg-zinc-900/50" data-testid={`ticket-resolved-${ticket.id}`}>
                      <td className="p-4 text-zinc-400 font-mono text-sm">{new Date(ticket.createdAt!).toLocaleDateString()}</td>
                      <td className="p-4 font-medium">{ticket.title}</td>
                      <td className="p-4 text-zinc-400 truncate max-w-[200px]">{ticket.property.address}</td>
                      <td className="p-4 text-zinc-400 font-mono text-sm">{ticket.resolvedAt ? new Date(ticket.resolvedAt).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {selectedImage && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 cursor-pointer"
            onClick={() => setSelectedImage(null)} data-testid="modal-image-preview">
            <div className="max-w-4xl max-h-[80vh] p-4">
              <img src={selectedImage} alt="Maintenance issue" className="max-w-full max-h-full object-contain border border-zinc-700" loading="lazy" />
              <p className="text-zinc-500 text-center mt-4 text-sm">{t('maint_click_close')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
