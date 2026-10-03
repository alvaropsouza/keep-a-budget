import type { FuelType } from "../generated/prisma/client/client";

export interface IVehicle {
  id: string;
  userId: string;
  plate: string;
  brand: string;
  model: string;
  yearManufacture: number;
  renavam: string | null;
  chassis: string | null;
  yearModel: number | null;
  color: string | null;
  fuel: FuelType | null;
  currentKm: number | null;
  notes: string | null;
  photoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}
