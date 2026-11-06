import jwt from 'jsonwebtoken';
import User from '../models/User.js';
export async function protect(req, res, next) { try { const token = req.cookies.token; if (!token) return res.status(401).json({ message: 'Authentication required' }); const { userId } = jwt.verify(token, process.env.JWT_SECRET); const user = await User.findById(userId); if (!user) return res.status(401).json({ message: 'User no longer exists' }); req.user = user; next(); } catch { res.status(401).json({ message: 'Invalid or expired session' }); } }
export const authorize = (...roles) => (req, res, next) => roles.includes(req.user.role) ? next() : res.status(403).json({ message: 'You do not have permission for this action' });
