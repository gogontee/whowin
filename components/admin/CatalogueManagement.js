// components/admin/CatalogueManagement.js
import { useEffect, useState } from "react";
import { supabase } from '../../lib/supabase';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Upload,
  Loader2,
  Save,
} from "lucide-react";

const BUCKET = "who_win_media";

export default function CatalogueManagement() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("catalogue")
      .select("*")
      .order("category", { ascending: true })
      .order("display_order", { ascending: true });
    if (error) setError(error.message);
    else setItems(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (item) => {
    if (!confirm(`Delete this item? "${item.caption || item.category}"`)) return;
    const { error } = await supabase.from("catalogue").delete().eq("id", item.id);
    if (error) {
      alert("Delete failed: " + error.message);
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== item.id));
  };

  return (
    <div className="space-y-5 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Catalogue</h2>
          <p className="text-xs text-white/60">
            Manage gallery images and videos by category.
          </p>
        </div>
        <button
          onClick={() => setEditing("new")}
          className="inline-flex items-center gap-2 bg-amber-500 text-black text-sm font-medium px-3 py-2 rounded-lg hover:bg-amber-400 transition"
        >
          <Plus size={16} />
          Add item
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-amber-500" />
        </div>
      ) : error ? (
        <div className="text-red-400 text-sm">{error}</div>
      ) : items.length === 0 ? (
        <div className="text-white/50 text-sm text-center py-10">
          No catalogue items yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="relative rounded-lg overflow-hidden border border-white/10 bg-white/5 group"
            >
              <div className="aspect-square">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.caption || item.category || ""}
                    className="w-full h-full object-cover"
                  />
                ) : item.video_url ? (
                  <div className="w-full h-full flex items-center justify-center text-white/40 text-xs">
                    Video
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/40 text-xs">
                    Empty
                  </div>
                )}
              </div>
              <span className="absolute top-2 left-2 text-[10px] text-white bg-black/70 px-2 py-0.5 rounded-full border border-white/10">
                {item.category}
              </span>
              <div className="p-2">
                <p className="text-xs text-white/80 line-clamp-2">
                  {item.caption || "—"}
                </p>
              </div>
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={() => setEditing(item)}
                  className="w-7 h-7 rounded-md bg-black/80 border border-white/20 text-white flex items-center justify-center hover:bg-amber-500 hover:text-black"
                  title="Edit"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => handleDelete(item)}
                  className="w-7 h-7 rounded-md bg-black/80 border border-white/20 text-white flex items-center justify-center hover:bg-red-500 hover:text-white"
                  title="Delete"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <CatalogueForm
          initial={editing === "new" ? null : editing}
          saving={saving}
          onCancel={() => setEditing(null)}
          onSave={async (payload) => {
            setSaving(true);
            try {
              if (editing === "new") {
                const { data, error } = await supabase
                  .from("catalogue")
                  .insert(payload)
                  .select()
                  .single();
                if (error) throw error;
                setItems((prev) => [...prev, data]);
              } else {
                const { data, error } = await supabase
                  .from("catalogue")
                  .update(payload)
                  .eq("id", editing.id)
                  .select()
                  .single();
                if (error) throw error;
                setItems((prev) =>
                  prev.map((i) => (i.id === editing.id ? data : i))
                );
              }
              setEditing(null);
            } catch (e) {
              alert("Save failed: " + e.message);
            } finally {
              setSaving(false);
            }
          }}
        />
      )}
    </div>
  );
}

function CatalogueForm({ initial, onCancel, onSave, saving }) {
  const [category, setCategory] = useState(initial?.category || "");
  const [caption, setCaption] = useState(initial?.caption || "");
  const [imageUrl, setImageUrl] = useState(initial?.image_url || "");
  const [videoUrl, setVideoUrl] = useState(initial?.video_url || "");
  const [displayOrder, setDisplayOrder] = useState(initial?.display_order ?? 0);
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (file, kind) => {
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${kind}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      if (kind === "image") setImageUrl(data.publicUrl);
      else setVideoUrl(data.publicUrl);
    } catch (e) {
      alert("Upload failed: " + e.message);
    } finally {
      setUploading(false);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    if (!category.trim()) return alert("Category is required.");
    if (!imageUrl && !videoUrl)
      return alert("Provide at least an image or a video.");
    onSave({
      category: category.trim(),
      caption: caption.trim() || null,
      image_url: imageUrl || null,
      video_url: videoUrl || null,
      display_order: Number(displayOrder) || 0,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <form
        onSubmit={submit}
        className="bg-zinc-900 text-white border border-white/10 rounded-xl w-full max-w-lg p-5 space-y-4 my-8"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white">
            {initial ? "Edit item" : "New catalogue item"}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="text-white/60 hover:text-white"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div>
          <label className="text-xs text-white/70">Category *</label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Live Shows, Studio, Behind the Scenes"
            className="w-full mt-1 bg-black/60 text-white placeholder:text-white/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs text-white/70">Caption</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={2}
            placeholder="A short description"
            className="w-full mt-1 bg-black/60 text-white placeholder:text-white/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:outline-none resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-white/70">Image</label>
            <div className="mt-1 flex gap-2">
              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Image URL"
                className="flex-1 min-w-0 bg-black/60 text-white placeholder:text-white/40 border border-white/10 rounded-lg px-3 py-2 text-xs focus:border-amber-500 focus:outline-none"
              />
              <label
                className="cursor-pointer inline-flex items-center justify-center w-9 h-9 shrink-0 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10"
                title="Upload image"
              >
                <Upload size={14} />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => uploadFile(e.target.files?.[0], "image")}
                />
              </label>
            </div>
            {imageUrl && (
              <img
                src={imageUrl}
                alt=""
                className="mt-2 w-full h-24 object-cover rounded-lg border border-white/10"
              />
            )}
          </div>

          <div>
            <label className="text-xs text-white/70">Video</label>
            <div className="mt-1 flex gap-2">
              <input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="YouTube / Vimeo / .mp4 URL"
                className="flex-1 min-w-0 bg-black/60 text-white placeholder:text-white/40 border border-white/10 rounded-lg px-3 py-2 text-xs focus:border-amber-500 focus:outline-none"
              />
              <label
                className="cursor-pointer inline-flex items-center justify-center w-9 h-9 shrink-0 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10"
                title="Upload video"
              >
                <Upload size={14} />
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => uploadFile(e.target.files?.[0], "video")}
                />
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs text-white/70">Display order</label>
          <input
            type="number"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(e.target.value)}
            className="w-full mt-1 bg-black/60 text-white placeholder:text-white/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-white rounded-lg border border-white/10 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || uploading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-amber-500 text-black font-medium hover:bg-amber-400 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}