import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { db } from '../database/init.js';

// JWTトークンを検証するミドルウェア
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'アクセストークンが必要です' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    
    // ユーザー情報をデータベースから取得
    const user = await db.getAsync(
      'SELECT id, email, name, role FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!user) {
      return res.status(401).json({ message: 'ユーザーが見つかりません' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    return res.status(403).json({ message: '無効なトークンです' });
  }
};

// 管理者権限をチェックするミドルウェア
export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: '管理者権限が必要です' });
  }
  next();
};