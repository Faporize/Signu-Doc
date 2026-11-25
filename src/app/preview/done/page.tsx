import { SigningDoneShell } from "@/components/signing/signing-done-shell";

// Where finishing a preview leads: the same page a client sees, with a way
// back.
export default function PreviewDonePage() {
  return (
    <SigningDoneShell
      backHref="/preview"
      backLabel="Back to Preview"
      envelopeTitle="Sample document"
    />
  );
}
