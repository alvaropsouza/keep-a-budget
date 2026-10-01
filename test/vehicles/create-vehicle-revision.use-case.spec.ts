import { test } from "node:test";
import assert from "node:assert/strict";
import { CreateVehicleRevisionUseCase } from "../../src/use-cases/vehicles/create-vehicle-revision.use-case";
import type { VehicleRepository } from "../../src/repositories/vehicle.repository";
import type { VehicleRevisionRepository } from "../../src/repositories/vehicle-revision.repository";
import type { S3Service } from "../../src/services/s3.service";
import type { IVehicle } from "../../src/interfaces/vehicle";
import type { IVehicleRevision } from "../../src/interfaces/vehicle-revision";
import type { MultipartFile } from "../../src/utils/read-multipart";

const pdf = { buffer: Buffer.from("%PDF-1.4 test"), filename: "nota.pdf" } as MultipartFile;
const notAnImage = { buffer: Buffer.from("definitely not a file"), filename: "x.heic" } as MultipartFile;

const buildUseCase = (uploadFails: boolean) => {
  const created: string[] = [];
  const deletedRevisions: string[] = [];
  const deletedObjects: string[] = [];
  let uploads = 0;

  const vehicleRepository = {
    findById: async () => ({ id: "veh-1", userId: "user-1" }) as IVehicle,
  } as unknown as VehicleRepository;

  const revisionRepository = {
    create: async () => {
      created.push("rev-1");
      return { id: "rev-1", files: [] } as unknown as IVehicleRevision;
    },
    appendFiles: async (_id: string, keys: string[]) => ({ id: "rev-1", files: keys }) as unknown as IVehicleRevision,
    delete: async (id: string) => {
      deletedRevisions.push(id);
      return null;
    },
  } as unknown as VehicleRevisionRepository;

  const s3Service = {
    upload: async () => {
      uploads += 1;
      if (uploadFails && uploads === 2) throw new Error("s3 down");
      return `key-${uploads}`;
    },
    deleteObject: async (key: string) => {
      deletedObjects.push(key);
    },
  } as unknown as S3Service;

  return {
    useCase: new CreateVehicleRevisionUseCase(vehicleRepository, revisionRepository, s3Service),
    created,
    deletedRevisions,
    deletedObjects,
  };
};

const input = (files: MultipartFile[]) => ({
  vehicleId: "veh-1",
  userId: "user-1",
  data: { date: "2026-09-17" },
  files,
});

test("an invalid file is rejected before the revision is created", async () => {
  const { useCase, created } = buildUseCase(false);

  await assert.rejects(useCase.execute(input([pdf, notAnImage])));

  assert.deepEqual(created, []);
});

test("a failed upload rolls back the revision and uploaded files", async () => {
  const { useCase, created, deletedRevisions, deletedObjects } = buildUseCase(true);

  await assert.rejects(useCase.execute(input([pdf, pdf])), /s3 down/);

  assert.deepEqual(created, ["rev-1"]);
  assert.deepEqual(deletedRevisions, ["rev-1"]);
  assert.deepEqual(deletedObjects, ["key-1"]);
});
