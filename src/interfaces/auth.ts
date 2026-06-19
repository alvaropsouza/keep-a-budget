export type AuthUser = {
  userId: string;
  email: string;
  name?: string;
};

export type AuthSession = {
  user: AuthUser;
  expiresAt: Date;
  sessionToken: string;
};

export type SessionContext = {
  userAgent?: string;
  ipAddress?: string;
  deviceId?: string;
};

export type SessionSummary = {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
  current: boolean;
};
