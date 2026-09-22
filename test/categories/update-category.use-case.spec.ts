import { test } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../../src/config/prisma";
import { UpdateCategoryUseCase } from "../../src/use-cases/categories/update-category.use-case";
import type { CategoryRepository } from "../../src/repositories/category.repository";
import type { Category } from "../../src/generated/prisma/client/client";

type TransactionRunner = <T>(operation: (tx: unknown) => Promise<T>) => Promise<T>;

const runInline: TransactionRunner = (operation) => operation({});
Object.defineProperty(prisma, "$transaction", { value: runInline, configurable: true });

const existing = { id: "cat-1", userId: "user-1", name: "Mercado", icon: "ShoppingBag" } as Category;

const buildUseCase = () => {
  const renames: Array<[string, string]> = [];
  let updatePatch: { name?: string; icon?: string } | null = null;

  const categoryRepository = {
    findById: async () => existing,
    findByNameInsensitive: async () => null,
    renameUsages: async (_userId: string, oldName: string, newName: string) => {
      renames.push([oldName, newName]);
    },
    update: async (id: string, patch: { name?: string; icon?: string }) => {
      updatePatch = patch;
      return { ...existing, ...patch };
    },
  } as unknown as CategoryRepository;

  return {
    useCase: new UpdateCategoryUseCase(categoryRepository),
    renames,
    getUpdatePatch: () => updatePatch,
  };
};

test("renaming a category cascades the new name to its usages", async () => {
  const { useCase, renames, getUpdatePatch } = buildUseCase();

  const result = await useCase.execute({ id: "cat-1", userId: "user-1", name: " Supermercado " });

  assert.equal(result.name, "Supermercado");
  assert.equal(getUpdatePatch()?.name, "Supermercado");
  assert.deepEqual(renames, [["Mercado", "Supermercado"]]);
});

test("changing only the icon does not touch usages", async () => {
  const { useCase, renames } = buildUseCase();

  await useCase.execute({ id: "cat-1", userId: "user-1", icon: "Carrot" });

  assert.deepEqual(renames, []);
});
