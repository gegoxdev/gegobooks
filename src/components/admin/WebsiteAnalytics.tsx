import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Eye, Users, Clock, MousePointerClick, Monitor, Globe, ArrowUpRight, ArrowDownRight, BarChart3, Smartphone, Laptop, Tablet } from 'lucide-react';

interface TrafficOverview {
  views_today: number;
  visitors_today: number;
  views_7d: number;
  visitors_7d: number;
  views_30d: number;
  visitors_30d: number;
  avg_duration_ms_7d: number;
  sessions_7d: number;
}

interface TrafficSource {
  source: string;
  page_views: number;
  unique_visitors: number;
}

interface TopPage {
  page_path: string;
  views: number;
  unique_visitors: number;
  avg_duration_ms: number;
}

interface DailyView {
  date: string;
  views: number;
  visitors: number;
}

interface DeviceData {
  device_type: string;
  views: number;
  visitors: number;
}

interface BrowserData {
  browser: string;
  views: number;
  visitors: number;
}

interface HourlyData {
  hour: number;
  views: number;
  visitors: number;
}

interface BounceData {
  bounced_sessions: number;
  total_sessions: number;
  bounce_pct: number;
}

const formatDuration = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}m ${remaining}s`;
};

const deviceIcons: Record<string, any> = {
  Mobile: Smartphone,
  Tablet: Tablet,
  Desktop: Laptop,
};

const WebsiteAnalytics = () => {
  const [overview, setOverview] = useState<TrafficOverview | null>(null);
  const [sources, setSources] = useState<TrafficSource[]>([]);
  const [topPages, setTopPages] = useState<TopPage[]>([]);
  const [dailyViews, setDailyViews] = useState<DailyView[]>([]);
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [browsers, setBrowsers] = useState<BrowserData[]>([]);
  const [hourly, setHourly] = useState<HourlyData[]>([]);
  const [bounce, setBounce] = useState<BounceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'7d' | '30d' | 'today'>('7d');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [overviewRes, sourcesRes, pagesRes, dailyRes, devicesRes, browsersRes, hourlyRes, bounceRes] = await Promise.all([
      supabase.from('traffic_overview').select('*').single(),
      supabase.from('traffic_sources').select('*'),
      supabase.from('top_pages').select('*'),
      supabase.from('daily_page_views').select('*'),
      supabase.from('device_breakdown').select('*'),
      supabase.from('browser_breakdown').select('*'),
      supabase.from('hourly_traffic').select('*'),
      supabase.from('bounce_rate').select('*').single(),
    ]);

    if (overviewRes.data) setOverview(overviewRes.data as any);
    if (sourcesRes.data) setSources(sourcesRes.data as any);
    if (pagesRes.data) setTopPages(pagesRes.data as any);
    if (dailyRes.data) setDailyViews(dailyRes.data as any);
    if (devicesRes.data) setDevices(devicesRes.data as any);
    if (browsersRes.data) setBrowsers(browsersRes.data as any);
    if (hourlyRes.data) setHourly(hourlyRes.data as any);
    if (bounceRes.data) setBounce(bounceRes.data as any);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (loading || !overview) {
    return (
      <div className="bg-surface rounded-xl border border-border p-6">
        <div className="animate-pulse font-body text-muted text-center py-8">Loading analytics...</div>
      </div>
    );
  }

  const viewsForPeriod = activeTab === 'today' ? overview.views_today : activeTab === '7d' ? overview.views_7d : overview.views_30d;
  const visitorsForPeriod = activeTab === 'today' ? overview.visitors_today : activeTab === '7d' ? overview.visitors_7d : overview.visitors_30d;
  const pagesPerSession = overview.sessions_7d > 0 ? (overview.views_7d / overview.sessions_7d).toFixed(1) : '0';

  const totalDeviceViews = devices.reduce((s, d) => s + d.views, 0);
  const totalSourceViews = sources.reduce((s, d) => s + d.page_views, 0);

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="bg-surface rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h2 className="font-heading font-bold text-lg text-foreground">Website Analytics</h2>
          </div>
          <div className="flex gap-1 bg-muted/20 rounded-lg p-1">
            {(['today', '7d', '30d'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-md text-xs font-body font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                {tab === 'today' ? 'Today' : tab === '7d' ? '7 Days' : '30 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <MetricCard icon={Eye} label="Page Views" value={viewsForPeriod.toLocaleString()} />
          <MetricCard icon={Users} label="Unique Visitors" value={visitorsForPeriod.toLocaleString()} />
          <MetricCard icon={Clock} label="Avg. Time on Site" value={formatDuration(overview.avg_duration_ms_7d)} />
          <MetricCard icon={MousePointerClick} label="Bounce Rate" value={`${bounce?.bounce_pct || 0}%`} />
          <MetricCard icon={Monitor} label="Pages / Session" value={pagesPerSession} />
        </div>
      </div>

      {/* Daily Traffic Chart */}
      {dailyViews.length > 0 && (
        <div className="bg-surface rounded-xl border border-border p-6">
          <h3 className="font-heading font-bold text-sm text-foreground mb-4">Daily Traffic (30 Days)</h3>
          <div className="overflow-x-auto">
            <div className="flex items-end gap-[2px] h-40 min-w-[400px]">
              {dailyViews.map((d, i) => {
                const maxViews = Math.max(...dailyViews.map(v => v.views || 1));
                const height = ((d.views || 0) / maxViews) * 100;
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center justify-end group relative"
                    title={`${d.date}: ${d.views} views, ${d.visitors} visitors`}
                  >
                    <div className="absolute -top-8 bg-foreground text-background text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      {d.views} views
                    </div>
                    <div
                      className="w-full bg-primary/40 rounded-t hover:bg-primary transition-colors min-h-[2px]"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-1">
              <span className="font-body text-[10px] text-muted">{dailyViews[0]?.date}</span>
              <span className="font-body text-[10px] text-muted">{dailyViews[dailyViews.length - 1]?.date}</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Traffic Sources */}
        <div className="bg-surface rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-primary" />
            <h3 className="font-heading font-bold text-sm text-foreground">Traffic Sources</h3>
          </div>
          <div className="space-y-3">
            {sources.length === 0 && <p className="font-body text-sm text-muted">No data yet</p>}
            {sources.slice(0, 8).map((s, i) => {
              const pct = totalSourceViews > 0 ? ((s.page_views / totalSourceViews) * 100).toFixed(1) : '0';
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-body text-sm text-foreground">{s.source}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-body text-xs text-muted">{pct}%</span>
                      <span className="font-heading font-bold text-sm text-foreground">{s.page_views}</span>
                    </div>
                  </div>
                  <div className="w-full bg-muted/20 rounded-full h-1.5">
                    <div className="bg-primary rounded-full h-1.5 transition-all" style={{ width: `${Math.max(Number(pct), 2)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Pages */}
        <div className="bg-surface rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-4 h-4 text-primary" />
            <h3 className="font-heading font-bold text-sm text-foreground">Top Pages</h3>
          </div>
          <div className="space-y-3">
            {topPages.length === 0 && <p className="font-body text-sm text-muted">No data yet</p>}
            {topPages.slice(0, 8).map((p, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="font-body text-sm text-foreground truncate max-w-[60%]">{p.page_path}</span>
                <div className="flex items-center gap-4">
                  <span className="font-body text-xs text-muted">{formatDuration(p.avg_duration_ms)}</span>
                  <span className="font-heading font-bold text-sm text-foreground">{p.views}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Device Breakdown */}
        <div className="bg-surface rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Monitor className="w-4 h-4 text-primary" />
            <h3 className="font-heading font-bold text-sm text-foreground">Devices</h3>
          </div>
          <div className="space-y-3">
            {devices.map((d, i) => {
              const pct = totalDeviceViews > 0 ? ((d.views / totalDeviceViews) * 100).toFixed(1) : '0';
              const Icon = deviceIcons[d.device_type] || Monitor;
              return (
                <div key={i} className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-muted" />
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="font-body text-sm text-foreground">{d.device_type}</span>
                      <span className="font-body text-xs text-muted">{pct}%</span>
                    </div>
                    <div className="w-full bg-muted/20 rounded-full h-1.5">
                      <div className="bg-primary rounded-full h-1.5" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Browser Breakdown */}
        <div className="bg-surface rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-primary" />
            <h3 className="font-heading font-bold text-sm text-foreground">Browsers</h3>
          </div>
          <div className="space-y-3">
            {browsers.slice(0, 6).map((b, i) => {
              const totalBViews = browsers.reduce((s, x) => s + x.views, 0);
              const pct = totalBViews > 0 ? ((b.views / totalBViews) * 100).toFixed(1) : '0';
              return (
                <div key={i} className="flex items-center justify-between">
                  <span className="font-body text-sm text-foreground">{b.browser}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-body text-xs text-muted">{pct}%</span>
                    <span className="font-heading font-bold text-sm text-foreground">{b.views}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Peak Hours */}
        <div className="bg-surface rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-primary" />
            <h3 className="font-heading font-bold text-sm text-foreground">Peak Hours (7d)</h3>
          </div>
          <div className="flex items-end gap-[2px] h-24">
            {Array.from({ length: 24 }, (_, h) => {
              const found = hourly.find(x => x.hour === h);
              const views = found?.views || 0;
              const maxH = Math.max(...hourly.map(x => x.views || 1), 1);
              const height = (views / maxH) * 100;
              return (
                <div
                  key={h}
                  className="flex-1 flex flex-col items-center justify-end group relative"
                  title={`${h}:00 — ${views} views`}
                >
                  <div
                    className="w-full bg-primary/40 rounded-t hover:bg-primary transition-colors min-h-[1px]"
                    style={{ height: `${height}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-1">
            <span className="font-body text-[10px] text-muted">12am</span>
            <span className="font-body text-[10px] text-muted">12pm</span>
            <span className="font-body text-[10px] text-muted">11pm</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="bg-background rounded-lg border border-border p-4">
    <div className="flex items-center gap-2 mb-1">
      <Icon className="w-4 h-4 text-primary" />
      <p className="font-body text-xs text-muted">{label}</p>
    </div>
    <p className="font-heading font-bold text-xl text-foreground">{value}</p>
  </div>
);

export default WebsiteAnalytics;
