import { randomUUID } from "node:crypto";

import {
  type DbExecutor,
  getDb,
  queryMany,
  queryOne,
} from "./db/connection.ts";
import {
  contactInputSchema,
  saveContactsSchema,
  type ContactInput,
} from "./schemas/saved-contact.ts";

// Saved contacts are the sender's own address book: a name and an email to
// pick from instead of typing again. The same email may be saved under
// more than one name; the same name and email twice is one contact.

/** A guard on storage, not a limit anyone should run into. */
export const MAX_CONTACTS_PER_USER = 2000;

export class ContactError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "ContactError";
    this.statusCode = statusCode;
  }
}

export type Contact = {
  email: string;
  id: string;
  name: string;
};

const CONTACT_COLUMNS = `id, name, email`;
const DUPLICATE_MESSAGE =
  "You already saved a contact with this name and email address.";

function tidy(input: unknown): ContactInput {
  const parsed = contactInputSchema.safeParse(input);

  if (!parsed.success) {
    throw new ContactError(
      parsed.error.issues[0]?.message ?? "Enter a name and an email address.",
      400,
    );
  }

  return {
    email: parsed.data.email,
    name: parsed.data.name.replace(/\s+/g, " "),
  };
}

export async function listContacts(
  userId: string,
  database: DbExecutor = getDb(),
): Promise<Contact[]> {
  return queryMany<Contact>(
    database,
    `
      SELECT ${CONTACT_COLUMNS}
      FROM contacts
      WHERE user_id = $1
      ORDER BY lower(name), lower(email), id
    `,
    [userId],
  );
}

export async function createContact(
  userId: string,
  input: unknown,
  database: DbExecutor = getDb(),
): Promise<Contact> {
  const { email, name } = tidy(input);
  const count = await queryOne<{ total: number }>(
    database,
    `SELECT count(*)::int AS total FROM contacts WHERE user_id = $1`,
    [userId],
  );

  if ((count?.total ?? 0) >= MAX_CONTACTS_PER_USER) {
    throw new ContactError(
      `You can keep up to ${String(MAX_CONTACTS_PER_USER)} contacts. Delete some you no longer use.`,
      409,
    );
  }

  const row = await queryOne<Contact>(
    database,
    `
      INSERT INTO contacts (id, user_id, name, email)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT DO NOTHING
      RETURNING ${CONTACT_COLUMNS}
    `,
    [randomUUID(), userId, name, email],
  );

  if (!row) {
    throw new ContactError(DUPLICATE_MESSAGE, 409);
  }

  return row;
}

export async function updateContact(
  userId: string,
  contactId: string,
  input: unknown,
  database: DbExecutor = getDb(),
): Promise<Contact> {
  const { email, name } = tidy(input);
  let row: Contact | null;

  try {
    row = await queryOne<Contact>(
      database,
      `
        UPDATE contacts
        SET name = $3,
            email = $4,
            updated_at = extract(epoch from now())::bigint
        WHERE id = $1 AND user_id = $2
        RETURNING ${CONTACT_COLUMNS}
      `,
      [contactId, userId, name, email],
    );
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      throw new ContactError(DUPLICATE_MESSAGE, 409);
    }

    throw error;
  }

  if (!row) {
    throw new ContactError("Contact not found.", 404);
  }

  return row;
}

export async function deleteContact(
  userId: string,
  contactId: string,
  database: DbExecutor = getDb(),
): Promise<void> {
  const row = await queryOne<{ id: string }>(
    database,
    `DELETE FROM contacts WHERE id = $1 AND user_id = $2 RETURNING id`,
    [contactId, userId],
  );

  if (!row) {
    throw new ContactError("Contact not found.", 404);
  }
}

/**
 * Remembers people just used on an envelope. Anyone already saved (same name
 * and email) is left as is, and nothing here fails a send: it saves what it
 * can and stops at the storage limit.
 */
export async function rememberContacts(
  userId: string,
  input: unknown,
  database: DbExecutor = getDb(),
): Promise<{ saved: number }> {
  const parsed = saveContactsSchema.safeParse(input);

  if (!parsed.success) {
    throw new ContactError("Send a list of names and email addresses.", 400);
  }

  const count = await queryOne<{ total: number }>(
    database,
    `SELECT count(*)::int AS total FROM contacts WHERE user_id = $1`,
    [userId],
  );
  let room = MAX_CONTACTS_PER_USER - (count?.total ?? 0);
  let saved = 0;

  for (const person of parsed.data.contacts) {
    if (room <= 0) {
      break;
    }

    const { email, name } = tidy(person);
    const row = await queryOne<{ id: string }>(
      database,
      `
        INSERT INTO contacts (id, user_id, name, email)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT DO NOTHING
        RETURNING id
      `,
      [randomUUID(), userId, name, email],
    );

    if (row) {
      saved += 1;
      room -= 1;
    }
  }

  return { saved };
}
