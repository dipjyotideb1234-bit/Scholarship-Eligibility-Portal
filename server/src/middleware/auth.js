import jwt from 'jsonwebtoken';
const secret = process.env.JWT_SECRET || 'development-only-secret-change-me';
export const issueToken = user => jwt.sign({ id: user.id, role: user.role, name: user.name }, secret, { expiresIn: '8h' });
export function auth(req,res,next) { const token = req.headers.authorization?.replace('Bearer ',''); if (!token) return res.status(401).json({ error:'Authentication required' }); try { req.user=jwt.verify(token,secret); next(); } catch { res.status(401).json({error:'Invalid or expired session'}); } }
export const adminOnly = (req,res,next) => req.user.role === 'ADMIN' ? next() : res.status(403).json({error:'Administrator access required'});
