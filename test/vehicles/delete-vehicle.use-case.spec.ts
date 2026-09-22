import { test } from "node:test";
import assert from "node:assert/strict";
import { DeleteVehicleUseCase } from "../../src/use-cases/vehicles/delete-vehicle.use-case";
import type { VehicleRepository } from "../../src/repositories/vehicle.repository";
import type { VehicleRevisionRepository } from "../../src/repositories/vehicle-revision.repository";
import type { S3Service } from "../../src/services/s3.service";
import type { IVehicle } from "../../src/interfaces/vehicle";
import type { IVehicleRevision } from "../../src/interfaces/vehicle-revision";

const buildUseCase = (vehicle: IVehicle | null, revisions: IVehicleRevision[]) => {
  const deletedVehicles: string[] = [];
  const deletedObjects: string[][] = [];

  const vehicleRepository = {
    findById: async () => vehicle,
    delete: async (id: string) => {
      deletedVehicles.push(id);
    },
  } as unknown as VehicleRepository;

  const revisionRepository = {
    findMany: async () => revisions,
  } as unknown as VehicleRevisionRepository;

  const s3Service = {
    deleteObjects: async (keys: string[]) => {
      deletedObjects.push(keys);
    },
  } as unknown as S3Service;

  return {
    useCase: new DeleteVehicleUseCase(vehicleRepository, revisionRepository, s3Service),
    deletedVehicles,
    deletedObjects,
  };
};

const vehicle = { id: "veh-1", userId: "user-1" } as IVehicle;

test("deleting a vehicle removes the files of its revisions", async () => {
  const { useCase, deletedVehicles, deletedObjects } = buildUseCase(vehicle, [
    { id: "rev-1", files: ["a.pdf", "b.jpg"] } as IVehicleRevision,
    { id: "rev-2", files: ["c.pdf"] } as IVehicleRevision,
  ]);

  await useCase.execute({ id: "veh-1", userId: "user-1" });

  assert.deepEqual(deletedVehicles, ["veh-1"]);
  assert.deepEqual(deletedObjects, [["a.pdf", "b.jpg", "c.pdf"]]);
});

test("a vehicle from another user is not deleted", async () => {
  const { useCase, deletedVehicles, deletedObjects } = buildUseCase(vehicle, []);

  await assert.rejects(useCase.execute({ id: "veh-1", userId: "intruder" }), /Unauthorized/);

  assert.deepEqual(deletedVehicles, []);
  assert.deepEqual(deletedObjects, []);
});
