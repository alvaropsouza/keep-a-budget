import { Injectable, Logger } from "@nestjs/common";
import type { IUser } from "../../interfaces/user";
import { UserRepository } from "../../repositories/user.repository";

export type GetUserByEmailInput = { email: string; updateLastLogin?: boolean };

@Injectable()
export class GetUserByEmailUseCase {
  private readonly logger = new Logger(GetUserByEmailUseCase.name);

  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: GetUserByEmailInput): Promise<IUser> {
    this.logger.log({ email: input.email }, "GetUserByEmailUseCase.execute");
    const result = await this.userRepository.findByEmail(input.email, input.updateLastLogin);
    this.logger.log({ id: result.id }, "GetUserByEmailUseCase.execute done");
    return result;
  }
}
