import { z } from "zod";

import { emailSchema, nameSchema } from "./common.ts";

export const contactInputSchema = z.object({
  email: emailSchema,
  name: nameSchema,
});

/** People to remember after a send: the same shape, a few at a time. */
export const saveContactsSchema = z.object({
  contacts: z.array(contactInputSchema).min(1).max(60),
});

export type ContactInput = z.infer<typeof contactInputSchema>;
