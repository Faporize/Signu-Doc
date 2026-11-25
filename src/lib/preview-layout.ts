import { type DbExecutor, getDb, queryOne } from "./db/connection.ts";
import { PREVIEW_SIGNER_ID, DEFAULT_PREVIEW_FIELDS } from "./preview-sample.ts";
import {
  fieldPlacementListSchema,
  type FieldPlacement,
} from "./schemas/field.ts";

// Each sender keeps one layout of fields on the sample document. Before they
// change it they have the default, which shows every kind of field.

/** A guard on storage, not a limit anyone should run into. */
export const MAX_PREVIEW_FIELDS = 60;

export type PreviewLayout = {
  fields: Array<FieldPlacement & { id: string }>;
  revision: number;
};

export class PreviewLayoutError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "PreviewLayoutError";
    this.statusCode = statusCode;
  }
}

function defaultFields(): PreviewLayout["fields"] {
  return DEFAULT_PREVIEW_FIELDS.map((field) => ({
    ...field,
    options: field.options ? [...field.options] : undefined,
    signerId: PREVIEW_SIGNER_ID,
  }));
}

/** Fields whose ids repeat or are missing get new ones, so none are lost. */
function withUniqueIds(
  fields: readonly FieldPlacement[],
): PreviewLayout["fields"] {
  const seen = new Set<string>();

  return fields.map((field, index) => {
    let id = field.id?.trim() || `field-${String(index + 1)}`;

    while (seen.has(id)) {
      id = `${id}-${String(index + 1)}`;
    }

    seen.add(id);

    return { ...field, id, signerId: PREVIEW_SIGNER_ID };
  });
}

export async function readPreviewLayout(
  userId: string,
  database: DbExecutor = getDb(),
): Promise<PreviewLayout> {
  const row = await queryOne<{ fields: unknown; revision: number }>(
    database,
    `SELECT fields, revision FROM preview_layouts WHERE user_id = $1`,
    [userId],
  );

  if (!row) {
    return { fields: defaultFields(), revision: 0 };
  }

  const parsed = fieldPlacementListSchema.safeParse(row.fields);

  return {
    fields: parsed.success ? withUniqueIds(parsed.data) : defaultFields(),
    revision: row.revision,
  };
}

/**
 * Saves the layout. A save made against an older revision is refused, as for
 * an envelope, so a page the sender left cannot undo a newer one.
 */
export async function savePreviewLayout(
  userId: string,
  input: unknown,
  database: DbExecutor = getDb(),
): Promise<PreviewLayout> {
  const body = (input ?? {}) as {
    expectedRevision?: unknown;
    fields?: unknown;
  };
  const parsed = fieldPlacementListSchema.safeParse(body.fields);

  if (!parsed.success) {
    throw new PreviewLayoutError(
      parsed.error.issues[0]?.message ?? "Invalid field list.",
      400,
    );
  }

  if (parsed.data.length > MAX_PREVIEW_FIELDS) {
    throw new PreviewLayoutError(
      `The sample document holds up to ${String(MAX_PREVIEW_FIELDS)} fields.`,
      400,
    );
  }

  const fields = withUniqueIds(parsed.data);
  const expected =
    typeof body.expectedRevision === "number" ? body.expectedRevision : null;
  const row = await queryOne<{ revision: number }>(
    database,
    `
      INSERT INTO preview_layouts (user_id, fields, revision)
      VALUES ($1, $2::jsonb, 1)
      ON CONFLICT (user_id) DO UPDATE
        SET fields = excluded.fields,
            revision = preview_layouts.revision + 1,
            updated_at = extract(epoch from now())::bigint
        WHERE $3::int IS NULL OR preview_layouts.revision = $3::int
      RETURNING revision
    `,
    [userId, JSON.stringify(fields), expected],
  );

  if (!row) {
    throw new PreviewLayoutError(
      "The sample document was changed somewhere else. Reload this page.",
      409,
    );
  }

  return { fields, revision: row.revision };
}

/** Puts the default layout back. */
export async function resetPreviewLayout(
  userId: string,
  database: DbExecutor = getDb(),
): Promise<void> {
  await database.query(`DELETE FROM preview_layouts WHERE user_id = $1`, [
    userId,
  ]);
}
