const { get, all } = require('../database/db');

const getProgress = async (req, res, next) => {
  try {
    const { student_id, skill_id, mentor_id } = req.query;

    let targetStudentId = student_id;
    if (req.user.role === 'student') targetStudentId = req.user.id;

    let sql = `SELECT pt.*, u.name as student_name, u.email as student_email,
               s.name as skill_name, s.category
               FROM progress_tracking pt
               JOIN users u ON pt.student_id = u.id
               JOIN skills s ON pt.skill_id = s.id
               WHERE 1=1`;
    const params = [];

    if (targetStudentId) { sql += ' AND pt.student_id = ?'; params.push(targetStudentId); }
    if (skill_id) { sql += ' AND pt.skill_id = ?'; params.push(skill_id); }
    if (mentor_id && req.user.role !== 'student') {
      sql += ` AND pt.student_id IN (SELECT student_id FROM mentor_students WHERE mentor_id = ?)`;
      params.push(mentor_id);
    }
    if (req.user.role === 'mentor') {
      sql += ` AND pt.student_id IN (SELECT student_id FROM mentor_students WHERE mentor_id = ?)`;
      params.push(req.user.id);
    }

    sql += ' ORDER BY pt.last_updated DESC';
    const progress = await all(sql, params);

    // Enrich with assignment counts
    const enriched = await Promise.all(
      progress.map(async (p) => {
        const totalModules = await get('SELECT COUNT(*) as cnt FROM modules WHERE skill_id = ?', [p.skill_id]);
        const submitted = await get(
          `SELECT COUNT(*) as cnt FROM assignments a JOIN modules m ON a.module_id = m.id
           WHERE a.student_id = ? AND m.skill_id = ? AND a.status IN ('submitted','evaluated')`,
          [p.student_id, p.skill_id]
        );
        const evaluated = await get(
          `SELECT COUNT(*) as cnt, AVG(e.score) as avg_score FROM evaluations e
           JOIN assignments a ON e.assignment_id = a.id
           JOIN modules m ON a.module_id = m.id
           WHERE a.student_id = ? AND m.skill_id = ?`,
          [p.student_id, p.skill_id]
        );
        return {
          ...p,
          total_modules: totalModules.cnt,
          submitted_modules: submitted.cnt,
          evaluated_modules: evaluated.cnt,
          avg_score: evaluated.avg_score ? Math.round(evaluated.avg_score * 10) / 10 : null,
        };
      })
    );

    res.json({ success: true, data: { progress: enriched } });
  } catch (err) { next(err); }
};

const getOverview = async (req, res, next) => {
  try {
    const totalStudents = await get("SELECT COUNT(*) as cnt FROM users WHERE role = 'student'");
    const totalMentors = await get("SELECT COUNT(*) as cnt FROM users WHERE role = 'mentor'");
    const totalAssignments = await get('SELECT COUNT(*) as cnt FROM assignments');
    const totalEvaluations = await get('SELECT COUNT(*) as cnt FROM evaluations');
    const avgScore = await get('SELECT AVG(score) as avg FROM evaluations');
    const pendingEvals = await get("SELECT COUNT(*) as cnt FROM assignments WHERE status = 'submitted'");

    const skillProgress = await all(`
      SELECT s.name as skill_name, s.category,
             COUNT(DISTINCT pt.student_id) as active_students,
             AVG(pt.completion_percentage) as avg_completion
      FROM skills s
      LEFT JOIN progress_tracking pt ON s.id = pt.skill_id
      GROUP BY s.id ORDER BY avg_completion DESC
    `);

    const recentEvals = await all(`
      SELECT e.score, e.evaluated_at, u.name as student_name,
             m.title as module_title, s.name as skill_name
      FROM evaluations e
      JOIN assignments a ON e.assignment_id = a.id
      JOIN users u ON a.student_id = u.id
      JOIN modules m ON a.module_id = m.id
      JOIN skills s ON m.skill_id = s.id
      ORDER BY e.evaluated_at DESC LIMIT 5
    `);

    // Weekly trend (last 7 days)
    const weeklyTrend = await all(`
      SELECT DATE(submitted_at) as date, COUNT(*) as submissions
      FROM assignments
      WHERE submitted_at >= DATE('now', '-7 days')
      GROUP BY DATE(submitted_at)
      ORDER BY date ASC
    `);

    res.json({
      success: true,
      data: {
        stats: {
          total_students: totalStudents.cnt,
          total_mentors: totalMentors.cnt,
          total_assignments: totalAssignments.cnt,
          total_evaluations: totalEvaluations.cnt,
          avg_score: avgScore.avg ? Math.round(avgScore.avg * 10) / 10 : 0,
          pending_evaluations: pendingEvals.cnt,
        },
        skill_progress: skillProgress.map((s) => ({
          ...s,
          avg_completion: s.avg_completion ? Math.round(s.avg_completion * 10) / 10 : 0,
        })),
        recent_evaluations: recentEvals,
        weekly_trend: weeklyTrend,
      },
    });
  } catch (err) { next(err); }
};

const getRankings = async (req, res, next) => {
  try {
    const { skill_id } = req.query;
    let sql = `SELECT u.id, u.name, u.avatar_url,
               AVG(e.score) as avg_score,
               COUNT(DISTINCT e.id) as evaluated_count,
               AVG(pt.completion_percentage) as avg_completion
               FROM users u
               LEFT JOIN assignments a ON a.student_id = u.id
               LEFT JOIN evaluations e ON e.assignment_id = a.id
               LEFT JOIN modules m ON a.module_id = m.id
               LEFT JOIN progress_tracking pt ON pt.student_id = u.id
               WHERE u.role = 'student'`;
    const params = [];
    if (skill_id) {
      sql += ' AND m.skill_id = ? AND pt.skill_id = ?';
      params.push(skill_id, skill_id);
    }
    sql += ' GROUP BY u.id ORDER BY avg_score DESC, avg_completion DESC LIMIT 20';
    const rankings = await all(sql, params);
    const ranked = rankings.map((r, i) => ({
      rank: i + 1,
      ...r,
      avg_score: r.avg_score ? Math.round(r.avg_score * 10) / 10 : 0,
      avg_completion: r.avg_completion ? Math.round(r.avg_completion * 10) / 10 : 0,
    }));
    res.json({ success: true, data: { rankings: ranked } });
  } catch (err) { next(err); }
};

module.exports = { getProgress, getOverview, getRankings };
