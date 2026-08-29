import { userRepository } from '../repositories/user.repository.js';
import { NotFoundError } from '../utils/errors.js';
import { User, UserRole } from '../types/index.js';

export class UserService {
  async getAllUsers(): Promise<User[]> {
    return userRepository.findAll();
  }

  async getUserById(id: string): Promise<User> {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User');
    }
    return user;
  }

  async updateUserRole(id: string, role: UserRole): Promise<User> {
    const user = await this.getUserById(id);
    await userRepository.update(id, { role });
    return this.getUserById(id);
  }

  async deleteUser(id: string): Promise<void> {
    await this.getUserById(id);
    await userRepository.delete(id);
  }
}

export const userService = new UserService();
