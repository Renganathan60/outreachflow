import { query } from '../config/db.js';
import { User } from '../types/index.js';

export class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const rows = await query<User[]>(
      'SELECT id, name, email, passwordHash, role, createdAt, updatedAt FROM users WHERE email = ? LIMIT 1',
      [email.toLowerCase().trim()]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async findById(id: string): Promise<User | null> {
    const rows = await query<User[]>(
      'SELECT id, name, email, role, createdAt, updatedAt FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async findAll(): Promise<User[]> {
    return query<User[]>(
      'SELECT id, name, email, role, createdAt, updatedAt FROM users ORDER BY createdAt DESC'
    );
  }

  async create(user: { id: string; name: string; email: string; passwordHash: string; role: string }): Promise<void> {
    await query(
      'INSERT INTO users (id, name, email, passwordHash, role) VALUES (?, ?, ?, ?, ?)',
      [user.id, user.name, user.email.toLowerCase().trim(), user.passwordHash, user.role]
    );
  }

  async update(id: string, updates: Partial<User>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.role) {
      fields.push('role = ?');
      values.push(updates.role);
    }
    if (updates.passwordHash) {
      fields.push('passwordHash = ?');
      values.push(updates.passwordHash);
    }

    if (fields.length === 0) return;

    values.push(id);
    await query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
  }

  async delete(id: string): Promise<void> {
    await query('DELETE FROM users WHERE id = ?', [id]);
  }
}

export const userRepository = new UserRepository();
