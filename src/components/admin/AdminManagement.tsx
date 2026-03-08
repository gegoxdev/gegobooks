import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus, Trash2, ChevronDown, Shield, ShieldCheck, ShieldAlert, Eye, Mail, Copy, Check, X, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface AdminUser {
  admin_id: string;
  user_id: string;
  email: string;
  role: string;
  created_at: string;
}

interface AdminInvite {
  id: string;
  email: string;
  role: string;
  invited_by_email: string;
  status: string;
  created_at: string;
  expires_at: string;
  token: string;
}

const roleConfig: Record<string, { label: string; icon: typeof Shield; color: string; rank: number }> = {
  readonly: { label: 'Read Only', icon: Eye, color: 'bg-muted/20 text-muted', rank: 0 },
  approver: { label: 'Approver', icon: Shield, color: 'bg-secondary/20 text-secondary-foreground', rank: 1 },
  admin: { label: 'Admin', icon: ShieldCheck, color: 'bg-primary/10 text-primary', rank: 2 },
  master: { label: 'Master', icon: ShieldAlert, color: 'bg-accent/10 text-accent', rank: 3 },
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-green-100 text-green-800',
  revoked: 'bg-red-100 text-red-800',
  expired: 'bg-muted/20 text-muted',
};

const AdminManagement = ({ currentRole }: { currentRole: string }) => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [invites, setInvites] = useState<AdminInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [invitesLoading, setInvitesLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'admins' | 'invites'>('admins');

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('readonly');
  const [sending, setSending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Direct add form (master only)
  const [directEmail, setDirectEmail] = useState('');
  const [directRole, setDirectRole] = useState('readonly');
  const [adding, setAdding] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const isMaster = currentRole === 'master';
  const canInvite = currentRole === 'master' || currentRole === 'approver';

  const fetchAdmins = async () => {
    const { data } = await supabase.rpc('admin_list_admins' as any);
    if (data) setAdmins(data as AdminUser[]);
    setLoading(false);
  };

  const fetchInvites = async () => {
    const { data } = await supabase.rpc('list_admin_invites' as any);
    if (data) setInvites(data as AdminInvite[]);
    setInvitesLoading(false);
  };

  useEffect(() => {
    fetchAdmins();
    if (canInvite) fetchInvites();
  }, []);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setSending(true);

    const { data: token, error: inviteError } = await supabase.rpc('create_admin_invite' as any, {
      target_email: inviteEmail.trim(),
      invite_role: inviteRole,
    });

    if (inviteError) {
      toast.error(inviteError.message);
    } else {
      const inviteLink = `${window.location.origin}/admin?invite=${token}`;
      await navigator.clipboard.writeText(inviteLink);
      toast.success('Invite created & link copied to clipboard!');
      setInviteEmail('');
      setInviteRole('readonly');
      fetchInvites();
    }
    setSending(false);
  };

  const handleCopyLink = async (link: string) => {
    await navigator.clipboard.writeText(link);
    toast.success('Invite link copied!');
    setCopiedLink(null);
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!confirm('Revoke this invite?')) return;
    const { error } = await supabase.rpc('revoke_admin_invite' as any, { invite_id: inviteId });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Invite revoked');
      fetchInvites();
    }
  };

  const handleDirectAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directEmail.trim()) return;
    setAdding(true);
    const { error } = await supabase.rpc('admin_add_admin' as any, {
      target_email: directEmail.trim(),
      admin_role: directRole,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Added ${directEmail.trim()} as ${roleConfig[directRole].label}`);
      setDirectEmail('');
      setDirectRole('readonly');
      fetchAdmins();
    }
    setAdding(false);
  };

  const handleRemove = async (admin: AdminUser) => {
    if (!confirm(`Remove admin access for ${admin.email}?`)) return;
    setRemovingId(admin.user_id);
    const { error } = await supabase.rpc('admin_remove_admin' as any, { target_user_id: admin.user_id });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Removed ${admin.email}`);
      fetchAdmins();
    }
    setRemovingId(null);
  };

  const handleRoleChange = async (admin: AdminUser, newRole: string) => {
    if (newRole === admin.role) { setEditingId(null); return; }
    const { error } = await supabase.rpc('admin_add_admin' as any, {
      target_email: admin.email,
      admin_role: newRole,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Updated ${admin.email} to ${roleConfig[newRole].label}`);
      fetchAdmins();
    }
    setEditingId(null);
  };

  // Roles available for invite (approvers can't invite higher than themselves)
  const availableInviteRoles = Object.entries(roleConfig).filter(([key]) => {
    if (isMaster) return true;
    return roleConfig[key].rank <= roleConfig[currentRole].rank;
  });

  return (
    <div className="bg-surface rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading font-bold text-lg text-foreground">Admin Management</h2>
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => setActiveTab('admins')}
            className={`font-body text-xs px-3 py-2 transition-colors ${
              activeTab === 'admins' ? 'bg-primary text-primary-foreground font-semibold' : 'bg-surface text-muted hover:bg-muted/10'
            }`}
          >
            Admins ({admins.length})
          </button>
          {canInvite && (
            <button
              onClick={() => setActiveTab('invites')}
              className={`font-body text-xs px-3 py-2 transition-colors ${
                activeTab === 'invites' ? 'bg-primary text-primary-foreground font-semibold' : 'bg-surface text-muted hover:bg-muted/10'
              }`}
            >
              Invites ({invites.filter(i => i.status === 'pending').length} pending)
            </button>
          )}
        </div>
      </div>

      {activeTab === 'admins' && (
        <>
          {/* Direct add - master only */}
          {isMaster && (
            <form onSubmit={handleDirectAdd} className="flex flex-col sm:flex-row gap-3 mb-4">
              <input
                type="email"
                placeholder="Add admin by email (must have account)..."
                value={directEmail}
                onChange={(e) => setDirectEmail(e.target.value)}
                required
                className="font-body border border-border rounded-lg px-3 py-2 text-sm bg-surface text-foreground flex-1"
              />
              <select
                value={directRole}
                onChange={(e) => setDirectRole(e.target.value)}
                className="font-body border border-border rounded-lg px-3 py-2 text-sm bg-surface text-foreground"
              >
                {Object.entries(roleConfig).map(([key, rc]) => (
                  <option key={key} value={key}>{rc.label}</option>
                ))}
              </select>
              <button
                type="submit"
                disabled={adding}
                className="bg-primary text-primary-foreground font-body text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-2 whitespace-nowrap"
              >
                <UserPlus className="w-4 h-4" />
                {adding ? 'Adding...' : 'Add Direct'}
              </button>
            </form>
          )}

          {/* Admin list */}
          {loading ? (
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => <div key={i} className="h-10 animate-pulse bg-background rounded" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border">
                    <th className="font-body text-xs font-semibold text-muted py-3 px-2">Email</th>
                    <th className="font-body text-xs font-semibold text-muted py-3 px-2">Role</th>
                    <th className="font-body text-xs font-semibold text-muted py-3 px-2">Added</th>
                    {isMaster && <th className="font-body text-xs font-semibold text-muted py-3 px-2"></th>}
                  </tr>
                </thead>
                <tbody>
                  {admins.map((a) => {
                    const config = roleConfig[a.role] || roleConfig.readonly;
                    const RoleIcon = config.icon;
                    return (
                      <tr key={a.admin_id} className="border-b border-border/50 hover:bg-soft-white transition-colors">
                        <td className="font-body text-sm text-foreground py-3 px-2">{a.email}</td>
                        <td className="py-3 px-2 relative">
                          {isMaster ? (
                            <>
                              <button
                                onClick={() => setEditingId(editingId === a.user_id ? null : a.user_id)}
                                className={`font-body text-xs px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity ${config.color}`}
                              >
                                <RoleIcon className="w-3 h-3" />
                                {config.label}
                                <ChevronDown className="w-3 h-3" />
                              </button>
                              {editingId === a.user_id && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={() => setEditingId(null)} />
                                  <div className="absolute z-50 top-full left-0 mt-1 bg-surface border border-border rounded-lg shadow-lg py-1 min-w-[120px]">
                                    {Object.entries(roleConfig).map(([key, rc]) => (
                                      <button
                                        key={key}
                                        onClick={() => handleRoleChange(a, key)}
                                        className={`block w-full text-left font-body text-xs px-3 py-1.5 hover:bg-muted/10 transition-colors ${
                                          key === a.role ? 'font-bold text-foreground' : 'text-muted'
                                        }`}
                                      >
                                        {rc.label}
                                      </button>
                                    ))}
                                  </div>
                                </>
                              )}
                            </>
                          ) : (
                            <span className={`font-body text-xs px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1 ${config.color}`}>
                              <RoleIcon className="w-3 h-3" />
                              {config.label}
                            </span>
                          )}
                        </td>
                        <td className="font-body text-xs text-muted py-3 px-2">
                          {new Date(a.created_at).toLocaleDateString()}
                        </td>
                        {isMaster && (
                          <td className="py-3 px-2">
                            <button
                              onClick={() => handleRemove(a)}
                              disabled={removingId === a.user_id}
                              className="text-muted hover:text-destructive transition-colors disabled:opacity-50"
                              title="Remove admin"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {activeTab === 'invites' && canInvite && (
        <>
          {/* Send invite form */}
          <form onSubmit={handleSendInvite} className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              type="email"
              placeholder="Invite email address..."
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              className="font-body border border-border rounded-lg px-3 py-2 text-sm bg-surface text-foreground flex-1"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="font-body border border-border rounded-lg px-3 py-2 text-sm bg-surface text-foreground"
            >
              {availableInviteRoles.map(([key, rc]) => (
                <option key={key} value={key}>{rc.label}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={sending}
              className="bg-primary text-primary-foreground font-body text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-2 whitespace-nowrap"
            >
              <Mail className="w-4 h-4" />
              {sending ? 'Sending...' : 'Send Invite'}
            </button>
          </form>

          {/* Copy link banner */}
          {copiedLink && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-4 flex items-center gap-3">
              <p className="font-body text-sm text-foreground flex-1 truncate">{copiedLink}</p>
              <button
                onClick={() => handleCopyLink(copiedLink)}
                className="bg-primary text-primary-foreground font-body text-xs font-medium px-3 py-1.5 rounded-lg hover:opacity-90 inline-flex items-center gap-1 whitespace-nowrap"
              >
                <Copy className="w-3 h-3" />
                Copy Link
              </button>
              <button onClick={() => setCopiedLink(null)} className="text-muted hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Invites list */}
          {invitesLoading ? (
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => <div key={i} className="h-10 animate-pulse bg-background rounded" />)}
            </div>
          ) : invites.length === 0 ? (
            <p className="font-body text-sm text-muted text-center py-6">No invites sent yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border">
                    <th className="font-body text-xs font-semibold text-muted py-3 px-2">Email</th>
                    <th className="font-body text-xs font-semibold text-muted py-3 px-2">Role</th>
                    <th className="font-body text-xs font-semibold text-muted py-3 px-2">Invited By</th>
                    <th className="font-body text-xs font-semibold text-muted py-3 px-2">Status</th>
                    <th className="font-body text-xs font-semibold text-muted py-3 px-2">Expires</th>
                    <th className="font-body text-xs font-semibold text-muted py-3 px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {invites.map((inv) => {
                    const rc = roleConfig[inv.role] || roleConfig.readonly;
                    const isExpired = inv.status === 'pending' && new Date(inv.expires_at) < new Date();
                    const displayStatus = isExpired ? 'expired' : inv.status;
                    return (
                      <tr key={inv.id} className="border-b border-border/50 hover:bg-soft-white transition-colors">
                        <td className="font-body text-sm text-foreground py-3 px-2">{inv.email}</td>
                        <td className="py-3 px-2">
                          <span className={`font-body text-xs px-2 py-0.5 rounded-full font-medium ${rc.color}`}>
                            {rc.label}
                          </span>
                        </td>
                        <td className="font-body text-xs text-muted py-3 px-2">{inv.invited_by_email}</td>
                        <td className="py-3 px-2">
                          <span className={`font-body text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[displayStatus] || statusColors.pending}`}>
                            {displayStatus}
                          </span>
                        </td>
                        <td className="font-body text-xs text-muted py-3 px-2">
                          {new Date(inv.expires_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-2">
                          {inv.status === 'pending' && !isExpired && (
                            <button
                              onClick={() => handleRevokeInvite(inv.id)}
                              className="text-muted hover:text-destructive transition-colors"
                              title="Revoke invite"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Role legend */}
      <div className="mt-4 pt-4 border-t border-border">
        <p className="font-body text-xs text-muted mb-2">Role Hierarchy:</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(roleConfig).map(([key, rc]) => {
            const RoleIcon = rc.icon;
            return (
              <span key={key} className={`font-body text-xs px-2 py-1 rounded-full inline-flex items-center gap-1 ${rc.color}`}>
                <RoleIcon className="w-3 h-3" />
                {rc.label}
              </span>
            );
          })}
        </div>
        <p className="font-body text-xs text-muted mt-2">
          Master = full control • Admin = manage data • Approver = invite & view • Read Only = view only
        </p>
      </div>
    </div>
  );
};

export default AdminManagement;
