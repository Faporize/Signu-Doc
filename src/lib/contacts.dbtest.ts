import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";

import type pg from "pg";

import {
  ContactError,
  createContact,
  deleteContact,
  listContacts,
  rememberContacts,
  updateContact,
} from "./contacts.ts";
import { openTestDatabase } from "./db/test-database.ts";
import { replaceDraftEnvelopeSigners } from "./envelopes.ts";

// Saved contacts, and two signers sharing one email address, against a real
// Postgres. Run with `npm run test:db`.

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

async function createDraft(userId: string) {
  const envelopeId = randomUUID();

  await database.query(
    `
      insert into envelopes (
        id, user_id, title, status, source_pdf_key, source_pdf_filename,
        source_pdf_size_bytes, page_count, source_pdf_hash
      ) values ($1, $2, 'Lease', 'draft', $3, 'lease.pdf', 10, 1, $4)
    `,
    [envelopeId, userId, `test/${envelopeId}.pdf`, "a".repeat(64)],
  );

  return envelopeId;
}

test("contacts are listed by name, and are private to their owner", async () => {
  const sam = await createUser();
  const other = await createUser();

  await createContact(sam, { email: "b@example.test", name: "Bea" }, database);
  await createContact(sam, { email: "a@example.test", name: "Al" }, database);
  await createContact(other, { email: "x@example.test", name: "Xi" }, database);

  assert.deepEqual(
    (await listContacts(sam, database)).map((contact) => contact.name),
    ["Al", "Bea"],
  );
  assert.equal((await listContacts(other, database)).length, 1);
});

test("one email can be saved under two names, but not the same name twice", async () => {
  const sam = await createUser();

  await createContact(
    sam,
    { email: "home@example.test", name: "Alex Smith" },
    database,
  );
  await createContact(
    sam,
    { email: "HOME@example.test", name: "Sam Smith" },
    database,
  );

  await assert.rejects(
    createContact(
      sam,
      { email: "home@example.test", name: "  alex  SMITH" },
      database,
    ),
    (error) => error instanceof ContactError && error.statusCode === 409,
  );
});

test("a contact can be changed and deleted, but only by its owner", async () => {
  const sam = await createUser();
  const other = await createUser();
  const contact = await createContact(
    sam,
    { email: "c@example.test", name: "Cy" },
    database,
  );

  await assert.rejects(
    updateContact(
      other,
      contact.id,
      { email: "z@example.test", name: "Z" },
      database,
    ),
    (error) => error instanceof ContactError && error.statusCode === 404,
  );

  const changed = await updateContact(
    sam,
    contact.id,
    { email: "c2@example.test", name: "Cy Two" },
    database,
  );

  assert.equal(changed.email, "c2@example.test");

  await assert.rejects(
    deleteContact(other, contact.id, database),
    (error) => error instanceof ContactError && error.statusCode === 404,
  );
  await deleteContact(sam, contact.id, database);
  assert.equal((await listContacts(sam, database)).length, 0);
});

test("remembering people skips the ones already saved", async () => {
  const sam = await createUser();

  await createContact(sam, { email: "a@example.test", name: "Al" }, database);

  const result = await rememberContacts(
    sam,
    {
      contacts: [
        { email: "a@example.test", name: "Al" },
        { email: "n@example.test", name: "Nia" },
        { email: "n@example.test", name: "Nia" },
      ],
    },
    database,
  );

  assert.equal(result.saved, 1);
  assert.equal((await listContacts(sam, database)).length, 2);
});

test("two signers of one draft may share an email when their names differ", async () => {
  const sam = await createUser();
  const envelopeId = await createDraft(sam);

  await replaceDraftEnvelopeSigners(
    sam,
    envelopeId,
    {
      signers: [
        { email: "home@example.test", name: "Alex Smith" },
        { email: "Home@example.test", name: "Sam Smith" },
      ],
    },
    database,
  );

  const stored = await database.query(
    `select name from signers where envelope_id = $1 order by sign_order`,
    [envelopeId],
  );

  assert.deepEqual(
    stored.rows.map((row) => row.name),
    ["Alex Smith", "Sam Smith"],
  );

  // The database itself refuses the same name and address twice.
  await assert.rejects(
    database.query(
      `
        insert into signers (id, envelope_id, name, email, sign_order, status)
        values ($1, $2, 'alex  smith', 'HOME@example.test', 9, 'pending')
      `,
      [randomUUID(), envelopeId],
    ),
    (error) => (error as { code?: string }).code === "23505",
  );
});
