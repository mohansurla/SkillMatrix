const { run, get, all } = require('../database/db');

const createAssignment = async (req, res, next) => {
  try {
    const { module_id, title, description, file_url } = req.body;
    const student_id = req.user.id;

    // Verify module exists
    const mod = await get('SELECT id, skill_id FROM modules WHERE id = ?', [module_id]);
    if (!mod) return res.status(404).json({ success: false, message: 'Module not found.' });

    // Prevent duplicate submission
    const existing = await get(
      'SELECT id FROM assignments WHERE student_id = ? AND module_id = ?',
      [student_id, module_id]
    );
    if (existing) {
      return res.status(409).json({ success: false, message: 'You have already submitted an assignment for this module.' });
    }

    const result = await run(
      'INSERT INTO assignments (student_id, module_id, title, description, file_url, status) VALUES (?, ?, ?, ?, ?, ?)',
      [student_id, module_id, title, description, file_url || null, 'submitted']
    );

    // Update progress tracking
    const allModulesInSkill = await all('SELECT id FROM modules WHERE skill_id = ?', [mod.skill_id]);
    const completedModules = await all(
      `SELECT a.module_id FROM assignments a WHERE a.student_id = ? AND a.module_id IN (${allModulesInSkill.map(() => '?').join(',')}) AND a.status IN ('submitted','evaluated')`,
      [student_id, ...allModulesInSkill.map((m) => m.id)]
    );
    const pct = allModulesInSkill.length > 0
      ? Math.round((completedModules.length / allModulesInSkill.length) * 100 * 10) / 10
      : 0;

    const ptExisting = await get('SELECT id FROM progress_tracking WHERE student_id = ? AND skill_id = ?', [student_id, mod.skill_id]);
    if (ptExisting) {
      await run('UPDATE progress_tracking SET completion_percentage = ?, last_updated = CURRENT_TIMESTAMP WHERE student_id = ? AND skill_id = ?',
        [pct, student_id, mod.skill_id]);
    } else {
      await run('INSERT INTO progress_tracking (student_id, skill_id, completion_percentage) VALUES (?, ?, ?)',
        [student_id, mod.skill_id, pct]);
    }

    // Notify mentor
    const mentorAssignment = await get('SELECT ms.mentor_id FROM mentor_students ms WHERE ms.student_id = ?', [student_id]);
    if (mentorAssignment) {
      await run(
        'INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)',
        [mentorAssignment.mentor_id, `${req.user.name} submitted an assignment for review: "${title}"`, 'assignment']
      );
    }

    const assignment = await get('SELECT * FROM assignments WHERE id = ?', [result.lastID]);
    res.status(201).json({ success: true, message: 'Assignment submitted.', data: { assignment } });
  } catch (err) { next(err); }
};

const getAssignments = async (req, res, next) => {
  try {
    const { student_id, module_id, skill_id, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let sql = `SELECT a.*, u.name as student_name, u.email as student_email,
               m.title as module_title, m.max_score, s.name as skill_name,
               e.score, e.feedback, e.evaluated_at
               FROM assignments a
               JOIN users u ON a.student_id = u.id
               JOIN modules m ON a.module_id = m.id
               JOIN skills s ON m.skill_id = s.id
               LEFT JOIN evaluations e ON e.assignment_id = a.id
               WHERE 1=1`;
    const params = [];

    // Role-based filtering
    if (req.user.role === 'student') { sql += ' AND a.student_id = ?'; params.push(req.user.id); }
    else if (req.user.role === 'mentor') { sql += ' AND m.mentor_id = ?'; params.push(req.user.id); }

    if (student_id && req.user.role !== 'student') { sql += ' AND a.student_id = ?'; params.push(student_id); }
    if (module_id) { sql += ' AND a.module_id = ?'; params.push(module_id); }
    if (skill_id) { sql += ' AND m.skill_id = ?'; params.push(skill_id); }
    if (status) { sql += ' AND a.status = ?'; params.push(status); }

    const countSql = sql.replace(
      /SELECT a\.\*.*?FROM assignments a/s,
      'SELECT COUNT(*) as total FROM assignments a'
    );
    const { total } = await get(countSql, params);

    sql += ' ORDER BY a.submitted_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);

    const assignments = await all(sql, params);
    res.json({ success: true, data: { assignments, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) } } });
  } catch (err) { next(err); }
};

const getAssignmentById = async (req, res, next) => {
  try {
    const assignment = await get(
      `SELECT a.*, u.name as student_name, m.title as module_title, m.max_score,
       s.name as skill_name, e.score, e.feedback, e.evaluated_at, eu.name as evaluator_name
       FROM assignments a
       JOIN users u ON a.student_id = u.id
       JOIN modules m ON a.module_id = m.id
       JOIN skills s ON m.skill_id = s.id
       LEFT JOIN evaluations e ON e.assignment_id = a.id
       LEFT JOIN users eu ON e.mentor_id = eu.id
       WHERE a.id = ?`,
      [req.params.id]
    );
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found.' });
    // Students can only see their own
    if (req.user.role === 'student' && assignment.student_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    res.json({ success: true, data: { assignment } });
  } catch (err) { next(err); }
};

module.exports = { createAssignment, getAssignments, getAssignmentById };
