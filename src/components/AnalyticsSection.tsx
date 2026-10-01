import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid
} from 'recharts';
import { Incident } from '../types';

interface AnalyticsSectionProps {
  incidents: Incident[];
}

const SEVERITY_COLORS = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#22c55e'
};

const CATEGORY_COLORS = ['#38bdf8', '#818cf8', '#f43f5e', '#fb923c', '#a855f7', '#10b981', '#64748b'];

export const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({ incidents }) => {
  // 1. Incidents by Category
  const categoryCounts: Record<string, number> = {};
  incidents.forEach(i => {
    categoryCounts[i.type] = (categoryCounts[i.type] || 0) + 1;
  });
  const categoryData = Object.entries(categoryCounts).map(([name, count]) => ({
    name,
    count
  }));

  // 2. Incidents by Severity
  const severityCounts: Record<string, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  incidents.forEach(i => {
    severityCounts[i.severity] = (severityCounts[i.severity] || 0) + 1;
  });
  const severityData = Object.entries(severityCounts).map(([name, count]) => ({
    name,
    count
  }));

  // 3. Incidents Volume Over Time (Simulated hourly distribution)
  const hourlyData = [
    { time: '08:00', incidents: 2, resolved: 2 },
    { time: '10:00', incidents: 5, resolved: 4 },
    { time: '12:00', incidents: 8, resolved: 6 },
    { time: '14:00', incidents: 12, resolved: 9 },
    { time: '16:00', incidents: 9, resolved: 7 },
    { time: '18:00', incidents: incidents.length, resolved: incidents.filter(i => i.status === 'RESOLVED').length },
  ];

  // 4. Resolved vs Active
  const resolvedCount = incidents.filter(i => i.status === 'RESOLVED').length;
  const activeCount = incidents.length - resolvedCount;
  const statusData = [
    { name: 'Active / Dispatched', value: activeCount, color: '#f97316' },
    { name: 'Resolved Today', value: resolvedCount, color: '#10b981' }
  ];

  const avgResponseTimeMin = 4.8;

  return (
    <div className="space-y-6">
      {/* Top Telemetry KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Reports</div>
          <div className="text-2xl font-bold text-white font-mono mt-1">{incidents.length}</div>
          <div className="text-[11px] text-emerald-400 mt-1">100% Triaged by AI</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Avg Response Time</div>
          <div className="text-2xl font-bold text-cyan-400 font-mono mt-1">{avgResponseTimeMin}m</div>
          <div className="text-[11px] text-slate-400 mt-1">Goal: &lt; 6.0 minutes</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Active Operations</div>
          <div className="text-2xl font-bold text-amber-400 font-mono mt-1">{activeCount}</div>
          <div className="text-[11px] text-amber-300/80 mt-1">Units en-route & on-scene</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Resolution Rate</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
            {incidents.length > 0 ? `${Math.round((resolvedCount / incidents.length) * 100)}%` : '0%'}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1">{resolvedCount} cases closed</div>
        </div>
      </div>

      {/* Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incident Volume Over Time */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
              Incident Volume vs Resolution Timeline
            </h4>
            <span className="text-xs text-slate-500 font-mono">Today (24h)</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="incColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="resColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="incidents" stroke="#ef4444" fillOpacity={1} fill="url(#incColor)" name="Incidents Reported" />
                <Area type="monotone" dataKey="resolved" stroke="#10b981" fillOpacity={1} fill="url(#resColor)" name="Incidents Resolved" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Incidents by Severity */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
              Distribution by Triage Severity
            </h4>
            <span className="text-xs text-slate-500 font-mono">Real-time</span>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.name as keyof typeof SEVERITY_COLORS] || '#64748b'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-4 text-xs mt-2">
            {severityData.map(s => (
              <div key={s.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SEVERITY_COLORS[s.name as keyof typeof SEVERITY_COLORS] }}></span>
                <span className="text-slate-300 font-mono">{s.name}: {s.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Incidents by Category */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
              Incidents by Operational Emergency Category
            </h4>
            <span className="text-xs text-slate-500 font-mono">Active + Historic</span>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#38bdf8" radius={[4, 4, 0, 0]}>
                  {categoryData.map((_, index) => (
                    <Cell key={`bar-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
