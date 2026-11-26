"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";

import { FieldShell, ShellButton } from "@/components/shared/form-shell";
import { PageHeader } from "@/components/shared/page-header";
import { StatusPanel } from "@/components/shared/status-panel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Contact } from "@/lib/contacts";

type ContactsShellProps = {
  contacts?: readonly Contact[];
  initialState?: "error";
};

const pageDescription =
  "People you send to often. Pick them when you add signers or copy recipients, instead of typing their details again.";
const validEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ContactsShell({
  contacts = [],
  initialState,
}: ContactsShellProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Contact | "new" | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Contact | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const shown = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return needle
      ? contacts.filter(
          (contact) =>
            contact.name.toLowerCase().includes(needle) ||
            contact.email.toLowerCase().includes(needle),
        )
      : contacts;
  }, [contacts, search]);

  function openForm(target: Contact | "new") {
    setEditing(target);
    setName(target === "new" ? "" : target.name);
    setEmail(target === "new" ? "" : target.email);
    setFormError(null);
  }

  async function save(event: FormEvent) {
    event.preventDefault();

    if (isSaving || !editing) {
      return;
    }

    if (name.trim().length === 0) {
      setFormError("Name is required.");
      return;
    }

    if (!validEmailPattern.test(email.trim())) {
      setFormError("Enter a valid email address.");
      return;
    }

    setFormError(null);
    setIsSaving(true);

    try {
      const response = await fetch(
        editing === "new" ? "/api/contacts" : `/api/contacts/${editing.id}`,
        {
          body: JSON.stringify({ email: email.trim(), name: name.trim() }),
          headers: { "Content-Type": "application/json" },
          method: editing === "new" ? "POST" : "PATCH",
        },
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;

        setFormError(payload?.error ?? "Unable to save this contact.");
        return;
      }

      setEditing(null);
      router.refresh();
    } catch {
      setFormError("Unable to save this contact.");
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete || isDeleting) {
      return;
    }

    setDeleteError(null);
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/contacts/${pendingDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok && response.status !== 404) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;

        setDeleteError(payload?.error ?? "Unable to delete this contact.");
        return;
      }

      setPendingDelete(null);
      router.refresh();
    } catch {
      setDeleteError("Unable to delete this contact.");
    } finally {
      setIsDeleting(false);
    }
  }

  if (initialState === "error") {
    return (
      <div className="space-y-5">
        <PageHeader description={pageDescription} title="Contacts" />
        <StatusPanel
          action={{ href: "/contacts", label: "Retry" }}
          description="We couldn't load your contacts. Try again in a moment."
          title="Couldn't load contacts"
          tone="error"
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader description={pageDescription} title="Contacts" />

      <section
        className="panel p-5 sm:p-7"
        data-animate="enter"
        data-animate-delay="1"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          {contacts.length > 0 ? (
            <div className="sm:w-80">
              <FieldShell
                readOnly={false}
                label="Search contacts"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name or email"
                value={search}
              />
            </div>
          ) : (
            <span />
          )}
          <ShellButton onClick={() => openForm("new")}>Add contact</ShellButton>
        </div>

        {contacts.length === 0 ? (
          <div className="mx-auto mt-8 max-w-lg space-y-2 text-center">
            <h2 className="text-2xl font-extrabold tracking-[-0.03em] text-(--fg)">
              No contacts yet
            </h2>
            <p className="text-[0.9375rem] leading-6 text-(--secondary)">
              Add the people you send to often. People you add as signers or
              copy recipients can be saved here with one tick as you send.
            </p>
          </div>
        ) : shown.length === 0 ? (
          <p className="mt-8 text-center text-[0.9375rem] text-(--secondary)">
            No contacts match &ldquo;{search.trim()}&rdquo;.
          </p>
        ) : (
          <ul className="mt-5 space-y-3">
            {shown.map((contact) => (
              <li
                className="well flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                key={contact.id}
              >
                <div className="min-w-0">
                  <p className="truncate text-[1.0625rem] font-extrabold text-(--fg)">
                    {contact.name}
                  </p>
                  <p className="truncate text-sm text-(--secondary)">
                    {contact.email}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    aria-label={`Delete ${contact.name}`}
                    className="btn-quiet btn-quiet-danger min-h-11 px-4"
                    onClick={() => {
                      setDeleteError(null);
                      setPendingDelete(contact);
                    }}
                    type="button"
                  >
                    Delete
                  </button>
                  <ShellButton
                    className="min-h-11"
                    onClick={() => openForm(contact)}
                    variant="secondary"
                  >
                    Edit
                  </ShellButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {editing ? (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open && !isSaving) {
              setEditing(null);
            }
          }}
        >
          <DialogContent
            className="max-h-[calc(100dvh-4rem)] max-w-md overflow-y-auto overscroll-contain sm:p-8"
            showCloseButton={false}
          >
            <form className="space-y-4" onSubmit={(event) => void save(event)}>
              <DialogHeader className="space-y-2">
                <DialogTitle>
                  {editing === "new" ? "Add contact" : "Edit contact"}
                </DialogTitle>
                <DialogDescription>
                  The same email address can be saved under more than one name.
                </DialogDescription>
              </DialogHeader>
              <FieldShell
                readOnly={false}
                autoComplete="off"
                label="Name"
                maxLength={120}
                onChange={(event) => setName(event.target.value)}
                value={name}
              />
              <FieldShell
                readOnly={false}
                autoComplete="off"
                ignorePasswordManagers
                label="Email"
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                value={email}
              />
              {formError ? (
                <div className="notice notice-danger" role="alert">
                  <p>{formError}</p>
                </div>
              ) : null}
              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <ShellButton
                  disabled={isSaving}
                  onClick={() => setEditing(null)}
                  variant="secondary"
                >
                  Cancel
                </ShellButton>
                <ShellButton loading={isSaving} type="submit">
                  Save
                </ShellButton>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      ) : null}

      {pendingDelete ? (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open && !isDeleting) {
              setPendingDelete(null);
            }
          }}
        >
          <DialogContent className="max-w-md sm:p-8" showCloseButton={false}>
            <div className="space-y-4">
              <DialogHeader className="space-y-3">
                <DialogTitle>Delete this contact?</DialogTitle>
                <DialogDescription>
                  {pendingDelete.name} ({pendingDelete.email}) will be removed
                  from your list. Documents already sent are not affected.
                </DialogDescription>
              </DialogHeader>
              {deleteError ? (
                <div className="notice notice-danger" role="alert">
                  <p>{deleteError}</p>
                </div>
              ) : null}
              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <ShellButton
                  disabled={isDeleting}
                  onClick={() => setPendingDelete(null)}
                  variant="secondary"
                >
                  Cancel
                </ShellButton>
                <ShellButton
                  loading={isDeleting}
                  onClick={() => void confirmDelete()}
                  variant="danger"
                >
                  Delete
                </ShellButton>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
