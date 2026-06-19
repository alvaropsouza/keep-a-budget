import { Injectable, Logger } from "@nestjs/common";
import type { IUser } from "../../interfaces/user";
import { UserRepository } from "../../repositories/user.repository";
import { AppError } from "../../utils/app-error";
import { isValidCpf, isValidRg } from "../../utils/br-documents";

export type UpdateUserInput = {
  id: string;
  name?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  cpf?: string | null;
  rg?: string | null;
  salary?: number | null;
  avatar?: string;
  lastLogin?: Date;
};

@Injectable()
export class UpdateUserUseCase {
  private readonly logger = new Logger(UpdateUserUseCase.name);

  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: UpdateUserInput): Promise<IUser> {
    this.logger.log({ id: input.id }, "UpdateUserUseCase.execute");

    if (input.cpf != null && !isValidCpf(input.cpf)) throw new AppError("CPF invalido", 400);
    if (input.rg != null && !isValidRg(input.rg)) throw new AppError("RG invalido", 400);

    const { id, ...data } = input;
    const result = await this.userRepository.update(id, data);
    this.logger.log({ id: result.id }, "UpdateUserUseCase.execute done");
    return result;
  }
}
