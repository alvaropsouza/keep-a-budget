import { Injectable } from "@nestjs/common";
import { prisma } from "../config/prisma";
import type { IVehicleRevision } from "../interfaces/vehicle-revision";
import type { CreateVehicleRevisionDto } from "../dto/vehicle-revision.dto";

const mapRevision = (row: {
  id: string;
  vehicleId: string;
  date: Date;
  km: number | null;
  description: string | null;
  files: string[];
  createdAt: Date;
  updatedAt: Date;
}): IVehicleRevision => ({
  id: row.id,
  vehicleId: row.vehicleId,
  date: row.date,
  km: row.km,
  description: row.description,
  files: row.files,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

@Injectable()
export class VehicleRevisionRepository {
  async findMany(vehicleId: string): Promise<IVehicleRevision[]> {
    const rows = await prisma.vehicleRevision.findMany({
      where: { vehicleId },
      orderBy: { date: "desc" },
    });
    return rows.map(mapRevision);
  }

  async findById(id: string): Promise<IVehicleRevision | null> {
    const row = await prisma.vehicleRevision.findUnique({ where: { id } });
    return row ? mapRevision(row) : null;
  }

  async create(vehicleId: string, data: CreateVehicleRevisionDto): Promise<IVehicleRevision> {
    const row = await prisma.vehicleRevision.create({
      data: {
        vehicleId,
        date: new Date(data.date),
        km: data.km ?? null,
        description: data.description ?? null,
        files: [],
      },
    });
    return mapRevision(row);
  }

  async appendFiles(id: string, s3Keys: string[]): Promise<IVehicleRevision> {
    const existing = await prisma.vehicleRevision.findUniqueOrThrow({ where: { id } });
    const row = await prisma.vehicleRevision.update({
      where: { id },
      data: { files: [...existing.files, ...s3Keys] },
    });
    return mapRevision(row);
  }

  async removeFile(id: string, s3Key: string): Promise<IVehicleRevision> {
    const existing = await prisma.vehicleRevision.findUniqueOrThrow({ where: { id } });
    const row = await prisma.vehicleRevision.update({
      where: { id },
      data: { files: existing.files.filter((f) => f !== s3Key) },
    });
    return mapRevision(row);
  }

  async delete(id: string): Promise<IVehicleRevision | null> {
    const row = await prisma.vehicleRevision.delete({ where: { id } }).catch(() => null);
    return row ? mapRevision(row) : null;
  }
}
