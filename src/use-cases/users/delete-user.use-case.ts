import { Injectable, Logger } from "@nestjs/common";
import type { IUser } from "../../interfaces/user";
import { UserRepository } from "../../repositories/user.repository";

export type DeleteUserInput = { id: string };

@Injectable()
export class DeleteUserUseCase {
  private readonly logger = new Logger(DeleteUserUseCase.name);

  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: DeleteUserInput): Promise<IUser> {
    this.logger.log({ id: input.id }, "DeleteUserUseCase.execute");
    const result = await this.userRepository.delete(input.id);
    this.logger.log({ id: result.id }, "DeleteUserUseCase.execute done");
    return result;
  }
}
