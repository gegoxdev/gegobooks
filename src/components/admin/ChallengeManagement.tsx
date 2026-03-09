import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, Trophy, Award, CheckCircle, XCircle, Eye } from 'lucide-react';

type ChallengeWeek = {
  id: string;
  title: string;
  description: string | null;
  theme: string;
  start_date: string;
  end_date: string;
  status: string;
  prize_amount: number;
  created_at: string;
};

type Submission = {
  id: string;
  user_name: string;
  user_email: string;
  content_url: string;
  platform: string;
  caption: string | null;
  status: string;
  is_weekly_winner: boolean;
  is_monthly_winner: boolean;
  created_at: string;
  challenge_week_id: string;
};

const statusColors: Record<string, string> = {
  draft: 'bg-muted/20 text-muted-foreground',
  active: 'bg-primary/10 text-primary',
  completed: 'bg-accent/10 text-accent',
};

const ChallengeManagement = ({ isReadOnly }: { isReadOnly: boolean }) => {
  const [weeks, setWeeks] = useState<ChallengeWeek[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', description: '', theme: '', start_date: '', end_date: '', prize_amount: 20000, status: 'draft' });

  const fetchWeeks = async () => {
    const { data } = await supabase.from('challenge_weeks').select('*').order('start_date', { ascending: false });
    if (data) setWeeks(data);
    setLoading(false);
  };

  const fetchSubmissions = async (weekId: string) => {
    const { data } = await supabase.from('challenge_submissions').select('*').eq('challenge_week_id', weekId).order('created_at', { ascending: false });
    if (data) setSubmissions(data as Submission[]);
  };

  useEffect(() => { fetchWeeks(); }, []);
  useEffect(() => { if (selectedWeek) fetchSubmissions(selectedWeek); }, [selectedWeek]);

  const handleCreateWeek = async () => {
    if (!form.title || !form.theme || !form.start_date || !form.end_date) {
      toast.error('Fill all required fields');
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { error } = await supabase.from('challenge_weeks').insert({
      title: form.title,
      description: form.description || null,
      theme: form.theme,
      start_date: form.start_date,
      end_date: form.end_date,
      prize_amount: form.prize_amount,
      status: form.status,
      created_by: session.user.id,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Challenge week created!');
    setShowForm(false);
    setForm({ title: '', description: '', theme: '', start_date: '', end_date: '', prize_amount: 20000, status: 'draft' });
    fetchWeeks();
  };

  const handleStatusChange = async (id: string, status: string) => {
    const { error } = await supabase.from('challenge_weeks').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Status updated to ${status}`);
    fetchWeeks();
  };

  const handleDeleteWeek = async (id: string) => {
    if (!confirm('Delete this challenge week and all its submissions?')) return;
    const { error } = await supabase.from('challenge_weeks').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Challenge week deleted');
    if (selectedWeek === id) { setSelectedWeek(null); setSubmissions([]); }
    fetchWeeks();
  };

  const handleApproveSubmission = async (id: string) => {
    const { error } = await supabase.from('challenge_submissions').update({ status: 'approved', updated_at: new Date().toISOString() }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Submission approved');
    if (selectedWeek) fetchSubmissions(selectedWeek);
  };

  const handleRejectSubmission = async (id: string) => {
    const { error } = await supabase.from('challenge_submissions').update({ status: 'rejected', updated_at: new Date().toISOString() }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Submission rejected');
    if (selectedWeek) fetchSubmissions(selectedWeek);
  };

  const handleSelectWeeklyWinner = async (id: string) => {
    const { error } = await supabase.rpc('admin_select_weekly_winner', { submission_id: id });
    if (error) { toast.error(error.message); return; }
    toast.success('Weekly winner selected! 🏆');
    if (selectedWeek) fetchSubmissions(selectedWeek);
  };

  const handleSelectMonthlyWinner = async (id: string) => {
    const { error } = await supabase.rpc('admin_select_monthly_winner', { submission_id: id });
    if (error) { toast.error(error.message); return; }
    toast.success('Monthly grand prize winner selected! 👑');
    if (selectedWeek) fetchSubmissions(selectedWeek);
  };

  if (loading) return <div className="animate-pulse font-body text-muted p-4">Loading challenges...</div>;

  return (
    <div className="bg-surface rounded-xl border border-border p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-lg text-foreground flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          Creator Challenge Management
        </h2>
        {!isReadOnly && (
          <button onClick={() => setShowForm(!showForm)} className="bg-primary text-primary-foreground font-body text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 flex items-center gap-1">
            <Plus className="w-4 h-4" /> New Week
          </button>
        )}
      </div>

      {/* Create Form */}
      {showForm && !isReadOnly && (
        <div className="bg-background rounded-lg border border-border p-4 space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <input placeholder="Title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="font-body text-sm border border-border rounded-lg px-3 py-2 bg-surface text-foreground" />
            <input placeholder="Theme *" value={form.theme} onChange={e => setForm({ ...form, theme: e.target.value })} className="font-body text-sm border border-border rounded-lg px-3 py-2 bg-surface text-foreground" />
            <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="font-body text-sm border border-border rounded-lg px-3 py-2 bg-surface text-foreground" />
            <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="font-body text-sm border border-border rounded-lg px-3 py-2 bg-surface text-foreground" />
            <input type="number" placeholder="Prize (₦)" value={form.prize_amount} onChange={e => setForm({ ...form, prize_amount: +e.target.value })} className="font-body text-sm border border-border rounded-lg px-3 py-2 bg-surface text-foreground" />
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="font-body text-sm border border-border rounded-lg px-3 py-2 bg-surface text-foreground">
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full font-body text-sm border border-border rounded-lg px-3 py-2 bg-surface text-foreground" rows={2} />
          <div className="flex gap-2">
            <button onClick={handleCreateWeek} className="bg-primary text-primary-foreground font-body text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90">Create</button>
            <button onClick={() => setShowForm(false)} className="bg-muted/20 text-foreground font-body text-sm px-4 py-2 rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      {/* Weeks List */}
      <div className="space-y-3">
        {weeks.length === 0 && <p className="font-body text-sm text-muted">No challenge weeks created yet.</p>}
        {weeks.map(w => (
          <div key={w.id} className={`rounded-lg border p-4 ${selectedWeek === w.id ? 'border-primary bg-primary/5' : 'border-border bg-background'}`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedWeek(selectedWeek === w.id ? null : w.id)} className="font-heading font-bold text-foreground text-sm hover:text-primary transition-colors">
                  {w.title}
                </button>
                <span className={`font-body text-xs px-2 py-0.5 rounded-full ${statusColors[w.status] || 'bg-muted/20 text-muted'}`}>
                  {w.status}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-body text-xs text-muted">{w.start_date} → {w.end_date}</span>
                <span className="font-body text-xs font-semibold text-primary">₦{w.prize_amount.toLocaleString()}</span>
                {!isReadOnly && (
                  <>
                    {w.status === 'draft' && (
                      <button onClick={() => handleStatusChange(w.id, 'active')} className="font-body text-xs text-primary hover:underline">Publish</button>
                    )}
                    {w.status === 'active' && (
                      <button onClick={() => handleStatusChange(w.id, 'completed')} className="font-body text-xs text-accent hover:underline">Complete</button>
                    )}
                    <button onClick={() => handleDeleteWeek(w.id)} className="text-destructive hover:opacity-70">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
            {w.theme && <p className="font-body text-xs text-muted mt-1">Theme: {w.theme}</p>}
          </div>
        ))}
      </div>

      {/* Submissions for Selected Week */}
      {selectedWeek && (
        <div className="space-y-3">
          <h3 className="font-heading font-bold text-foreground flex items-center gap-2">
            <Eye className="w-4 h-4" /> Submissions
          </h3>
          {submissions.length === 0 && <p className="font-body text-sm text-muted">No submissions yet.</p>}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="font-body font-semibold text-left text-muted py-2 px-2">Creator</th>
                  <th className="font-body font-semibold text-left text-muted py-2 px-2">Platform</th>
                  <th className="font-body font-semibold text-left text-muted py-2 px-2">Status</th>
                  <th className="font-body font-semibold text-left text-muted py-2 px-2">Date</th>
                  {!isReadOnly && <th className="font-body font-semibold text-left text-muted py-2 px-2">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {submissions.map(s => (
                  <tr key={s.id} className="border-b border-border/50">
                    <td className="py-2 px-2">
                      <p className="font-body text-foreground">{s.user_name}</p>
                      <p className="font-body text-xs text-muted">{s.user_email}</p>
                    </td>
                    <td className="py-2 px-2">
                      <a href={s.content_url} target="_blank" rel="noopener noreferrer" className="font-body text-primary hover:underline capitalize">{s.platform}</a>
                    </td>
                    <td className="py-2 px-2">
                      <span className="font-body text-xs capitalize">{s.status}</span>
                      {s.is_weekly_winner && <span className="ml-1 text-accent">🏆</span>}
                      {s.is_monthly_winner && <span className="ml-1 text-accent">👑</span>}
                    </td>
                    <td className="py-2 px-2 font-body text-xs text-muted">{new Date(s.created_at).toLocaleDateString()}</td>
                    {!isReadOnly && (
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-1">
                          {s.status === 'pending' && (
                            <>
                              <button onClick={() => handleApproveSubmission(s.id)} title="Approve" className="text-primary hover:opacity-70"><CheckCircle className="w-4 h-4" /></button>
                              <button onClick={() => handleRejectSubmission(s.id)} title="Reject" className="text-destructive hover:opacity-70"><XCircle className="w-4 h-4" /></button>
                            </>
                          )}
                          {!s.is_weekly_winner && s.status === 'approved' && (
                            <button onClick={() => handleSelectWeeklyWinner(s.id)} title="Weekly Winner" className="text-accent hover:opacity-70"><Trophy className="w-4 h-4" /></button>
                          )}
                          {!s.is_monthly_winner && s.status === 'approved' && (
                            <button onClick={() => handleSelectMonthlyWinner(s.id)} title="Monthly Winner" className="text-accent hover:opacity-70"><Award className="w-4 h-4" /></button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChallengeManagement;
