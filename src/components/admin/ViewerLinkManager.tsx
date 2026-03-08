import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link2, Copy, Trash2, ToggleLeft, ToggleRight, Plus, Eye, Clock, Hash, X } from 'lucide-react';
import { toast } from 'sonner';

interface ViewerLink {
  id: string;
  token: string;
  label: string;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
  last_accessed_at: string | null;
  access_count: number;
}

const ViewerLinkManager = () => {
  const [links, setLinks] = useState<ViewerLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [label, setLabel] = useState('');
  const [expiresIn, setExpiresIn] = useState<string>('never');
  const [creating, setCreating] = useState(false);

  const fetchLinks = async () => {
    const { data } = await supabase.rpc('list_viewer_links' as any);
    if (data) setLinks(data as ViewerLink[]);
    setLoading(false);
  };

  useEffect(() => { fetchLinks(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    setCreating(true);

    let expiresAt: string | null = null;
    if (expiresIn !== 'never') {
      const d = new Date();
      if (expiresIn === '24h') d.setHours(d.getHours() + 24);
      else if (expiresIn === '7d') d.setDate(d.getDate() + 7);
      else if (expiresIn === '30d') d.setDate(d.getDate() + 30);
      else if (expiresIn === '90d') d.setDate(d.getDate() + 90);
      expiresAt = d.toISOString();
    }

    const { data: token, error } = await supabase.rpc('create_viewer_link' as any, {
      link_label: label.trim(),
      link_expires_at: expiresAt,
    });

    if (error) {
      toast.error(error.message);
    } else {
      const link = `${window.location.origin}/admin?viewer=${token}`;
      await navigator.clipboard.writeText(link);
      toast.success('Viewer link created and copied to clipboard!');
      setLabel('');
      setExpiresIn('never');
      setShowCreate(false);
      fetchLinks();
    }
    setCreating(false);
  };

  const handleCopy = async (token: string) => {
    const link = `${window.location.origin}/admin?viewer=${token}`;
    await navigator.clipboard.writeText(link);
    toast.success('Link copied!');
  };

  const handleToggle = async (vl: ViewerLink) => {
    if (vl.is_active) {
      const { error } = await supabase.rpc('revoke_viewer_link' as any, { link_id: vl.id });
      if (error) toast.error(error.message);
      else { toast.success('Link revoked'); fetchLinks(); }
    } else {
      const { error } = await supabase.rpc('reactivate_viewer_link' as any, { link_id: vl.id });
      if (error) toast.error(error.message);
      else { toast.success('Link reactivated'); fetchLinks(); }
    }
  };

  const handleDelete = async (vl: ViewerLink) => {
    if (!confirm(`Permanently delete "${vl.label}"? This cannot be undone.`)) return;
    const { error } = await supabase.rpc('delete_viewer_link' as any, { link_id: vl.id });
    if (error) toast.error(error.message);
    else { toast.success('Link deleted'); fetchLinks(); }
  };

  const isExpired = (vl: ViewerLink) => vl.expires_at && new Date(vl.expires_at) < new Date();

  return (
    <div className="bg-surface rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Link2 className="w-5 h-5 text-primary" />
          <h2 className="font-heading font-bold text-lg text-foreground">Viewer Links</h2>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-primary text-primary-foreground font-body text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 inline-flex items-center gap-2"
        >
          {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showCreate ? 'Cancel' : 'New Link'}
        </button>
      </div>

      <p className="font-body text-xs text-muted mb-4">
        Generate passwordless read-only links for investors, consultants, or partners. They can view dashboard data without logging in.
      </p>

      {/* Create form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="bg-background rounded-lg border border-border p-4 mb-4 space-y-3">
          <input
            type="text"
            placeholder='Label (e.g. "Investor Q1 Review")'
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            required
            maxLength={100}
            className="w-full font-body border border-border rounded-lg px-3 py-2 text-sm bg-surface text-foreground"
          />
          <div className="flex items-center gap-3">
            <label className="font-body text-sm text-muted">Expires:</label>
            <select
              value={expiresIn}
              onChange={(e) => setExpiresIn(e.target.value)}
              className="font-body border border-border rounded-lg px-3 py-2 text-sm bg-surface text-foreground"
            >
              <option value="never">Never</option>
              <option value="24h">24 hours</option>
              <option value="7d">7 days</option>
              <option value="30d">30 days</option>
              <option value="90d">90 days</option>
            </select>
            <button
              type="submit"
              disabled={creating}
              className="ml-auto bg-primary text-primary-foreground font-body text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create & Copy Link'}
            </button>
          </div>
        </form>
      )}

      {/* Links list */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => <div key={i} className="h-16 animate-pulse bg-background rounded-lg" />)}
        </div>
      ) : links.length === 0 ? (
        <div className="text-center py-8">
          <Link2 className="w-8 h-8 text-muted mx-auto mb-2" />
          <p className="font-body text-sm text-muted">No viewer links created yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {links.map((vl) => {
            const expired = isExpired(vl);
            const active = vl.is_active && !expired;
            return (
              <div
                key={vl.id}
                className={`bg-background rounded-lg border p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 transition-opacity ${
                  active ? 'border-border' : 'border-border/50 opacity-60'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-body text-sm font-medium text-foreground truncate">{vl.label}</p>
                    {active && (
                      <span className="font-body text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Active</span>
                    )}
                    {!vl.is_active && (
                      <span className="font-body text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">Revoked</span>
                    )}
                    {expired && vl.is_active && (
                      <span className="font-body text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Expired</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="font-body text-xs text-muted inline-flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {vl.access_count} views
                    </span>
                    {vl.last_accessed_at && (
                      <span className="font-body text-xs text-muted inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Last: {new Date(vl.last_accessed_at).toLocaleString()}
                      </span>
                    )}
                    {vl.expires_at && (
                      <span className="font-body text-xs text-muted inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {expired ? 'Expired' : `Expires: ${new Date(vl.expires_at).toLocaleDateString()}`}
                      </span>
                    )}
                    <span className="font-body text-xs text-muted font-mono inline-flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      {vl.token.slice(0, 8)}...
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {active && (
                    <button
                      onClick={() => handleCopy(vl.token)}
                      className="text-muted hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-primary/5"
                      title="Copy link"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleToggle(vl)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      vl.is_active
                        ? 'text-green-600 hover:bg-red-50 hover:text-red-600'
                        : 'text-muted hover:bg-green-50 hover:text-green-600'
                    }`}
                    title={vl.is_active ? 'Revoke' : 'Reactivate'}
                  >
                    {vl.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => handleDelete(vl)}
                    className="text-muted hover:text-destructive transition-colors p-1.5 rounded-lg hover:bg-destructive/5"
                    title="Delete permanently"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ViewerLinkManager;
