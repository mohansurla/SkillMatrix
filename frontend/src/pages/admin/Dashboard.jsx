import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { progressAPI } from '../../api';
import { StatCard, LoadingSpinner, EmptyState } from '../../components/UI';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const AdminDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    progressAPI.getOverview().then((r) => setOverview(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout title="Admin Dashboard"><LoadingSpinner /></DashboardLayout>;

  const weeklyChartData = {
    labels: overview?.weekly_trend?.map((w) => new Date(w.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })) || [],
    datasets: [{
      label: 'Submissions',
      data: overview?.weekly_trend?.map((w) => w.submissions) || [],
      backgroundColor: 'rgba(108, 99, 255, 0.5)',
      borderColor: '#0066cc',
      borderWidth: 2,
      borderRadius: 6,
      fill: true,
    }],
  };

  const skillChartData = {
    labels: overview?.skill_progress?.map((s) => s.skill_name) || [],
    datasets: [{
      label: 'Avg Completion %',
      data: overview?.skill_progress?.map((s) => s.avg_completion) || [],
      backgroundColor: overview?.skill_progress?.map((_, i) =>
        ['rgba(108,99,255,0.7)', 'rgba(34,211,238,0.7)', 'rgba(244,114,182,0.7)', 'rgba(16,185,129,0.7)', 'rgba(245,158,11,0.7)'][i % 5]
      ) || [],
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#94a3b8', font: { size: 12 } } },
      tooltip: { backgroundColor: '#1c2030', titleColor: '#e2e8f0', bodyColor: '#94a3b8' },
    },
    scales: {
      x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.04)' } },
      y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.04)' } },
    },
  };

  const stats = overview?.stats || {};

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Platform-wide overview and analytics</p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-3 mb-6">
        <StatCard icon="🎓" label="Total Students" value={stats.total_students || 0} color="primary" />
        <StatCard icon="👨‍🏫" label="Total Mentors" value={stats.total_mentors || 0} color="cyan" />
        <StatCard icon="📝" label="Total Assignments" value={stats.total_assignments || 0} color="info" />
        <StatCard icon="✅" label="Evaluations Done" value={stats.total_evaluations || 0} color="success" />
        <StatCard icon="⭐" label="Platform Avg Score" value={stats.avg_score ? `${stats.avg_score}%` : 'N/A'} color="warning" />
        <StatCard icon="⏳" label="Pending Reviews" value={stats.pending_evaluations || 0} color="danger" />
      </div>

      <div className="grid grid-2 mb-6">
        {/* Weekly submissions trend */}
        <div className="card">
          <div className="card-header"><span className="card-title">Weekly Submissions (7 days)</span></div>
          {!overview?.weekly_trend?.length ? <EmptyState icon="📊" title="No data yet" /> : (
            <div style={{ height: 220 }}>
              <Bar data={weeklyChartData} options={{ ...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: false } } }} />
            </div>
          )}
        </div>

        {/* Skill completion chart */}
        <div className="card">
          <div className="card-header"><span className="card-title">Avg Completion by Skill</span></div>
          {!overview?.skill_progress?.length ? <EmptyState icon="📊" title="No data yet" /> : (
            <div style={{ height: 220 }}>
              <Bar data={skillChartData} options={{ ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, max: 100 } }, plugins: { ...chartOptions.plugins, legend: { display: false } } }} />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-2">
        {/* Skill table */}
        <div className="card">
          <div className="card-header"><span className="card-title">Skill Performance</span></div>
          {!overview?.skill_progress?.length ? <EmptyState icon="🎯" title="No skills yet" /> : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Skill</th>
                    <th>Category</th>
                    <th>Students</th>
                    <th>Avg %</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.skill_progress.map((s, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 500 }}>{s.skill_name}</td>
                      <td className="text-muted">{s.category}</td>
                      <td>{s.active_students}</td>
                      <td>
                        <span style={{ color: s.avg_completion >= 70 ? '#28a745' : '#856404', fontWeight: 600 }}>
                          {s.avg_completion}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent evaluations */}
        <div className="card">
          <div className="card-header"><span className="card-title">Recent Evaluations</span></div>
          {!overview?.recent_evaluations?.length ? <EmptyState icon="⭐" title="No evaluations yet" /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {overview.recent_evaluations.map((e, i) => (
                <div key={i} className="flex items-center gap-3 p-3" style={{ background: '#f8f8f8', borderRadius: '4px' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '4px',
                    background: e.score >= 85 ? 'rgba(16,185,129,0.15)' : 'rgba(108,99,255,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 800,
                    color: e.score >= 85 ? '#28a745' : '#0066cc',
                    flexShrink: 0,
                  }}>
                    {e.score}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{e.student_name}</div>
                    <div style={{ fontSize: 11, color: '#999' }}>{e.module_title} · {e.skill_name}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;

