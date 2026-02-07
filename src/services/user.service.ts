import { BaseService } from "./base.service";
import User, { IUser } from "../models/User";
import logger from "../config/logger";

export class UserService extends BaseService<IUser> {
  constructor() {
    super(User);
  }

  async getAll(): Promise<IUser[]> {
    return this.findAll({}, { createdAt: -1 });
  }

  async findByEmail(email: string, updateLastLogin = false): Promise<IUser> {
    const normalized = email.trim().toLowerCase();

    if (updateLastLogin) {
      return this.model
        .findOneAndUpdate(
          { email: normalized },
          { lastLogin: new Date() },
          { new: true },
        )
        .orFail();
    }

    return this.model.findOne({ email: normalized }).orFail();
  }

  async createUser(data: Partial<IUser>): Promise<IUser> {
    const payload = {
      ...data,
      email: data.email?.trim().toLowerCase(),
      lastLogin: data.lastLogin ?? new Date(),
    };

    const user = await this.create(payload as IUser);
    logger.info({ userId: user._id, email: user.email }, "User created");
    return user;
  }
}
