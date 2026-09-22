import { test } from "node:test";
import assert from "node:assert/strict";
import { DeleteUserUseCase } from "../../src/use-cases/users/delete-user.use-case";
import type { UserRepository } from "../../src/repositories/user.repository";
import type { ExpenseRepository } from "../../src/repositories/expense.repository";
import type { IrDocumentRepository } from "../../src/repositories/ir-document.repository";
import type { VehicleRevisionRepository } from "../../src/repositories/vehicle-revision.repository";
import type { S3Service } from "../../src/services/s3.service";
import type { IUser } from "../../src/interfaces/user";

const buildUseCase = (keys: { receipts: string[]; ir: string[]; revisions: string[] }) => {
  const deletedObjects: string[][] = [];
  const order: string[] = [];

  const userRepository = {
    delete: async (id: string) => {
      order.push("user-deleted");
      return { id } as IUser;
    },
  } as unknown as UserRepository;

  const expenseRepository = {
    findReceiptKeysByUser: async () => keys.receipts,
  } as unknown as ExpenseRepository;

  const irDocumentRepository = {
    findReceiptKeysByUser: async () => keys.ir,
  } as unknown as IrDocumentRepository;

  const revisionRepository = {
    findFileKeysByUser: async () => keys.revisions,
  } as unknown as VehicleRevisionRepository;

  const s3Service = {
    deleteObjects: async (objectKeys: string[]) => {
      order.push("files-deleted");
      deletedObjects.push(objectKeys);
    },
  } as unknown as S3Service;

  return {
    useCase: new DeleteUserUseCase(
      userRepository,
      expenseRepository,
      irDocumentRepository,
      revisionRepository,
      s3Service,
    ),
    deletedObjects,
    order,
  };
};

test("deleting an account wipes every stored file of that user", async () => {
  const { useCase, deletedObjects, order } = buildUseCase({
    receipts: ["nota.pdf"],
    ir: ["ir/recibo.pdf"],
    revisions: ["carro/os.jpg"],
  });

  await useCase.execute({ id: "user-1" });

  assert.deepEqual(deletedObjects, [["nota.pdf", "ir/recibo.pdf", "carro/os.jpg"]]);
  assert.deepEqual(order, ["user-deleted", "files-deleted"]);
});

test("an account without files touches no storage", async () => {
  const { useCase, deletedObjects } = buildUseCase({ receipts: [], ir: [], revisions: [] });

  await useCase.execute({ id: "user-1" });

  assert.deepEqual(deletedObjects, []);
});
