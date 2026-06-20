import { Injectable } from "@nestjs/common";
import { Prisma } from "../generated/prisma/client/client";
import { prisma } from "../config/prisma";
import type { IVehicle } from "../interfaces/vehicle";
import type { CreateVehicleDto, UpdateVehicleDto } from "../dto/vehicle.dto";

const mapVehicle = (row: Prisma.VehicleGetPayload<true>): IVehicle => ({
  id: row.id,
  userId: row.userId,
  plate: row.plate,
  brand: row.brand,
  model: row.model,
  yearManufacture: row.yearManufacture,
  renavam: row.renavam,
  chassis: row.chassis,
  yearModel: row.yearModel,
  color: row.color,
  fuel: row.fuel,
  ipvaExpiry: row.ipvaExpiry,
  ipvaValue: row.ipvaValue !== null ? Number(row.ipvaValue) : null,
  insuranceExpiry: row.insuranceExpiry,
  licensingExpiry: row.licensingExpiry,
  currentKm: row.currentKm,
  lastServiceDate: row.lastServiceDate,
  nextOilChangeKm: row.nextOilChangeKm,
  notes: row.notes,
  photoUrl: row.photoUrl,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

@Injectable()
export class VehicleRepository {
  async findMany(userId: string): Promise<IVehicle[]> {
    const rows = await prisma.vehicle.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(mapVehicle);
  }

  async findById(id: string): Promise<IVehicle | null> {
    const row = await prisma.vehicle.findUnique({ where: { id } });
    return row ? mapVehicle(row) : null;
  }

  async create(userId: string, data: CreateVehicleDto): Promise<IVehicle> {
    const row = await prisma.vehicle.create({
      data: {
        userId,
        plate: data.plate,
        brand: data.brand,
        model: data.model,
        yearManufacture: data.yearManufacture,
        renavam: data.renavam ?? null,
        chassis: data.chassis ?? null,
        yearModel: data.yearModel ?? null,
        color: data.color ?? null,
        fuel: data.fuel ?? null,
        ipvaExpiry: data.ipvaExpiry ?? null,
        ipvaValue: data.ipvaValue ?? null,
        insuranceExpiry: data.insuranceExpiry ?? null,
        licensingExpiry: data.licensingExpiry ?? null,
        currentKm: data.currentKm ?? null,
        lastServiceDate: data.lastServiceDate ?? null,
        nextOilChangeKm: data.nextOilChangeKm ?? null,
        notes: data.notes ?? null,
        photoUrl: data.photoUrl ?? null,
      },
    });
    return mapVehicle(row);
  }

  async update(id: string, data: UpdateVehicleDto): Promise<IVehicle | null> {
    const row = await prisma.vehicle.update({ where: { id }, data }).catch(() => null);
    return row ? mapVehicle(row) : null;
  }

  async delete(id: string): Promise<IVehicle | null> {
    const row = await prisma.vehicle.delete({ where: { id } }).catch(() => null);
    return row ? mapVehicle(row) : null;
  }
}
