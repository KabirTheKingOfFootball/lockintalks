"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Eye, EyeOff, ImagePlus, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import type { AdminCompetition } from "@/lib/admin/competitions";
import { getReadableError, readJsonResponse } from "@/lib/readable-error";

const emptyForm = {
  id: "",
  name: "",
  slug: "",
  category: "",
  age_group: "",
  event_date: "",
  fee_label: "",
  fee_amount: 0,
  summary: "",
  description: "",
  image_url: "",
  status: "draft",
  rules: "",
  schedule: "",
  prizes: "",
  judges: ""
};

export function CompetitionManager({ initialCompetitions }: { initialCompetitions: AdminCompetition[] }) {
  const [competitions, setCompetitions] = useState(initialCompetitions);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<AdminCompetition | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const editing = Boolean(form.id);

  const sortedCompetitions = useMemo(() => competitions.slice().sort((a, b) => a.name.localeCompare(b.name)), [competitions]);

  function editCompetition(competition: AdminCompetition) {
    setForm({
      id: competition.id,
      name: competition.name,
      slug: competition.slug,
      category: competition.category,
      age_group: competition.age_group,
      event_date: competition.event_date,
      fee_label: competition.fee_label,
      fee_amount: competition.fee_amount,
      summary: competition.summary,
      description: competition.description,
      image_url: competition.image_url || "",
      status: competition.status,
      rules: competition.rules.join("\n"),
      schedule: competition.schedule.join("\n"),
      prizes: competition.prizes.join("\n"),
      judges: competition.judges.join("\n")
    });
  }

  async function saveCompetition(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(editing ? `/api/admin/competitions/${encodeURIComponent(form.id)}` : "/api/admin/competitions", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const result = await readJsonResponse<{ error?: string; competition?: AdminCompetition }>(response);

      if (!response.ok || !result.competition) throw new Error(result.error || "Could not save competition.");

      const saved = result.competition;
      setCompetitions((current) => (editing ? current.map((item) => (item.id === saved.id ? saved : item)) : [saved, ...current]));
      setForm(emptyForm);
      setMessage(editing ? "Competition updated." : "Competition created.");
    } catch (saveError) {
      console.error("[LockInTalks admin UI] Competition save failed:", saveError);
      setError(getReadableError(saveError, "Could not save competition."));
    } finally {
      setBusy(false);
    }
  }

  async function deleteCompetition(competition: AdminCompetition) {
    if (deleteConfirm !== competition.name) return;
    setBusy(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/competitions/${encodeURIComponent(competition.id)}`, { method: "DELETE" });
      const result = await readJsonResponse<{ error?: string }>(response);
      if (!response.ok) throw new Error(result.error || "Could not delete competition.");
      setCompetitions((current) => current.filter((item) => item.id !== competition.id));
      setPendingDelete(null);
      setDeleteConfirm("");
      setMessage("Competition deleted.");
    } catch (deleteError) {
      console.error("[LockInTalks admin UI] Competition delete failed:", deleteError);
      setError(getReadableError(deleteError, "Could not delete competition."));
    } finally {
      setBusy(false);
    }
  }

  async function updateStatus(competition: AdminCompetition, status: "draft" | "live" | "closed") {
    const body = {
      ...competition,
      status,
      rules: competition.rules.join("\n"),
      schedule: competition.schedule.join("\n"),
      prizes: competition.prizes.join("\n"),
      judges: competition.judges.join("\n")
    };
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/competitions/${encodeURIComponent(competition.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const result = await readJsonResponse<{ error?: string; competition?: AdminCompetition }>(response);
      if (!response.ok || !result.competition) throw new Error(result.error || "Could not update status.");
      const updatedCompetition = result.competition;
      setCompetitions((current) => current.map((item) => (item.id === competition.id ? updatedCompetition : item)));
      setMessage(`Competition ${status === "live" ? "published" : status === "draft" ? "unpublished" : "closed"}.`);
    } catch (statusError) {
      console.error("[LockInTalks admin UI] Competition status update failed:", statusError);
      setError(getReadableError(statusError, "Could not update status."));
    } finally {
      setBusy(false);
    }
  }

  async function uploadImage(id: string, file: File) {
    setBusy(true);
    setError("");
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch(`/api/admin/competitions/${encodeURIComponent(id)}/image`, { method: "POST", body: formData });
      const result = await readJsonResponse<{ error?: string; imageUrl?: string }>(response);
      if (!response.ok || !result.imageUrl) throw new Error(result.error || "Could not upload image.");
      const imageUrl = result.imageUrl;
      setCompetitions((current) => current.map((item) => (item.id === id ? { ...item, image_url: imageUrl } : item)));
      setMessage("Image uploaded.");
    } catch (uploadError) {
      console.error("[LockInTalks admin UI] Image upload failed:", uploadError);
      setError(getReadableError(uploadError, "Could not upload image."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <form onSubmit={saveCompetition} className="glass rounded-[8px] p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-black">{editing ? "Edit Competition" : "Create Competition"}</h2>
          <Button type="button" variant="glass" onClick={() => setForm(emptyForm)}>Reset</Button>
        </div>
        <div className="grid gap-4">
          <Input placeholder="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          <Input placeholder="Slug" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input placeholder="Category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} />
            <Input placeholder="Age group" value={form.age_group} onChange={(event) => setForm({ ...form, age_group: event.target.value })} />
            <Input placeholder="Date" value={form.event_date} onChange={(event) => setForm({ ...form, event_date: event.target.value })} />
            <Input placeholder="Fee label, e.g. INR 499" value={form.fee_label} onChange={(event) => setForm({ ...form, fee_label: event.target.value })} />
            <Input placeholder="Fee amount in paise" type="number" value={form.fee_amount} onChange={(event) => setForm({ ...form, fee_amount: Number(event.target.value) })} />
            <select className="focus-ring min-h-12 rounded-[8px] border border-white/15 bg-[#071b3b] px-4 text-sm text-white" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
              <option value="draft">Draft</option>
              <option value="live">Live</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <Input placeholder="Image URL" value={form.image_url} onChange={(event) => setForm({ ...form, image_url: event.target.value })} />
          <Textarea placeholder="Summary" value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} />
          <Textarea placeholder="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          <Textarea placeholder="Rules, one per line" value={form.rules} onChange={(event) => setForm({ ...form, rules: event.target.value })} />
          <Textarea placeholder="Schedule, one per line" value={form.schedule} onChange={(event) => setForm({ ...form, schedule: event.target.value })} />
          <Textarea placeholder="Prizes, one per line" value={form.prizes} onChange={(event) => setForm({ ...form, prizes: event.target.value })} />
          <Textarea placeholder="Judges, one per line" value={form.judges} onChange={(event) => setForm({ ...form, judges: event.target.value })} />
        </div>
        {error && <p className="mt-4 rounded-[8px] border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</p>}
        {message && <p className="mt-4 rounded-[8px] border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">{message}</p>}
        <Button type="submit" className="mt-5 w-full gap-2" disabled={busy}>
          {busy ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
          {editing ? "Save Changes" : "Create Competition"}
        </Button>
      </form>

      <div className="grid gap-4">
        {sortedCompetitions.map((competition) => (
          <article key={competition.id} className="glass rounded-[8px] p-5">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative h-28 w-full overflow-hidden rounded-[8px] border border-white/10 bg-white/5 sm:w-40">
                {competition.image_url ? (
                  <Image src={competition.image_url} alt="" fill sizes="160px" className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-[#d4af37]"><ImagePlus /></div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-black">{competition.name}</h3>
                  <span className="rounded-full border border-[#d4af37]/30 px-3 py-1 text-xs font-bold uppercase text-[#d4af37]">{competition.status}</span>
                </div>
                <p className="mt-2 text-sm text-white/58">{competition.category} • {competition.age_group} • {competition.fee_label}</p>
                <p className="mt-2 text-sm leading-6 text-white/65">{competition.summary}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button type="button" variant="glass" className="gap-2" onClick={() => editCompetition(competition)}><Pencil size={16} /> Edit</Button>
                  <Button type="button" variant="glass" className="gap-2" onClick={() => updateStatus(competition, competition.status === "live" ? "draft" : "live")}>
                    {competition.status === "live" ? <EyeOff size={16} /> : <Eye size={16} />}
                    {competition.status === "live" ? "Unpublish" : "Publish"}
                  </Button>
                  <Button type="button" variant="glass" className="gap-2" onClick={() => updateStatus(competition, "closed")}>Close</Button>
                  <Button type="button" variant="glass" className="gap-2" onClick={() => setPendingDelete(competition)}><Trash2 size={16} /> Delete</Button>
                  <label className="focus-ring inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-bold text-white/80 hover:border-[#d4af37]/50">
                    <ImagePlus size={16} /> Upload Image
                    <input type="file" accept="image/*" className="hidden" onChange={(event) => event.target.files?.[0] && uploadImage(competition.id, event.target.files[0])} />
                  </label>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
      {pendingDelete && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4">
          <div className="glass w-full max-w-md rounded-[8px] p-6">
            <h2 className="text-2xl font-black">Delete competition?</h2>
            <p className="mt-3 text-sm leading-6 text-white/65">
              This cannot be undone. Type <span className="font-bold text-white">{pendingDelete.name}</span> to confirm.
            </p>
            <Input className="mt-5" value={deleteConfirm} onChange={(event) => setDeleteConfirm(event.target.value)} placeholder={pendingDelete.name} />
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button type="button" variant="glass" className="flex-1" onClick={() => { setPendingDelete(null); setDeleteConfirm(""); }}>Cancel</Button>
              <Button type="button" className="flex-1" disabled={deleteConfirm !== pendingDelete.name || busy} onClick={() => deleteCompetition(pendingDelete)}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
