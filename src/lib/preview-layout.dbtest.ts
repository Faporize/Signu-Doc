import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";

import type pg from "pg";

import { openTestDatabase } from "./db/test-database.ts";
import {
  PreviewLayoutError,
  readPreviewLayout,
  resetPreviewLayout,
  savePreviewLayout,
} from "./preview-layout.ts";
import { DEFAULT_PREVIEW_FIELDS, PREVIEW_SIGNER_ID } from "./preview-sample.ts";

// The Preview tab's sample layout against a real Postgres. Run with
// `npm run test:db`.

let database: pg.Pool;
const createdUsers: string[] = [];

before(async () => {
  database = await openTestDatabase();
});

after(async () => {
  await database.query(`delete from public."user" where id = any($1)`, [
    createdUsers,
  ]);
  await database.end();
});

async function createUser() {
  const userId = randomUUID();

  createdUsers.push(userId);
  await database.query(
    `insert into public."user" (id, name, email, role) values ($1, 'Sam Sender', $2, 'user')`,
    [userId, `${userId}@example.test`],
  );

  return userId;
}

const oneField = (id: string) => ({
  height: 0.05,
  id,
  page: 1,
  required: true,
  signerId: PREVIEW_SIGNER_ID,
  type: "text" as const,
  width: 0.3,
  x: 0.1,
  y: 0.2,
});

test("before anything is saved, the layout is the default one with every kind of field", async () => {
  const user = await createUser();
  const layout = await readPreviewLayout(user, database);

  assert.equal(layout.revision, 0);
  assert.equal(layout.fields.length, DEFAULT_PREVIEW_FIELDS.length);
  assert.ok(
    layout.fields.every((field) => field.signerId === PREVIEW_SIGNER_ID),
  );
  assert.ok(layout.fields.some((field) => field.type === "signature"));
});

test("a saved layout is kept, per sender, and each save moves the revision on", async () => {
  const sam = await createUser();
  const other = await createUser();
  const first = await savePreviewLayout(
    sam,
    { fields: [oneField("a")], expectedRevision: 0 },
    database,
  );
  const second = await savePreviewLayout(
    sam,
    {
      fields: [oneField("a"), oneField("b")],
      expectedRevision: first.revision,
    },
    database,
  );

  assert.equal(first.revision, 1);
  assert.equal(second.revision, 2);
  assert.equal((await readPreviewLayout(sam, database)).fields.length, 2);
  // Someone else still has the default.
  assert.equal((await readPreviewLayout(other, database)).revision, 0);
});

test("a save from a page that missed a newer one is refused", async () => {
  const sam = await createUser();

  await savePreviewLayout(sam, { fields: [oneField("a")] }, database);
  await savePreviewLayout(
    sam,
    { fields: [oneField("a"), oneField("b")] },
    database,
  );

  await assert.rejects(
    savePreviewLayout(sam, { expectedRevision: 1, fields: [] }, database),
    (error) => error instanceof PreviewLayoutError && error.statusCode === 409,
  );
  assert.equal((await readPreviewLayout(sam, database)).fields.length, 2);
});

test("fields with repeated ids keep all of them, and bad fields are refused", async () => {
  const sam = await createUser();
  const saved = await savePreviewLayout(
    sam,
    { fields: [oneField("a"), oneField("a")] },
    database,
  );

  assert.equal(new Set(saved.fields.map((field) => field.id)).size, 2);

  await assert.rejects(
    savePreviewLayout(sam, { fields: [{ type: "nonsense" }] }, database),
    (error) => error instanceof PreviewLayoutError && error.statusCode === 400,
  );
});

test("putting the sample fields back returns the default layout", async () => {
  const sam = await createUser();

  await savePreviewLayout(sam, { fields: [] }, database);
  await resetPreviewLayout(sam, database);

  const layout = await readPreviewLayout(sam, database);

  assert.equal(layout.revision, 0);
  assert.equal(layout.fields.length, DEFAULT_PREVIEW_FIELDS.length);
});
