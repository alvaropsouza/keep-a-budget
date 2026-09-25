import { test } from "node:test";
import assert from "node:assert/strict";
import { CacheService } from "../../src/services/cache.service";

test("re-setting a key drops the tags it no longer carries", () => {
  const cache = new CacheService();

  cache.set("user:1", { name: "before" }, ["user", "user:1", "legacy"]);
  cache.set("user:1", { name: "after" }, ["user", "user:1"]);

  assert.equal(cache.invalidate(["legacy"]), 0);
  assert.deepEqual(cache.get("user:1"), { name: "after" });

  assert.equal(cache.invalidate(["user:1"]), 1);
  assert.equal(cache.get("user:1"), undefined);
});

test("a tag invalidates every key that carries it", () => {
  const cache = new CacheService();

  cache.set("user:1", 1, ["user"]);
  cache.set("user:2", 2, ["user"]);
  cache.set("invoice:1", 3, ["invoice"]);

  assert.equal(cache.invalidate(["user"]), 2);
  assert.equal(cache.get("user:1"), undefined);
  assert.equal(cache.get("invoice:1"), 3);
});

test("an entry past its ttl reads as missing", () => {
  const cache = new CacheService();

  cache.set("short", "value", [], 1);
  assert.equal(cache.get("short"), "value");

  const realNow = Date.now;
  Date.now = () => realNow() + 10;
  try {
    assert.equal(cache.get("short"), undefined);
  } finally {
    Date.now = realNow;
  }
});
