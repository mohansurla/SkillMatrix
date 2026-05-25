const { run, get, all } = require('../database/db');
const bcrypt = require('bcryptjs');

const getUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let sql = 'SELECT id, name, email, role, avatar_url, bio, created_at FROM users WHERE 1=1';
    const params = [];

    if (role) { sql += ' AND role = ?'; params.push(role); }

    const countSql = sql.replace('SELECT id, name, email, role, avatar_url, bio, created_at', 'SELECT COUNT(*) as total');
    const { total } = await get(countSql, params);

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);

    const users = await all(sql, params);
    res.json({ success: true, data: { users, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) } } });
  } catch (err) { next(err); }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await get('SELECT id, name, email, role, avatar_url, bio, created_at FROM users WHERE id = ?', [req.params.id]);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: { user } });
  } catch (err) { next(err); }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Only self or admin can update
    if (req.user.id !== Number(id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    const { name, bio, avatar_url, password } = req.body;
    const updates = [];
    const params = [];
    if (name) { updates.push('name = ?'); params.push(name); }
    if (bio !== undefined) { updates.push('bio = ?'); params.push(bio); }
    if (avatar_url !== undefined) { updates.push('avatar_url = ?'); params.push(avatar_url); }
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      updates.push('password_hash = ?');
      params.push(hash);
    }
    if (!updates.length) return res.status(400).json({ success: false, message: 'No fields to update.' });
    params.push(id);
    await run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    const user = await get('SELECT id, name, email, role, avatar_url, bio, created_at FROM users WHERE id = ?', [id]);
    res.json({ success: true, message: 'Profile updated.', data: { user } });
  } catch (err) { next(err); }
};

const getMentors = async (req, res, next) => {
  try {
    const mentors = await all('SELECT id, name, email, avatar_url, bio FROM users WHERE role = ?', ['mentor']);
    res.json({ success: true, data: { mentors } });
  } catch (err) { next(err); }
};

const assignMentorToStudent = async (req, res, next) => {
  try {
    const { mentor_id, student_id } = req.body;
    const mentor = await get('SELECT id FROM users WHERE id = ? AND role = ?', [mentor_id, 'mentor']);
    if (!mentor) return res.status(404).json({ success: false, message: 'Mentor not found.' });
    const student = await get('SELECT id FROM users WHERE id = ? AND role = ?', [student_id, 'student']);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    const existing = await get('SELECT id FROM mentor_students WHERE student_id = ?', [student_id]);
    if (existing) {
      await run('UPDATE mentor_students SET mentor_id = ? WHERE student_id = ?', [mentor_id, student_id]);
    } else {
      await run('INSERT INTO mentor_students (mentor_id, student_id) VALUES (?, ?)', [mentor_id, student_id]);
    }
    res.json({ success: true, message: 'Mentor assigned to student.' });
  } catch (err) { next(err); }
};

const getMentorStudents = async (req, res, next) => {
  try {
    const mentorId = req.user.role === 'admin' ? req.query.mentor_id : req.user.id;
    const students = await all(
      `SELECT u.id, u.name, u.email, u.avatar_url, ms.assigned_at
       FROM mentor_students ms
       JOIN users u ON ms.student_id = u.id
       WHERE ms.mentor_id = ?`,
      [mentorId]
    );
    res.json({ success: true, data: { students } });
  } catch (err) { next(err); }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await get('SELECT id FROM users WHERE id = ?', [id]);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    await run('DELETE FROM users WHERE id = ?', [id]);
    res.json({ success: true, message: 'User deleted.' });
  } catch (err) { next(err); }
};

module.exports = { getUsers, getUserById, updateUser, getMentors, assignMentorToStudent, getMentorStudents, deleteUser };
