import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, Trophy, Award, CheckCircle, XCircle, Eye, Edit, ToggleLeft, ToggleRight, Crown, Settings, Star } from 'lucide-react';

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
  attachment_url: string | null;
  attachment_name: string | null;
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
  score_engagement: number;
  score_creativity: number;
  score_theme_clarity: number;
  total_score: number;
};

type ChallengeSettings = {
  coming_soon: boolean;
  weekly_prize_amount: number;
  weekly_winner_count: number;
  monthly_prize_amount: number;
  monthly_winner_count: number;
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
  const [editingWeek, setEditingWeek] = useState<string | null>(null);
  const [settings, setSettings] = useState<ChallengeSettings>({
    coming_soon: true, weekly_prize_amount: 20000, weekly_winner_count: 5,
    monthly_prize_amount: 100000, monthly_winner_count: 1,
  });
  const [form, setForm] = useState({ title: '', description: '', theme: '', start_date: '', end_date: '', prize_amount: 20000, status: 'draft', attachment_url: '', attachment_name: '' });
  const [monthlyView, setMonthlyView] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [monthlySubmissions, setMonthlySubmissions] = useState<Submission[]>([]);
  const [scoringSubmission, setScoringSubmission] = useState<string | null>(null);
  const [scoreForm, setScoreForm] = useState({ engagement: 0, creativity: 0, theme_clarity: 0 });

  const fetchWeeks = async () => {
    const { data } = await supabase.from('challenge_weeks').select('*').order('start_date', { ascending: false });
    if (data) setWeeks(data as ChallengeWeek[]);
    setLoading(false);
  };

  const fetchSettings = async () => {
    const { data } = await supabase.rpc('get_challenge_settings');
    if (data && Array.isArray(data) && data.length > 0) {
      setSettings(data[0] as ChallengeSettings);
    }
  };

  const fetchSubmissions = async (weekId: string) => {
    const { data } = await supabase.from('challenge_submissions').select('*').eq('challenge_week_id', weekId).order('created_at', { ascending: false });
    if (data) setSubmissions(data as Submission[]);
  };

  const fetchMonthlySubmissions = async () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const { data: monthWeeks } = await supabase.from('challenge_weeks').select('id')
      .gte('start_date', `${year}-${String(month).padStart(2, '0')}-01`)
      .lte('start_date', `${year}-${String(month).padStart(2, '0')}-31`);

    if (monthWeeks && monthWeeks.length > 0) {
      const weekIds = monthWeeks.map(w => w.id);
      const { data } = await supabase.from('challenge_submissions').select('*')
        .in('challenge_week_id', weekIds).eq('status', 'approved').order('total_score', { ascending: false });
      if (data) setMonthlySubmissions(data as Submission[]);
    } else {
      setMonthlySubmissions([]);
    }
  };

  useEffect(() => { fetchWeeks(); fetchSettings(); }, []);
  useEffect(() => { if (selectedWeek) fetchSubmissions(selectedWeek); }, [selectedWeek]);
  useEffect(() => { if (monthlyView) fetchMonthlySubmissions(); }, [monthlyView, selectedMonth]);

  const handleToggleComingSoon = async () => {
    const newValue = !settings.coming_soon;
    const { error } = await supabase.from('challenge_settings' as any).update({ coming_soon: newValue, updated_at: new Date().toISOString() } as any).eq('id', 'global');
    if (error) { toast.error(error.message); return; }
    setSettings(s => ({ ...s, coming_soon: newValue }));
    toast.success(newValue ? 'Coming Soon mode activated' : 'Coming Soon mode deactivated — Challenge is now live!');
  };

  const handleUpdateSettings = async () => {
    const { error } = await supabase.from('challenge_settings' as any).update({
      weekly_prize_amount: settings.weekly_prize_amount,
      weekly_winner_count: settings.weekly_winner_count,
      monthly_prize_amount: settings.monthly_prize_amount,
      monthly_winner_count: settings.monthly_winner_count,
      updated_at: new Date().toISOString(),
    } as any).eq('id', 'global');
    if (error) { toast.error(error.message); return; }
    toast.success('Prize settings updated! Changes reflected across the website.');
    setShowSettings(false);
  };

  const handleCreateOrUpdateWeek = async () => {
    if (!form.title || !form.theme || !form.start_date || !form.end_date) {
      toast.error('Fill all required fields'); return;
    }
    if (editingWeek) {
      const { error } = await supabase.from('challenge_weeks').update({
        title: form.title, description: form.description || null, theme: form.theme,
        start_date: form.start_date, end_date: form.end_date, prize_amount: form.prize_amount,
        status: form.status, attachment_url: form.attachment_url || null,
        attachment_name: form.attachment_name || null, updated_at: new Date().toISOString(),
      }).eq('id', editingWeek);
      if (error) { toast.error(error.message); return; }
      toast.success('Challenge updated!');
      setEditingWeek(null);
    } else {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { error } = await supabase.from('challenge_weeks').insert({
        title: form.title, description: form.description || null, theme: form.theme,
        start_date: form.start_date, end_date: form.end_date, prize_amount: form.prize_amount,
        status: form.status, created_by: session.user.id,
        attachment_url: form.attachment_url || null, attachment_name: form.attachment_name || null,
      });
      if (error) { toast.error(error.message); return; }
      toast.success('Challenge week created!');
    }
    setShowForm(false);
    setForm({ title: '', description: '', theme: '', start_date: '', end_date: '', prize_amount: 20000, status: 'draft', attachment_url: '', attachment_name: '' });
    fetchWeeks();
  };

  const handleEditWeek = (w: ChallengeWeek) => {
    setForm({
      title: w.title, description: w.description || '', theme: w.theme,
      start_date: w.start_date, end_date: w.end_date, prize_amount: w.prize_amount,
      status: w.status, attachment_url: w.attachment_url || '', attachment_name: w.attachment_name || '',
    });
    setEditingWeek(w.id);
    setShowForm(true);
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
    if (monthlyView) fetchMonthlySubmissions();
  };

  const handleSelectMonthlyWinner = async (id: string) => {
    const { error } = await supabase.rpc('admin_select_monthly_winner', { submission_id: id });
    if (error) { toast.error(error.message); return; }
    toast.success('Monthly grand prize winner selected! 👑');
    if (selectedWeek) fetchSubmissions(selectedWeek);
    if (monthlyView) fetchMonthlySubmissions();
  };

  const handleScoreSubmission = async (id: string) => {
    const { error } = await supabase.rpc('admin_score_submission', {
      p_submission_id: id,
      p_engagement: scoreForm.engagement,
      p_creativity: scoreForm.creativity,
      p_theme_clarity: scoreForm.theme_clarity,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Submission scored!');
    setScoringSubmission(null);
    setScoreForm({ engagement: 0, creativity: 0, theme_clarity: 0 });
    if (selectedWeek) fetchSubmissions(selectedWeek);
    if (monthlyView) fetchMonthlySubmissions();
  };

  if (loading) return <div className="animate-pulse font-body text-muted p-4">Loading challenges...</div>;

  return (
    <div className="bg-surface rounded-xl border border-border p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-heading font-bold text-lg text-foreground flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" /> Creator Challenge Management
        </h2>
        <div className="flex items-center gap-3 flex-wrap">
          {!isReadOnly && (
            <>
              <button onClick={handleToggleComingSoon} className={`flex items-center gap-2 font-body text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${
                settings.coming_soon ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-primary/10 text-primary border border-primary/20'
              }`}>
                {settings.coming_soon ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
                {settings.coming_soon ? 'Coming Soon: ON' : 'Challenge: LIVE'}
              </button>
              <button onClick={() => setShowSettings(!showSettings)} className="flex items-center gap-1 font-body text-sm font-semibold px-4 py-2 rounded-lg bg-muted/10 text-muted-foreground border border-border">
                <Settings className="w-4 h-4" /> Prize Settings
              </button>
            </>
          )}
          <button onClick={() => setMonthlyView(!monthlyView)} className={`flex items-center gap-1 font-body text-sm font-semibold px-4 py-2 rounded-lg ${
            monthlyView ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-muted/10 text-muted-foreground border border-border'
          }`}>
            <Crown className="w-4 h-4" /> Monthly Winner
          </button>
          {!isReadOnly && (
            <button onClick={() => { setShowForm(!showForm); setEditingWeek(null); setForm({ title: '', description: '', theme: '', start_date: '', end_date: '', prize_amount: settings.weekly_prize_amount, status: 'draft', attachment_url: '', attachment_name: '' }); }} className="bg-primary text-primary-foreground font-body text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 flex items-center gap-1">
              <Plus className="w-4 h-4" /> New Week
            </button>
          )}
        </div>
      </div>

      {/* Prize Settings */}
      {showSettings && !isReadOnly && (
        <div className="bg-background rounded-lg border border-border p-4 space-y-3">
          <h3 className="font-heading font-bold text-foreground text-sm flex items-center gap-2"><Settings className="w-4 h-4" /> Prize Settings</h3>
          <p className="font-body text-xs text-muted">Changes apply immediately across the entire website.</p>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="font-body text-xs text-muted">Weekly Prize Amount (₦)</label>
              <input type="number" value={settings.weekly_prize_amount} onChange={e => setSettings(s => ({ ...s, weekly_prize_amount: +e.target.value }))} className="w-full font-body text-sm border border-border rounded-lg px-3 py-2 bg-surface text-foreground" />
            </div>
            <div>
              <label className="font-body text-xs text-muted">Number of Weekly Winners</label>
              <input type="number" value={settings.weekly_winner_count} onChange={e => setSettings(s => ({ ...s, weekly_winner_count: +e.target.value }))} className="w-full font-body text-sm border border-border rounded-lg px-3 py-2 bg-surface text-foreground" />
            </div>
            <div>
              <label className="font-body text-xs text-muted">Monthly Prize Amount (₦)</label>
              <input type="number" value={settings.monthly_prize_amount} onChange={e => setSettings(s => ({ ...s, monthly_prize_amount: +e.target.value }))} className="w-full font-body text-sm border border-border rounded-lg px-3 py-2 bg-surface text-foreground" />
            </div>
            <div>
              <label className="font-body text-xs text-muted">Number of Monthly Winners</label>
              <input type="number" value={settings.monthly_winner_count} onChange={e => setSettings(s => ({ ...s, monthly_winner_count: +e.target.value }))} className="w-full font-body text-sm border border-border rounded-lg px-3 py-2 bg-surface text-foreground" />
            </div>
          </div>
          <button onClick={handleUpdateSettings} className="bg-primary text-primary-foreground font-body text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90">Save Settings</button>
        </div>
      )}

      {/* Monthly Winner Selection */}
      {monthlyView && (
        <div className="bg-accent/5 border border-accent/20 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="font-heading font-bold text-foreground flex items-center gap-2">
              <Crown className="w-5 h-5 text-accent" /> Monthly Grand Prize Winner Selection
            </h3>
            <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="font-body text-sm border border-border rounded-lg px-3 py-2 bg-surface text-foreground" />
          </div>
          <p className="font-body text-xs text-muted">Select the monthly grand prize winner (₦{settings.monthly_prize_amount.toLocaleString()}) from approved weekly submissions. Sorted by score.</p>
          {monthlySubmissions.length === 0 ? (
            <p className="font-body text-sm text-muted">No approved submissions for this month.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="font-body font-semibold text-left text-muted py-2 px-2">Creator</th>
                    <th className="font-body font-semibold text-left text-muted py-2 px-2">Platform</th>
                    <th className="font-body font-semibold text-left text-muted py-2 px-2">Score</th>
                    <th className="font-body font-semibold text-left text-muted py-2 px-2">Weekly Winner</th>
                    {!isReadOnly && <th className="font-body font-semibold text-left text-muted py-2 px-2">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {monthlySubmissions.map(s => (
                    <tr key={s.id} className={`border-b border-border/50 ${s.is_monthly_winner ? 'bg-accent/10' : ''}`}>
                      <td className="py-2 px-2">
                        <p className="font-body text-foreground">{s.user_name}</p>
                        <p className="font-body text-xs text-muted">{s.user_email}</p>
                      </td>
                      <td className="py-2 px-2">
                        <a href={s.content_url} target="_blank" rel="noopener noreferrer" className="font-body text-primary hover:underline capitalize">{s.platform}</a>
                      </td>
                      <td className="py-2 px-2 font-heading font-bold text-foreground">{s.total_score || '—'}</td>
                      <td className="py-2 px-2">
                        {s.is_weekly_winner ? <span className="text-accent">🏆 Yes</span> : <span className="text-muted">No</span>}
                        {s.is_monthly_winner && <span className="ml-2 text-accent">👑 Monthly Winner</span>}
                      </td>
                      {!isReadOnly && (
                        <td className="py-2 px-2">
                          {!s.is_monthly_winner && (
                            <button onClick={() => handleSelectMonthlyWinner(s.id)} className="text-accent hover:opacity-70 flex items-center gap-1 font-body text-xs font-semibold">
                              <Award className="w-4 h-4" /> Grand Prize
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Form */}
      {showForm && !isReadOnly && (
        <div className="bg-background rounded-lg border border-border p-4 space-y-3">
          <h3 className="font-heading font-bold text-foreground text-sm">
            {editingWeek ? 'Edit Challenge Week' : 'Create Challenge Week'}
          </h3>
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
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="font-body text-xs text-muted">Downloadable File URL (for contestants)</label>
              <input placeholder="https://drive.google.com/..." value={form.attachment_url} onChange={e => setForm({ ...form, attachment_url: e.target.value })} className="w-full font-body text-sm border border-border rounded-lg px-3 py-2 bg-surface text-foreground" />
            </div>
            <div>
              <label className="font-body text-xs text-muted">File Name (e.g. "GegoBooks Logo Pack")</label>
              <input placeholder="GegoBooks Logo Pack" value={form.attachment_name} onChange={e => setForm({ ...form, attachment_name: e.target.value })} className="w-full font-body text-sm border border-border rounded-lg px-3 py-2 bg-surface text-foreground" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreateOrUpdateWeek} className="bg-primary text-primary-foreground font-body text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90">
              {editingWeek ? 'Update' : 'Create'}
            </button>
            <button onClick={() => { setShowForm(false); setEditingWeek(null); }} className="bg-muted/20 text-foreground font-body text-sm px-4 py-2 rounded-lg">Cancel</button>
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
                <span className={`font-body text-xs px-2 py-0.5 rounded-full ${statusColors[w.status] || 'bg-muted/20 text-muted'}`}>{w.status}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-body text-xs text-muted">{w.start_date} → {w.end_date}</span>
                <span className="font-body text-xs font-semibold text-primary">₦{w.prize_amount.toLocaleString()}</span>
                {w.attachment_url && <span className="font-body text-xs text-accent">📎 Attachment</span>}
                {!isReadOnly && (
                  <>
                    <button onClick={() => handleEditWeek(w)} title="Edit" className="text-muted hover:text-primary"><Edit className="w-4 h-4" /></button>
                    {w.status === 'draft' && <button onClick={() => handleStatusChange(w.id, 'active')} className="font-body text-xs text-primary hover:underline">Activate</button>}
                    {w.status === 'active' && <button onClick={() => handleStatusChange(w.id, 'completed')} className="font-body text-xs text-accent hover:underline">Complete</button>}
                    {w.status === 'completed' && <button onClick={() => handleStatusChange(w.id, 'active')} className="font-body text-xs text-primary hover:underline">Reactivate</button>}
                    <button onClick={() => handleDeleteWeek(w.id)} className="text-destructive hover:opacity-70"><Trash2 className="w-4 h-4" /></button>
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
          <p className="font-body text-xs text-muted">
            Scoring: 30% Engagement · 40% Creativity · 30% Weekly Theme Clarity (0-100 each)
          </p>
          {submissions.length === 0 && <p className="font-body text-sm text-muted">No submissions yet.</p>}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="font-body font-semibold text-left text-muted py-2 px-2">Creator</th>
                  <th className="font-body font-semibold text-left text-muted py-2 px-2">Platform</th>
                  <th className="font-body font-semibold text-left text-muted py-2 px-2">Status</th>
                  <th className="font-body font-semibold text-left text-muted py-2 px-2">Score</th>
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
                      {s.is_weekly_winner && <span className="ml-1">🏆</span>}
                      {s.is_monthly_winner && <span className="ml-1">👑</span>}
                    </td>
                    <td className="py-2 px-2">
                      {s.total_score > 0 ? (
                        <div>
                          <span className="font-heading font-bold text-foreground">{s.total_score}</span>
                          <p className="font-body text-[10px] text-muted">E:{s.score_engagement} C:{s.score_creativity} T:{s.score_theme_clarity}</p>
                        </div>
                      ) : (
                        <span className="font-body text-xs text-muted">Not scored</span>
                      )}
                    </td>
                    <td className="py-2 px-2 font-body text-xs text-muted">{new Date(s.created_at).toLocaleDateString()}</td>
                    {!isReadOnly && (
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-1 flex-wrap">
                          {s.status === 'pending' && (
                            <>
                              <button onClick={() => handleApproveSubmission(s.id)} title="Approve" className="text-primary hover:opacity-70"><CheckCircle className="w-4 h-4" /></button>
                              <button onClick={() => handleRejectSubmission(s.id)} title="Reject" className="text-destructive hover:opacity-70"><XCircle className="w-4 h-4" /></button>
                            </>
                          )}
                          {/* Score button */}
                          <button onClick={() => { setScoringSubmission(s.id); setScoreForm({ engagement: s.score_engagement || 0, creativity: s.score_creativity || 0, theme_clarity: s.score_theme_clarity || 0 }); }} title="Score" className="text-accent hover:opacity-70">
                            <Star className="w-4 h-4" />
                          </button>
                          {!s.is_weekly_winner && s.status === 'approved' && (
                            <button onClick={() => handleSelectWeeklyWinner(s.id)} title="Weekly Winner" className="text-accent hover:opacity-70"><Trophy className="w-4 h-4" /></button>
                          )}
                          {!s.is_monthly_winner && s.status === 'approved' && (
                            <button onClick={() => handleSelectMonthlyWinner(s.id)} title="Monthly Winner" className="text-accent hover:opacity-70"><Award className="w-4 h-4" /></button>
                          )}
                        </div>
                        {/* Scoring form inline */}
                        {scoringSubmission === s.id && (
                          <div className="mt-2 bg-surface border border-border rounded-lg p-3 space-y-2">
                            <p className="font-body text-xs font-semibold text-foreground">Score (0-100 each)</p>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="font-body text-[10px] text-muted">Engagement (30%)</label>
                                <input type="number" min="0" max="100" value={scoreForm.engagement} onChange={e => setScoreForm({ ...scoreForm, engagement: +e.target.value })} className="w-full font-body text-xs border border-border rounded px-2 py-1 bg-background text-foreground" />
                              </div>
                              <div>
                                <label className="font-body text-[10px] text-muted">Creativity (40%)</label>
                                <input type="number" min="0" max="100" value={scoreForm.creativity} onChange={e => setScoreForm({ ...scoreForm, creativity: +e.target.value })} className="w-full font-body text-xs border border-border rounded px-2 py-1 bg-background text-foreground" />
                              </div>
                              <div>
                                <label className="font-body text-[10px] text-muted">Theme (30%)</label>
                                <input type="number" min="0" max="100" value={scoreForm.theme_clarity} onChange={e => setScoreForm({ ...scoreForm, theme_clarity: +e.target.value })} className="w-full font-body text-xs border border-border rounded px-2 py-1 bg-background text-foreground" />
                              </div>
                            </div>
                            <p className="font-body text-[10px] text-muted">
                              Total: {((scoreForm.engagement * 0.3) + (scoreForm.creativity * 0.4) + (scoreForm.theme_clarity * 0.3)).toFixed(1)}
                            </p>
                            <div className="flex gap-2">
                              <button onClick={() => handleScoreSubmission(s.id)} className="bg-accent text-accent-foreground font-body text-xs font-semibold px-3 py-1 rounded hover:opacity-90">Save Score</button>
                              <button onClick={() => setScoringSubmission(null)} className="font-body text-xs text-muted hover:text-foreground">Cancel</button>
                            </div>
                          </div>
                        )}
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
