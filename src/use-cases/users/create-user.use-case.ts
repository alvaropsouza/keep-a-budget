import { Injectable, Logger } from "@nestjs/common";
import type { IUser } from "../../interfaces/user";
import { UserRepository } from "../../repositories/user.repository";
import { AppError } from "../../utils/app-error";
import { isValidCpf, isValidRg } from "../../utils/br-documents";

export type CreateUserInput = {
  name: string;
  lastName: string;
  email: string;
  phone?: string;
  cpf?: string;
  rg?: string;
  salary?: number;
  avatar?: string;
  lastLogin?: Date;
};

@Injectable()
export class CreateUserUseCase {
  private readonly logger = new Logger(CreateUserUseCase.name);

  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: CreateUserInput): Promise<IUser> {
    this.logger.log({ email: input.email }, "CreateUserUseCase.execute");

    if (input.cpf && !isValidCpf(input.cpf)) throw new AppError("CPF invalido", 400);
    if (input.rg && !isValidRg(input.rg)) throw new AppError("RG invalido", 400);

    const result = await this.userRepository.create(input);
    this.logger.log({ id: result.id }, "CreateUserUseCase.execute done");
    return result;
  }
}
