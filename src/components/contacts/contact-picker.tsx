"use client";

import { useMemo, useState } from "react";

import { FieldShell } from "@/components/shared/form-shell";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Contact } from "@/lib/contacts";

type ContactPickerProps = {
  contacts: readonly Contact[];
  disabled?: boolean;
  /** Names the place being filled, for screen readers: "Signer 2". */
  label: string;
  onPick: (contact: Contact) => void;
};

/** A button that opens the saved contacts, so one can fill in a name and email. */
export function ContactPicker({
  contacts,
  disabled = false,
  label,
  onPick,
}: ContactPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
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

  if (contacts.length === 0) {
    return null;
  }

  return (
    <>
      <button
        aria-label={`Choose ${label} from your contacts`}
        className="btn-quiet"
        disabled={disabled}
        onClick={() => {
          setSearch("");
          setOpen(true);
        }}
        type="button"
      >
        Contacts
      </button>

      <Dialog onOpenChange={setOpen} open={open}>
        <DialogContent
          className="max-h-[calc(100dvh-2rem)] max-w-md overflow-y-auto sm:p-8"
          showCloseButton={false}
        >
          <div className="space-y-4">
            <DialogHeader className="space-y-2">
              <DialogTitle>Choose a contact</DialogTitle>
              <DialogDescription>
                Fills in the name and email for {label}.
              </DialogDescription>
            </DialogHeader>
            <FieldShell
              readOnly={false}
              label="Search"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name or email"
              value={search}
            />
            {shown.length === 0 ? (
              <p className="text-sm text-(--secondary)">No contacts match.</p>
            ) : (
              <ul className="max-h-[50dvh] space-y-2 overflow-y-auto">
                {shown.map((contact) => (
                  <li key={contact.id}>
                    <button
                      className="well flex min-h-12 w-full flex-col items-start px-4 py-2 text-left transition hover:bg-[rgb(var(--accent-rgb)/0.08)]"
                      onClick={() => {
                        onPick(contact);
                        setOpen(false);
                      }}
                      type="button"
                    >
                      <span className="w-full truncate text-[0.9375rem] font-bold text-(--fg)">
                        {contact.name}
                      </span>
                      <span className="w-full truncate text-sm text-(--secondary)">
                        {contact.email}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
