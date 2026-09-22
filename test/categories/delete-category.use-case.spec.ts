import { test } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../../src/config/prisma";
import { DeleteCategoryUseCase } from "../../src/use-cases/categories/delete-category.use-case";
import type { CategoryRepository } from "../../src/repositories/category.repository";
import type { Category } from "../../src/generated/prisma/client/client";

type TransactionRunner = <T>(operation: (tx: unknown) => Promise<T>) => Promise<T>;

const runInline: TransactionRunner = (operation) => operation({});
Object.defineProperty(prisma, "$transaction", { value: runInline, configurable: true });

const buildUseCase = (category: Category) => {
  const renames: Array<[string, string]> = [];
  const deleted: string[] = [];
  const hidden: string[] = [];

  const categoryRepository = {
    findById: async () => category,
    ensureExists: async () => category,
    renameUsages: async (_userId: string, oldName: string, newName: string) => {
      renames.push([oldName, newName]);
    },
    delete: async (id: string) => {
      deleted.push(id);
      return category;
    },
    update: async (id: string) => {
      hidden.push(id);
      return category;
    },
  } as unknown as CategoryRepository;

  return { useCase: new DeleteCategoryUseCase(categoryRepository), renames, deleted, hidden };
};

test("deleting a custom category moves its usages to Outros", async () => {
  const { useCase, renames, deleted } = buildUseCase({
    id: "cat-1",
    userId: "user-1",
    name: "Mercado",
    isDefault: false,
  } as Category);

  await useCase.execute({ id: "cat-1", userId: "user-1" });

  assert.deepEqual(renames, [["Mercado", "Outros"]]);
  assert.deepEqual(deleted, ["cat-1"]);
});

test("hiding a default category keeps its usages untouched", async () => {
  const { useCase, renames, deleted, hidden } = buildUseCase({
    id: "cat-2",
    userId: "user-1",
    name: "Lazer",
    isDefault: true,
  } as Category);

  await useCase.execute({ id: "cat-2", userId: "user-1" });

  assert.deepEqual(renames, []);
  assert.deepEqual(deleted, []);
  assert.deepEqual(hidden, ["cat-2"]);
});
