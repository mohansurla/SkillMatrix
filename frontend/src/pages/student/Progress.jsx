import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { progressAPI } from '../../api';
import { LoadingSpinner, EmptyState, ProgressBar } from '../../components/UI';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const StudentProgress = () => {
  const [progress, setProgress] = useState([]);
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [pRes, rRes] = await Promise.all([
          progressAPI.getProgress(),
          progressAPI.getRankings(),
        ]);
        setProgress(pRes.data.data.progress);
        setRankings(rRes.data.data.rankings);
      } catch {} finally { setLoading(false); }
    };
    load();
  }, []);

  const doughnutData = {
    labels: progress.map((p) => p.skill_name),
    datasets: [{
      data: progress.map((p) => p.completion_percentage || 1),
      backgroundColor: [
        'rgba(108,99,255,0.8)',
        'rgba(34,211,238,0.8)',
        'rgba(244,114,182,0.8)',
        'rgba(16,185,129,0.8)',
        'rgba(245,158,11,0.8)',
      ],
      borderColor: ['#6c63ff', '#22d3ee', '#f472b6', '#10b981', '#f59e0b'],
      borderWidth: 2,
    }],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#94a3b8', font: { size: 11 }, padding: 12 },
      },
      tooltip: { backgroundColor: '#1c2030', titleColor: '#e2e8f0', bodyColor: '#94a3b8' },
    },
    cutout: '65%',
  };

  if (loading) return <DashboardLayout title="My Progress"><LoadingSpinner /></DashboardLayout>;

  return (
    <DashboardLayout title="My Progress">
      <div className="page-header">
        <div>
          <h1 className="page-title">Learning Progress</h1>
          <p className="page-subtitle">Track your skill mastery across all modules</p>
        </div>
      </div>

      <div className="grid grid-2 mb-6">
        {/* Doughnut chart */}
        <div className="card">
          <div className="card-header"><span className="card-title">Skill Completion Overview</span></div>
          {progress.length === 0 ? (
            <EmptyState icon="🎯" title="No skills assigned yet" description="Your mentor will assign skills and modules" />
          ) : (
            <div style={{ height: 280 }}>
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          )}
        </div>

        {/* Rankings */}
        <div className="card">
          <div className="card-header"><span className="card-title">🏆 Leaderboard</span></div>
          {rankings.length === 0 ? (
            <EmptyState icon="🏆" title="No rankings yet" description="Complete assignments to appear on the leaderboard" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {rankings.slice(0, 6).map((r) => (
                <div key={r.id} className="flex items-center gap-3 p-3" style={{ background: '#f8f8f8', borderRadius: '4px' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: r.rank === 1 ? 'rgba(245,158,11,0.2)' : r.rank === 2 ? 'rgba(200,215,225,0.1)' : r.rank === 3 ? 'rgba(180,120,60,0.15)' : '#f0f0f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: r.rank <= 3 ? 18 : 12,
                    fontWeight: 700,
                    color: r.rank > 3 ? '#999' : undefined,
                    flexShrink: 0,
                  }}>
                    {r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : `#${r.rank}`}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div style={{ fontWeight: 500, fontSize: 13 }} className="truncate">{r.name}</div>
                    <div style={{ fontSize: 11, color: '#999' }}>{r.avg_completion}% avg completion</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: r.avg_score >= 85 ? '#28a745' : '#666' }}>
                    {r.avg_score ? `${r.avg_score}%` : '—'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detailed per-skill progress */}
      {progress.length === 0 ? (
        <div className="card">
          <EmptyState icon="📈" title="No progress data" description="Submit assignments to start tracking your progress" />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {progress.map((p) => (
            <div className="card card-hover" key={p.id}>
              <div className="flex items-start justify-between gap-4 mb-4" style={{ flexWrap: 'wrap' }}>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: 16 }}>{p.skill_name}</h3>
                  <span style={{ fontSize: 12, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{p.category}</span>
                </div>
                <div className="flex gap-5" style={{ flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#0066cc' }}>{p.submitted_modules}/{p.total_modules}</div>
                    <div style={{ fontSize: 11, color: '#999' }}>Modules Done</div>
                  </div>
                  {p.avg_score !== null && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 24, fontWeight: 800, color: '#28a745' }}>{p.avg_score}</div>
                      <div style={{ fontSize: 11, color: '#999' }}>Avg Score</div>
                    </div>
                  )}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#17a2b8' }}>{p.completion_percentage}%</div>
                    <div style={{ fontSize: 11, color: '#999' }}>Complete</div>
                  </div>
                </div>
              </div>
              <ProgressBar
                value={p.completion_percentage}
                color={p.completion_percentage >= 80 ? 'success' : p.completion_percentage >= 50 ? 'primary' : 'warning'}
                showLabel={false}
                size="lg"
              />
              <div className="flex justify-between mt-2">
                <span className="text-sm text-muted">Last updated: {new Date(p.last_updated).toLocaleDateString()}</span>
                <span className="text-sm" style={{ color: '#0066cc' }}>{p.completion_percentage}% complete</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentProgress;

