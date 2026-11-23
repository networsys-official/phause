export type PageMenuDraft = {
  showInHeader: boolean;
  headerLabel: string;
  headerPosition: number;
  showInFooter: boolean;
  footerGroup: "QUICK_LINKS" | "SERVICES" | "LEGAL";
  footerLabel: string;
  footerPosition: number;
};



export function PageMenuFields({
  page,
  draft,
  setDraft,
  markChanged,
}: {
  page: { title: string; status: string };
  draft: PageMenuDraft;
  setDraft: (updater: (current: PageMenuDraft) => PageMenuDraft) => void;
  markChanged: () => void;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
      <h2 className="text-xl font-bold text-white">Where should this page appear?</h2>
      <p className="mt-1 text-sm text-slate-400">Choose where this published page appears.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
          <label className="flex items-center gap-3 text-sm text-slate-200">
            <input type="checkbox" checked={draft.showInHeader} onChange={(event) => { setDraft((current) => ({ ...current, showInHeader: event.target.checked })); markChanged(); }} />
            Show in top menu
          </label>
          {draft.showInHeader ? (
            <div className="mt-3 grid gap-3">
              <input aria-label="Top menu label" value={draft.headerLabel} onChange={(event) => { setDraft((current) => ({ ...current, headerLabel: event.target.value })); markChanged(); }} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" placeholder="Menu label" />
              <input aria-label="Top menu order" type="number" min={0} value={draft.headerPosition} onChange={(event) => { setDraft((current) => ({ ...current, headerPosition: Number(event.target.value) })); markChanged(); }} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" />
              <p className="text-xs text-cyan-200">Preview: {draft.headerLabel || page.title}</p>
            </div>
          ) : null}
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
          <label className="flex items-center gap-3 text-sm text-slate-200">
            <input type="checkbox" checked={draft.showInFooter} onChange={(event) => { setDraft((current) => ({ ...current, showInFooter: event.target.checked })); markChanged(); }} />
            Show in footer
          </label>
          {draft.showInFooter ? (
            <div className="mt-3 grid gap-3">
              <input aria-label="Footer label" value={draft.footerLabel} onChange={(event) => { setDraft((current) => ({ ...current, footerLabel: event.target.value })); markChanged(); }} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" placeholder="Footer label" />
              <select aria-label="Footer group" value={draft.footerGroup} onChange={(event) => { setDraft((current) => ({ ...current, footerGroup: event.target.value as PageMenuDraft["footerGroup"] })); markChanged(); }} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white">
                <option value="QUICK_LINKS">Quick Links</option>
                <option value="SERVICES">Services</option>
                <option value="LEGAL">Legal</option>
              </select>
              <input aria-label="Footer order" type="number" min={0} value={draft.footerPosition} onChange={(event) => { setDraft((current) => ({ ...current, footerPosition: Number(event.target.value) })); markChanged(); }} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" />
            </div>
          ) : null}
        </div>
      </div>
      {page.status === "DRAFT" ? <p className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">Draft pages are hidden from menus until published.</p> : null}
    </div>
  );
}
