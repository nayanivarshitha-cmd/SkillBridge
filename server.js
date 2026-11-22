const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const pdf = require('pdf-parse/lib/pdf-parse.js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

// ---- Persistent storage: a JSON file (data/db.json) ----
const FILE = path.join(__dirname, 'data', 'db.json');
fs.mkdirSync(path.dirname(FILE), { recursive: true });
let db = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : { users: [], data: {} };
const persist = () => { fs.writeFileSync(FILE + '.tmp', JSON.stringify(db)); fs.renameSync(FILE + '.tmp', FILE); };

// Seed the admin account on first run
if (!db.users.some(u => u.role === 'admin')) {
  db.users.push({
    id: crypto.randomUUID(), name: 'Administrator',
    email: process.env.ADMIN_EMAIL || 'admin@skillbridge.edu',
    hash: bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'Admin@123', 10),
    role: 'admin', joined: Date.now()
  });
  persist();
}

// ---- Demo / dummy data (re-created automatically if missing, e.g. after a restart) ----
function seedDemo() {
  if (db.users.some(u => u.email === 'demo@skillbridge.edu')) return;
  const day = 864e5, id = () => crypto.randomUUID();
  const mkUser = (name, email, pw, ago) => { const u = { id: id(), name, email, hash: bcrypt.hashSync(pw, 10), role: 'student', joined: Date.now() - ago * day }; db.users.push(u); return u; };
  const sk = (n, c, l, p, g) => ({ id: id(), t: Date.now(), n, c, l, p, g });
  const ce = (n, o, d) => ({ id: id(), n, o, d });
  const note = 'Note: this is fictional sample content created for demonstration of the platform only and reports no real study. ';
  const t1 = note + [
    'Many colleges struggle to identify students who are at risk of failing early enough to offer support.',
    'The main problem is that teachers usually notice poor performance only after the final examination results are published.',
    'This study aims to build a simple model that predicts end-of-semester performance from attendance and assignment data.',
    'The objective is to give advisors an early warning that is easy to understand and act upon.',
    'We collected records of 200 fictional students across four courses for this demonstration paper.',
    'The method uses a decision tree classifier trained on attendance, assignment scores and quiz marks.',
    'Data was split into a training set and a test set using an eighty to twenty ratio.',
    'The decision tree and a baseline logistic regression model were compared using accuracy and recall.',
    'Python and the scikit-learn library were used to implement the experiment.',
    'The decision tree achieved an accuracy of 82 percent on the test set in this fictional experiment.',
    'Logistic regression reached 76 percent accuracy, so the decision tree performed better on these demo data.',
    'Attendance in the first six weeks was found to be the most important predictor of final performance.',
    'Students who submitted all early assignments were far less likely to be flagged as at risk.',
    'A limitation of this work is that the dataset is small and comes from only four courses.',
    'The model also cannot explain why a student is struggling, which limits how advisors can respond.',
    'Future research could extend the approach to larger datasets from several departments.',
    'Further work should also test whether early alerts actually improve final grades.',
    'In conclusion, simple models based on attendance and assignments can give useful early warnings.'].join(' ');
  const t2 = note + [
    'Students often forget most of what they study within a few days when they revise only once before an examination.',
    'The problem is that cramming gives short-term recall but weak long-term retention of important concepts.',
    'This paper aims to examine whether spaced repetition improves retention compared with massed study sessions.',
    'The objective is to measure recall after one week and after one month for both study methods.',
    'Participants were fictional volunteers divided randomly into two groups of thirty students each.',
    'The methodology required the first group to study in one long session while the second group used three short spaced sessions.',
    'Recall was measured with a fifty question quiz that was conducted one week and one month after studying.',
    'Responses were analysed using an independent samples t-test to compare the average scores of the two groups.',
    'The spaced group scored an average of 74 percent after one month compared with 52 percent for the massed group.',
    'The difference was statistically significant in this demonstration, showing a clear advantage for spaced study.',
    'Students in the spaced group also reported feeling more confident before the final quiz.',
    'One limitation is that the participants were all from the same year and subject area.',
    'Motivation was not controlled, so some of the difference may come from the extra effort of the spaced group.',
    'Future research could test spaced repetition with digital flashcard applications and different subjects.',
    'Further studies might also compare different spacing intervals to find the most effective schedule.',
    'Overall, spaced repetition appears to be a practical technique that students can adopt easily.'].join(' ');
  const p1 = id(), p2 = id();
  const demo = mkUser('Demo Student', 'demo@skillbridge.edu', 'Demo@123', 30);
  db.data[demo.id] = {
    skills: [sk('Python', 'Programming', 'Intermediate', 70, 'Build a REST API by December'), sk('Machine Learning', 'AI', 'Beginner', 45, 'Finish an online ML course'),
      sk('Public Speaking', 'Communication', 'Intermediate', 100, 'Present a project in class'), sk('SQL and Databases', 'Technical', 'Advanced', 85, 'Practice joins and indexing'),
      sk('Research Writing', 'Research', 'Beginner', 30, 'Write a first literature review'), sk('UI Design', 'Design', 'Beginner', 15, 'Learn basics of Figma')],
    certs: [ce('Python for Everybody', 'Coursera', '2026-03-12'), ce('Introduction to Machine Learning', 'NPTEL', '2026-07-05'), ce('Effective Communication', 'LinkedIn Learning', '2026-09-20')],
    papers: [
      { id: p1, title: 'Sample Paper: Predicting Student Performance with Machine Learning', authors: 'Fictional Authors (demo data)', year: '2024', kw: 'machine learning, student performance, decision tree, early warning', text: t1, notes: 'Demo note: compare this with the attendance data used in our class project.', hl: ['Attendance in the first six weeks'], pages: 8, t: Date.now() - 2 * day, saved: null },
      { id: p2, title: 'Sample Paper: Effects of Spaced Repetition on Learning', authors: 'Fictional Authors (demo data)', year: '2023', kw: 'spaced repetition, memory, retention, study methods', text: t2, notes: '', hl: [], pages: 6, t: Date.now() - day, saved: null }],
    acts: [{ t: Date.now() - 3600e3, m: 'Uploaded paper: Sample Paper: Effects of Spaced Repetition on Learning' }, { t: Date.now() - 7200e3, m: 'Progress on Python: 70%' }, { t: Date.now() - 86400e3, m: 'Added certification: Effective Communication' }, { t: Date.now() - 2 * 86400e3, m: 'Added skill: Machine Learning' }],
    viewed: [p2, p1] };
  [['Aarav Sharma', 'aarav@example.com', 12, [sk('Java', 'Programming', 'Intermediate', 60, ''), sk('Teamwork', 'Communication', 'Advanced', 90, '')]],
   ['Priya Reddy', 'priya@example.com', 8, [sk('Data Analysis', 'AI', 'Beginner', 40, ''), sk('Excel', 'Technical', 'Intermediate', 75, ''), sk('Statistics', 'Research', 'Beginner', 25, '')]],
   ['Rahul Verma', 'rahul@example.com', 3, [sk('Web Development', 'Programming', 'Beginner', 35, '')]]].forEach(([n, e, ago, skills]) => {
    const u = mkUser(n, e, 'Demo@123', ago); db.data[u.id] = { skills, certs: [], papers: [], acts: [], viewed: [] }; });
  persist();
}
seedDemo();

