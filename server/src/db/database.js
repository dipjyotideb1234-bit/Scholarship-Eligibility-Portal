import initSqlJs from 'sql.js';
import fs from 'node:fs';
import bcrypt from 'bcryptjs';
const databaseFile = new URL('../../scholarships.db', import.meta.url);
const SQL = await initSqlJs();
const raw = fs.existsSync(databaseFile) ? new SQL.Database(fs.readFileSync(databaseFile)) : new SQL.Database();
raw.run('PRAGMA foreign_keys = ON');
function persist() { fs.writeFileSync(databaseFile, Buffer.from(raw.export())); }
function resultRows(sql, values = []) { const stmt = raw.prepare(sql); stmt.bind(values); const rows=[]; while (stmt.step()) rows.push(stmt.getAsObject()); stmt.free(); return rows; }
class Statement {
  constructor(sql) { this.sql=sql; }
  run(...values) { raw.run(this.sql, values); const lastInsertRowid = resultRows('SELECT last_insert_rowid() AS id')[0].id; persist(); return { lastInsertRowid }; }
  get(...values) { return resultRows(this.sql, values)[0]; }
  all(...values) { return resultRows(this.sql, values); }
}
const db = { exec(sql) { raw.run(sql); persist(); }, prepare(sql) { return new Statement(sql); } };
db.exec(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('STUDENT','ADMIN')), created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS student_profiles (id INTEGER PRIMARY KEY, user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE, date_of_birth TEXT, gender TEXT, category TEXT, state TEXT, district TEXT, class_level TEXT, institution TEXT, course TEXT, family_income REAL, annual_percentage REAL, disability_status TEXT, academic_year TEXT, updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS scholarships (id INTEGER PRIMARY KEY, title TEXT NOT NULL, provider TEXT NOT NULL, description TEXT NOT NULL, deadline TEXT NOT NULL, official_notice_url TEXT NOT NULL, status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','INACTIVE')), created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS scholarship_rules (id INTEGER PRIMARY KEY, scholarship_id INTEGER NOT NULL REFERENCES scholarships(id) ON DELETE CASCADE, field TEXT NOT NULL, operator TEXT NOT NULL, value TEXT NOT NULL, label TEXT NOT NULL, description TEXT, required INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS scholarship_documents (id INTEGER PRIMARY KEY, scholarship_id INTEGER NOT NULL REFERENCES scholarships(id) ON DELETE CASCADE, name TEXT NOT NULL, description TEXT, required INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS student_document_checklists (id INTEGER PRIMARY KEY, student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, scholarship_document_id INTEGER NOT NULL REFERENCES scholarship_documents(id) ON DELETE CASCADE, status TEXT DEFAULT 'NOT_READY' CHECK(status IN ('NOT_READY','READY','UPLOADED')), UNIQUE(student_id, scholarship_document_id));
CREATE INDEX IF NOT EXISTS idx_rules_scholarship ON scholarship_rules(scholarship_id); CREATE INDEX IF NOT EXISTS idx_documents_scholarship ON scholarship_documents(scholarship_id);`);

export function seed() {
  // Repair only databases created by the early development seed where rules were
  // accidentally linked to scholarship ID 0. Real scholarship IDs always begin at 1.
  if (db.prepare('SELECT COUNT(*) AS count FROM scholarship_rules WHERE scholarship_id=0').get().count) {
    db.exec('DELETE FROM student_document_checklists; DELETE FROM scholarship_documents; DELETE FROM scholarship_rules; DELETE FROM student_profiles; DELETE FROM scholarships; DELETE FROM users;');
  }
  if (db.prepare('SELECT COUNT(*) AS count FROM users').get().count) return;
  const hash = bcrypt.hashSync('Password123!', 10);
  db.prepare('INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,?)').run('Portal Administrator','admin@example.com',hash,'ADMIN');
  const studentId = db.prepare('INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,?)').run('Demo Student','student@example.com',hash,'STUDENT').lastInsertRowid;
  db.prepare(`INSERT INTO student_profiles(user_id,date_of_birth,gender,category,state,district,class_level,institution,course,family_income,annual_percentage,disability_status,academic_year) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(studentId,'2007-01-15','Female','General','Maharashtra','Pune','12','Demo Senior Secondary School','Science',240000,88,'No',null);
  const add = db.prepare('INSERT INTO scholarships(title,provider,description,deadline,official_notice_url,status) VALUES(?,?,?,?,?,?)');
  const rule = db.prepare('INSERT INTO scholarship_rules(scholarship_id,field,operator,value,label,description,required) VALUES(?,?,?,?,?,?,?)');
  const doc = db.prepare('INSERT INTO scholarship_documents(scholarship_id,name,description,required) VALUES(?,?,?,?)');
  const create = (title, provider, description, deadline, rules) => { const id = add.run(title,provider,description,deadline,'https://example.org/official-notice','ACTIVE').lastInsertRowid; rules.forEach(r=>rule.run(id,...r)); doc.run(id,'Income Certificate','Proof of annual family income',1); doc.run(id,'Latest Marksheet','Most recent academic result',1); return id; };
  create('National Merit Scholarship','Education Foundation','Support for high-performing senior-secondary students.','2026-09-30',[['age','BETWEEN','[18,25]','Age','18 to 25 years',1],['family_income','LESS_THAN_OR_EQUAL','300000','Family income','Annual family income up to ₹3 lakh',1],['class_level','IN','["11","12"]','Class','Class 11 or 12',1]]);
  create('Future Scholars Grant','Learning Trust','Needs class and academic-year information before a final decision.','2026-10-15',[['state','EQUALS','Maharashtra','State','Maharashtra residents',1],['academic_year','EQUALS','2026-27','Academic year','Academic year 2026-27',1]]);
  create('STEM Excellence Award','Science Council','Award for students with strong marks in science programs.','2026-11-01',[['annual_percentage','GREATER_THAN_OR_EQUAL','90','Annual percentage','At least 90%',1],['course','EQUALS','Science','Course','Science course',1]]);
  create('Community Learning Bursary','Community Foundation','Financial aid for qualifying local students.','2026-12-10',[['district','EQUALS','Pune','District','Pune district',1],['family_income','LESS_THAN_OR_EQUAL','250000','Family income','Annual family income up to ₹2.5 lakh',1]]);
  create('Accessible Education Support','Access Alliance','Support for students who declare a disability status.','2027-01-05',[['disability_status','EQUALS','Yes','Disability status','Declared disability status',1]]);
}
export default db;
