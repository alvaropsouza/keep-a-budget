import { Injectable, Logger } from "@nestjs/common";
import type { IUser } from "../../interfaces/user";
import { UserRepository } from "../../repositories/user.repository";

export type GetUserByIdInput = { id: string };

@Injectable()
export class GetUserByIdUseCase {
  private readonly logger = new Logger(GetUserByIdUseCase.name);

  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: GetUserByIdInput): Promise<IUser> {
    this.logger.log({ id: input.id }, "GetUserByIdUseCase.execute");
    const result = await this.userRepository.findById(input.id);
    this.logger.log({ id: result.id }, "GetUserByIdUseCase.execute done");
    return result;
  }
}
