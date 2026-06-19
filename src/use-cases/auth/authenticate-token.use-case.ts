import { Injectable } from "@nestjs/common";
import { SessionRepository } from "../../repositories/session.repository";
import type { AuthSession } from "../../interfaces/auth";
import { hashToken, buildUserName, unauthorized } from "../../utils/auth-tokens";

export type AuthenticateTokenInput = { token: string };

@Injectable()
export class AuthenticateTokenUseCase {
  constructor(private readonly sessionRepository: SessionRepository) {}

  async execute(input: AuthenticateTokenInput): Promise<AuthSession> {
    if (!input.token) unauthorized();

    const tokenHash = hashToken(input.token);
    const session = await this.sessionRepository.findByTokenHash(tokenHash);

    if (!session) unauthorized();
    if (session!.revokedAt) unauthorized();
    if (session!.expiresAt.getTime() <= Date.now()) unauthorized();

    return {
      user: {
        userId: session!.user.id,
        email: session!.user.email,
        name: buildUserName(session!.user.name, session!.user.lastName),
      },
      expiresAt: session!.expiresAt,
      sessionToken: input.token,
    };
  }
}
