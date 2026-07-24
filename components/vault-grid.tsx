"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { exifTakenAtLocal } from "@/lib/exif";
import { localToUtc, formatDay, formatTime } from "@/lib/time";
import { CDMX_TZ } from "@/lib/geocode";
import { updateAttachment } from "@/app/(tabs)/vault/actions";
import type { Attachment, Item } from "@/lib/types";

export type VaultEntry = Attachment & { url: string | null };

type ItemRef = Pick<Item, "id" | "display_id" | "title">;

interface Props {
  entries: VaultEntry[];
  tripId: string;
  items: ItemRef[];
}

export default function VaultGrid({ entries, tripId, items }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const open = entries.find((e) => e.id === openId) ?? null;

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    try {
      for (const file of Array.from(files)) {
        let takenAt: string | null = null;
        if (file.type === "image/jpeg") {
          takenAt = exifTakenAtLocal(await file.arrayBuffer());
        }

        const path = `${user.id}/${crypto.randomUUID()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
        const { error: upErr } = await supabase.storage
          .from("vault")
          .upload(path, file, { contentType: file.type });
        if (upErr) throw new Error(upErr.message);

        const { error: insErr } = await supabase.from("attachments").insert({
          user_id: user.id,
          trip_id: tripId,
          storage_path: path,
          mime: file.type || "application/octet-stream",
          bytes: file.size,
          taken_at: takenAt ? localToUtc(takenAt, CDMX_TZ) : null,
        });
        if (insErr) throw new Error(insErr.message);
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <main className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Vault</h1>
        <label className="radius-token shadow-hard cursor-pointer bg-accent px-3 py-1.5 text-sm font-semibold text-white">
          {uploading ? "Uploading…" : "Add"}
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            multiple
            className="hidden"
            disabled={uploading}
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
      </div>

      {error && <p className="text-sm text-accent">{error}</p>}

      {entries.length === 0 ? (
        <p className="text-ink/60">
          Photos and documents you add stay private to this trip.
        </p>
      ) : (
        <ul className="grid grid-cols-3 gap-2">
          {entries.map((entry) => (
            <li key={entry.id}>
              <button
                onClick={() => setOpenId(entry.id)}
                className="radius-token block aspect-square w-full overflow-hidden border border-ink/10 bg-white"
              >
                {entry.url && entry.mime.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={entry.url}
                    alt={entry.caption ?? ""}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center p-1 text-center text-[10px] text-ink/50">
                    {entry.storage_path.split("/").pop()?.slice(37)}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-ink/60"
          onClick={() => setOpenId(null)}
        >
          <div
            className="max-h-[85dvh] w-full overflow-y-auto bg-paper p-5 pb-10"
            onClick={(e) => e.stopPropagation()}
          >
            {open.url && open.mime.startsWith("image/") && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={open.url}
                alt={open.caption ?? ""}
                className="radius-token max-h-[45dvh] w-full object-contain"
              />
            )}
            <div className="tnum mt-3 text-xs text-ink/60">
              {open.taken_at && (
                <p>
                  Taken {formatDay(open.taken_at, CDMX_TZ)},{" "}
                  {formatTime(open.taken_at, CDMX_TZ)}
                </p>
              )}
              <p>
                Uploaded {formatDay(open.uploaded_at, CDMX_TZ)},{" "}
                {formatTime(open.uploaded_at, CDMX_TZ)}
              </p>
            </div>

            <form
              action={(formData) =>
                startTransition(async () => {
                  await updateAttachment(formData);
                  router.refresh();
                })
              }
              className="mt-3 flex flex-col gap-2"
            >
              <input type="hidden" name="id" value={open.id} />
              <input
                name="caption"
                defaultValue={open.caption ?? ""}
                placeholder="Caption"
                className="radius-token border border-ink/20 bg-white px-3 py-2 text-sm"
              />
              <select
                name="item_id"
                defaultValue={open.item_id ?? ""}
                className="radius-token border border-ink/20 bg-white px-3 py-2 text-sm"
              >
                <option value="">Not linked to an item</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.display_id} · {item.title}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-3">
                <button
                  disabled={pending}
                  className="radius-token bg-ink px-3 py-1.5 text-sm font-semibold text-paper disabled:opacity-60"
                >
                  Save
                </button>
                {open.url && (
                  <a
                    href={open.url}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm underline underline-offset-2"
                  >
                    Download original
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setOpenId(null)}
                  className="ml-auto text-sm text-ink/60"
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
