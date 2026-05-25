const { run, get, all } = require('../database/db');

const getModules = async (req, res, next) => {
  try {
    const { skill_id, mentor_id, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let sql = `SELECT m.*, s.name as skill_name, s.category as skill_category,
               u.name as mentor_name FROM modules m
               JOIN skills s ON m.skill_id = s.id
               LEFT JOIN users u ON m.mentor_id = u.id WHERE 1=1`;
    const params = [];
    if (skill_id) { sql += ' AND m.skill_id = ?'; params.push(skill_id); }
    if (mentor_id) { sql += ' AND m.mentor_id = ?'; params.push(mentor_id); }

    // Mentor only sees their own modules
    if (req.user.role === 'mentor') { sql += ' AND m.mentor_id = ?'; params.push(req.user.id); }

    const countSql = sql.replace(
      'SELECT m.*, s.name as skill_name, s.category as skill_category,\n               u.name as mentor_name',
      'SELECT COUNT(*) as total'
    );
    const { total } = await get(countSql, params);
    sql += ' ORDER BY m.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);
    const modules = await all(sql, params);
    res.json({ success: true, data: { modules, pagination: { total, page: Number(page), limit: Number(limit) } } });
  } catch (err) { next(err); }
};

const getModuleById = async (req, res, next) => {
  try {
    const mod = await get(
      `SELECT m.*, s.name as skill_name, u.name as mentor_name FROM modules m
       JOIN skills s ON m.skill_id = s.id
       LEFT JOIN users u ON m.mentor_id = u.id WHERE m.id = ?`,
      [req.params.id]
    );
    if (!mod) return res.status(404).json({ success: false, message: 'Module not found.' });
    res.json({ success: true, data: { module: mod } });
  } catch (err) { next(err); }
};

const createModule = async (req, res, next) => {
  try {
    const { title, description, skill_id, mentor_id, max_score = 100 } = req.body;
    const skill = await get('SELECT id FROM skills WHERE id = ?', [skill_id]);
    if (!skill) return res.status(404).json({ success: false, message: 'Skill not found.' });

    const assignedMentorId = req.user.role === 'mentor' ? req.user.id : mentor_id;
    const result = await run(
      'INSERT INTO modules (title, description, skill_id, mentor_id, max_score) VALUES (?, ?, ?, ?, ?)',
      [title, description, skill_id, assignedMentorId, max_score]
    );
    const mod = await get('SELECT * FROM modules WHERE id = ?', [result.lastID]);
    res.status(201).json({ success: true, message: 'Module created.', data: { module: mod } });
  } catch (err) { next(err); }
};

const updateModule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await get('SELECT * FROM modules WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ success: false, message: 'Module not found.' });
    if (req.user.role === 'mentor' && existing.mentor_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    const { title, description, max_score } = req.body;
    const updates = []; const params = [];
    if (title) { updates.push('title = ?'); params.push(title); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (max_score !== undefined) { updates.push('max_score = ?'); params.push(max_score); }
    if (!updates.length) return res.status(400).json({ success: false, message: 'No fields to update.' });
    params.push(id);
    await run(`UPDATE modules SET ${updates.join(', ')} WHERE id = ?`, params);
    const mod = await get('SELECT * FROM modules WHERE id = ?', [id]);
    res.json({ success: true, message: 'Module updated.', data: { module: mod } });
  } catch (err) { next(err); }
};

const deleteModule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await get('SELECT id FROM modules WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ success: false, message: 'Module not found.' });
    await run('DELETE FROM modules WHERE id = ?', [id]);
    res.json({ success: true, message: 'Module deleted.' });
  } catch (err) { next(err); }
};

module.exports = { getModules, getModuleById, createModule, updateModule, deleteModule };
