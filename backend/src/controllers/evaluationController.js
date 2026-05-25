const { run, get, all } = require('../database/db');

const createEvaluation = async (req, res, next) => {
  try {
    const { assignment_id, score, feedback } = req.body;
    const mentor_id = req.user.id;

    const assignment = await get(
      `SELECT a.*, m.mentor_id, m.max_score FROM assignments a
       JOIN modules m ON a.module_id = m.id WHERE a.id = ?`,
      [assignment_id]
    );
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found.' });

    // Verify mentor owns this module OR is assigned to this student
    const isMentorOfStudent = await get(
      'SELECT id FROM mentor_students WHERE mentor_id = ? AND student_id = ?',
      [mentor_id, assignment.student_id]
    );
    if (!isMentorOfStudent && assignment.mentor_id !== mentor_id) {
      return res.status(403).json({ success: false, message: 'You can only evaluate students assigned to you.' });
    }

    // Prevent duplicate evaluation
    const existingEval = await get('SELECT id FROM evaluations WHERE assignment_id = ?', [assignment_id]);
    if (existingEval) {
      return res.status(409).json({ success: false, message: 'This assignment has already been evaluated.' });
    }

    if (score < 0 || score > assignment.max_score) {
      return res.status(400).json({ success: false, message: `Score must be between 0 and ${assignment.max_score}.` });
    }

    const result = await run(
      'INSERT INTO evaluations (assignment_id, mentor_id, score, feedback) VALUES (?, ?, ?, ?)',
      [assignment_id, mentor_id, score, feedback]
    );

    // Update assignment status
    await run('UPDATE assignments SET status = ? WHERE id = ?', ['evaluated', assignment_id]);

    // Notify student
    const mod = await get('SELECT title FROM modules WHERE id = ?', [assignment.module_id]);
    await run(
      'INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)',
      [assignment.student_id, `Your assignment "${assignment.title}" for module "${mod.title}" has been evaluated. Score: ${score}/${assignment.max_score}`, 'feedback']
    );

    const evaluation = await get('SELECT * FROM evaluations WHERE id = ?', [result.lastID]);
    res.status(201).json({ success: true, message: 'Evaluation submitted.', data: { evaluation } });
  } catch (err) { next(err); }
};

const getEvaluations = async (req, res, next) => {
  try {
    const { student_id, skill_id, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let sql = `SELECT e.*, a.title as assignment_title, a.student_id,
               u.name as student_name, m.title as module_title, m.max_score,
               s.name as skill_name, mu.name as mentor_name
               FROM evaluations e
               JOIN assignments a ON e.assignment_id = a.id
               JOIN users u ON a.student_id = u.id
               JOIN modules m ON a.module_id = m.id
               JOIN skills s ON m.skill_id = s.id
               JOIN users mu ON e.mentor_id = mu.id WHERE 1=1`;
    const params = [];

    if (req.user.role === 'mentor') { sql += ' AND e.mentor_id = ?'; params.push(req.user.id); }
    if (student_id) { sql += ' AND a.student_id = ?'; params.push(student_id); }
    if (skill_id) { sql += ' AND m.skill_id = ?'; params.push(skill_id); }

    const countSql = sql.replace(
      /SELECT e\.\*.*?FROM evaluations e/s,
      'SELECT COUNT(*) as total FROM evaluations e'
    );
    const { total } = await get(countSql, params);

    sql += ' ORDER BY e.evaluated_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);
    const evaluations = await all(sql, params);
    res.json({ success: true, data: { evaluations, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) } } });
  } catch (err) { next(err); }
};

module.exports = { createEvaluation, getEvaluations };
