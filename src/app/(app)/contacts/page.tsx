import { ContactsShell } from "@/components/contacts/contacts-shell";
import { getAuthSession } from "@/lib/auth/server";
import { listContacts } from "@/lib/contacts";
import { getDb } from "@/lib/db/connection";

export default async function ContactsPage() {
  let contacts: Awaited<ReturnType<typeof listContacts>> = [];
  let initialState: "error" | undefined;

  try {
    const session = await getAuthSession();

    contacts = session ? await listContacts(session.user.id, getDb()) : [];
  } catch {
    initialState = "error";
  }

  return <ContactsShell contacts={contacts} initialState={initialState} />;
}
