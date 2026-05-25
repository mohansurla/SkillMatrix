const { run, get, all } = require('../database/db');

const getSkills = async (req, res, next) => {
  try {
    const { category, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    let sql = `SELECT s.*, u.name as created_by_name FROM skills s LEFT JOIN users u ON s.created_by = u.id WHERE 1=1`;
    const params = [];
    if (category) { sql += ' AND s.category = ?'; params.push(category); }
    const countSql = sql.replace('SELECT s.*, u.name as created_by_name', 'SELECT COUNT(*) as total');
    const { total } = await get(countSql, params);
    sql += ' ORDER BY s.name ASC LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);
    const skills = await all(sql, params);
    res.json({ success: true, data: { skills, pagination: { total, page: Number(page), limit: Number(limit) } } });
  } catch (err) { next(err); }
};

const createSkill = async (req, res, next) => {
  try {
    const { name, description, category } = req.body;
    const result = await run(
      'INSERT INTO skills (name, description, category, created_by) VALUES (?, ?, ?, ?)',
      [name, description, category, req.user.id]
    );
    const skill = await get('SELECT * FROM skills WHERE id = ?', [result.lastID]);
    res.status(201).json({ success: true, message: 'Skill created.', data: { skill } });
  } catch (err) { next(err); }
};

const updateSkill = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await get('SELECT id FROM skills WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ success: false, message: 'Skill not found.' });
    const { name, description, category } = req.body;
    const updates = []; const params = [];
    if (name) { updates.push('name = ?'); params.push(name); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (category !== undefined) { updates.push('category = ?'); params.push(category); }
    if (!updates.length) return res.status(400).json({ success: false, message: 'No fields to update.' });
    params.push(id);
    await run(`UPDATE skills SET ${updates.join(', ')} WHERE id = ?`, params);
    const skill = await get('SELECT * FROM skills WHERE id = ?', [id]);
    res.json({ success: true, message: 'Skill updated.', data: { skill } });
  } catch (err) { next(err); }
};

const deleteSkill = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await get('SELECT id FROM skills WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ success: false, message: 'Skill not found.' });
    await run('DELETE FROM skills WHERE id = ?', [id]);
    res.json({ success: true, message: 'Skill deleted.' });
  } catch (err) { next(err); }
};

module.exports = { getSkills, createSkill, updateSkill, deleteSkill };
