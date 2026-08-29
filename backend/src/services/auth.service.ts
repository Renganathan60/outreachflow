import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { userRepository } from '../repositories/user.repository.js';
import { config } from '../config/env.js';
import { AppError, UnauthorizedError, ConflictError } from '../utils/errors.js';
import { User, UserRole } from '../types/index.js';

export class AuthService {
  async register(data: { name: string; email: string; password: string; role?: UserRole }) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw new ConflictError('A user with this email address already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const userId = randomUUID();
    const role: UserRole = data.role === 'ADMIN' ? 'ADMIN' : 'SALES_USER';

    await userRepository.create({
      id: userId,
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      passwordHash,
      role
    });

    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('Failed to retrieve user after registration');
    }

    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      },
      token
    };
  }

  async login(credentials: { email: string; password: string }) {
    const user = await userRepository.findByEmail(credentials.email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(credentials.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      },
      token
    };
  }

  private generateToken(user: User): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );
  }
}

export const authService = new AuthService();
