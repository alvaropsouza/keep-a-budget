export interface IUser {
  id: string;
  _id: string;
  name: string;
  lastName: string;
  email: string;
  phone?: string;
  salary?: number;
  avatar?: string;
  lastLogin?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
