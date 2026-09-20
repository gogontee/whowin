// components/admin/ContentScrollManagement.js
'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Upload,
  Loader2,
  Save,
  Image as ImageIcon,
  Video,
} from 'lucide-react';

const BUCKET = 'who_win_media';

export default function ContentScrollManagement() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null); // "new" or an item
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('content_scroll')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) setError(error.message);
    else setItems(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (item) => {
    if (!confirm(`Delete this item? "${item.caption || item.type}"`)) return;
    const { error } = await supabase
      .from('content_scroll')
      .delete()
      .eq('id', item.id);
    if (error) {
      alert('Delete failed: ' + error.message);
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== item.id));
  };

  return (
    <div className="space-y-5 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Content Scroll</h2>
          <p className="text-xs text-white/60">
            Manage the horizontally-scrolling image/video strip.
          </p>
        </div>
        <button
          onClick={() => setEditing('new')}
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
          No content yet. Click "Add item" to start.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="relative rounded-lg overflow-hidden border border-white/10 bg-white/5 group"
            >
              <div className="aspect-square">
                {item.type === 'video' ? (
                  <video
                    src={item.media_url}
                    muted
                    preload="metadata"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={item.media_url}
                    alt={item.caption || ''}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              <span className="absolute top-2 left-2 text-[10px] text-white bg-black/70 px-2 py-0.5 rounded-full border border-white/10 inline-flex items-center gap-1">
                {item.type === 'video' ? <Video size={10} /> : <ImageIcon size={10} />}
                {item.type}
              </span>

              {item.display_order !== 0 && (
                <span className="absolute top-2 right-2 text-[10px] text-white bg-black/70 px-2 py-0.5 rounded-full border border-white/10">
                  #{item.display_order}
                </span>
              )}

              <div className="p-2">
                <p className="text-xs text-white/80 line-clamp-2">
                  {item.caption || '—'}
                </p>
              </div>

              <div className="absolute top-8 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={() => setEditing(item)}
                  className="w-7 h-7 rounded-md bg-black/80 border border-white/20 text-white flex items-center justify-center hover:bg-amber-500 hover:text-black"
                  title="Edit"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => handleDelete(item)}
                  className="w-7 h-7 rounded-md bg-black/80 border border-white/20 text-white flex items-center justify-center hover:bg-red-500"
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
        <ContentScrollForm
          initial={editing === 'new' ? null : editing}
          saving={saving}
          onCancel={() => setEditing(null)}
          onSave={async (payload) => {
            setSaving(true);
            try {
              if (editing === 'new') {
                const { data, error } = await supabase
                  .from('content_scroll')
                  .insert(payload)
                  .select()
                  .single();
                if (error) throw error;
                setItems((prev) => [...prev, data]);
              } else {
                const { data, error } = await supabase
                  .from('content_scroll')
                  .update({ ...payload, updated_at: new Date().toISOString() })
                  .eq('id', editing.id)
                  .select()
                  .single();
                if (error) throw error;
                setItems((prev) =>
                  prev.map((i) => (i.id === editing.id ? data : i))
                );
              }
              setEditing(null);
            } catch (e) {
              alert('Save failed: ' + e.message);
            } finally {
              setSaving(false);
            }
          }}
        />
      )}
    </div>
  );
}

// ---------------- Form ----------------

function ContentScrollForm({ initial, onCancel, onSave, saving }) {
  const [type, setType] = useState(initial?.type || 'image');
  const [mediaUrl, setMediaUrl] = useState(initial?.media_url || '');
  const [caption, setCaption] = useState(initial?.caption || '');
  const [displayOrder, setDisplayOrder] = useState(initial?.display_order ?? 0);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const uploadFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const folder = type === 'video' ? 'videos' : 'images';
      const path = `${folder}/scroll-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { cacheControl: '3600', upsert: false });
      if (error) throw error;

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      setMediaUrl(data.publicUrl);

      // auto-detect type from file
      if (file.type.startsWith('video/')) setType('video');
      else if (file.type.startsWith('image/')) setType('image');
    } catch (e) {
      alert('Upload failed: ' + e.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const submit = (e) => {
    e.preventDefault();
    if (!mediaUrl.trim()) return alert('Please upload a file or paste a URL.');
    onSave({
      type,
      media_url: mediaUrl.trim(),
      caption: caption.trim() || null,
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
          <h3 className="font-semibold">
            {initial ? 'Edit item' : 'New content item'}
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
          <label className="text-xs text-white/70">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full mt-1 bg-black/60 text-white border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
          >
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-white/70">
            Upload {type === 'video' ? 'Video' : 'Image'}
          </label>
          <div className="mt-1 flex gap-2">
            <input
              ref={fileRef}
              type="file"
              accept={type === 'video' ? 'video/*' : 'image/*'}
              className="hidden"
              onChange={(e) => uploadFile(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 border border-white/10"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Choose file
                </>
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs text-white/70">Or paste media URL</label>
          <input
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            placeholder="https://..."
            className="w-full mt-1 bg-black/60 text-white placeholder:text-white/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
          />
        </div>

        {mediaUrl && (
          <div className="rounded-lg overflow-hidden border border-white/10 bg-black/40 aspect-video flex items-center justify-center">
            {type === 'video' ? (
              <video
                src={mediaUrl}
                controls
                className="w-full h-full object-contain"
              />
            ) : (
              <img
                src={mediaUrl}
                alt=""
                className="w-full h-full object-contain"
              />
            )}
          </div>
        )}

        <div>
          <label className="text-xs text-white/70">Caption</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={2}
            placeholder="Optional short description"
            className="w-full mt-1 bg-black/60 text-white placeholder:text-white/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:outline-none resize-none"
          />
        </div>

        <div>
          <label className="text-xs text-white/70">Display order</label>
          <input
            type="number"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(e.target.value)}
            className="w-full mt-1 bg-black/60 text-white border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
          />
          <p className="text-[10px] text-white/40 mt-1">
            Lower numbers appear first.
          </p>
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
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}