app.use(express.json({ limit: '50mb' }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-this-secret-in-production',
  resave: false, saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 24 * 60 * 60 * 1000 }
}));

const pub = u => ({ id: u.id, name: u.name, email: u.email, role: u.role });
const blank = () => ({ skills: [], certs: [], papers: [], acts: [], viewed: [] });

// Route guard: requires a logged-in user, optionally of a given role
const guard = role => (req, res, next) => {
  const u = db.users.find(x => x.id === req.session.uid);
  if (!u || (role && u.role !== role)) return res.status(401).json({ error: 'Not authorised' });
  req.user = u; next();
};

app.post('/api/register', async (req, res) => {
  const name = String(req.body.name || '').trim(), email = String(req.body.email || '').trim().toLowerCase(), password = String(req.body.password || '');
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 6)
    return res.status(400).json({ error: 'Enter a name, valid email and a password of 6+ characters' });
  if (db.users.some(u => u.email === email)) return res.status(409).json({ error: 'This email is already registered' });
  const u = { id: crypto.randomUUID(), name, email, hash: await bcrypt.hash(password, 10), role: 'student', joined: Date.now() };
  db.users.push(u); db.data[u.id] = blank(); persist();
  req.session.uid = u.id;
  res.json({ user: pub(u), data: db.data[u.id] });
});

app.post('/api/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase(), password = String(req.body.password || '');
  const wantAdmin = req.body.role === 'admin';
  const u = db.users.find(x => x.email === email);
  if (!u || !(await bcrypt.compare(password, u.hash)) || wantAdmin !== (u.role === 'admin'))
    return res.status(401).json({ error: 'Invalid credentials for this login type' });
  req.session.uid = u.id;
  res.json({ user: pub(u), data: u.role === 'admin' ? blank() : (db.data[u.id] || blank()) });
});

app.post('/api/logout', (req, res) => req.session.destroy(() => res.json({ ok: true })));

app.get('/api/me', guard(), (req, res) =>
  res.json({ user: pub(req.user), data: req.user.role === 'admin' ? blank() : (db.data[req.user.id] || blank()) }));

// Students can only read/write their OWN data (the id comes from the session, never from the request)
app.put('/api/data', guard('student'), (req, res) => {
  const b = req.body || {}, d = blank();
  for (const k of Object.keys(d)) if (Array.isArray(b[k])) d[k] = b[k];
  db.data[req.user.id] = d; persist();
  res.json({ ok: true });
});

// Real PDF text extraction on the server
app.post('/api/extract', guard('student'), upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const r = await pdf(req.file.buffer, { max: 80 });
    const t = (r.text || '').replace(/-\n(?=[a-z])/g, '').replace(/[ \t]+/g, ' ').trim();
    res.json({ t, first: t.slice(0, 3000), info: r.info || {}, pages: r.numpages });
  } catch (e) { res.status(422).json({ error: 'Could not read this PDF: ' + e.message }); }
});

// Admin only
app.get('/api/admin/users', guard('admin'), (req, res) => {
  const g = id => db.data[id] || blank();
  res.json({ users: db.users.filter(u => u.role === 'student').map(u => ({
    id: u.id, name: u.name, email: u.email, joined: u.joined,
    skills: g(u.id).skills.length, certs: g(u.id).certs.length, papers: g(u.id).papers.length })) });
});
app.delete('/api/admin/users/:id', guard('admin'), (req, res) => {
  const u = db.users.find(x => x.id === req.params.id && x.role === 'student');
  if (!u) return res.status(404).json({ error: 'Student not found' });
  db.users = db.users.filter(x => x.id !== u.id); delete db.data[u.id]; persist();
  res.json({ ok: true });
});

app.use(express.static(path.join(__dirname, 'public')));
app.use((err, req, res, next) => res.status(500).json({ error: err.message || 'Server error' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`SkillBridge running at http://localhost:${PORT}`));
