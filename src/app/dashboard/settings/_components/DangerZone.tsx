"use client";

import { useCallback, useState } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ConfirmationModal } from "./ConfirmationModal";
import { useClearAllData } from "../_services/use-clear-data";
import { useDeleteAccount } from "../_services/use-delete-account";

type DangerModal = "logout" | "clear" | "delete" | null;

export function DangerZone() {
  const { toast } = useToast();
  const clearData = useClearAllData();
  const deleteAccount = useDeleteAccount();
  const [modal, setModal] = useState<DangerModal>(null);

  const closeModal = useCallback(() => setModal(null), []);

  return (
    <>
      <section className="rounded-2xl border border-debit/30 bg-debit-light/30 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-text-primary mb-1">
          Danger zone
        </h2>
        <p className="text-sm text-text-secondary mb-6">
          Irreversible actions for your session and data.
        </p>
        <ul className="space-y-4">
          <li className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border bg-surface p-4">
            <div>
              <p className="font-medium text-text-primary">Log out</p>
              <p className="text-sm text-text-secondary">
                Sign out on this device.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModal("logout")}
            >
              Log out
            </Button>
          </li>
          <li className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border bg-surface p-4">
            <div>
              <p className="font-medium text-text-primary">Clear all data</p>
              <p className="text-sm text-text-secondary">
                Remove all transactions, statements, and custom category rules.
                Your account stays active.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModal("clear")}
            >
              Clear data
            </Button>
          </li>
          <li className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-debit/40 bg-surface p-4">
            <div>
              <p className="font-medium text-text-primary">Delete account</p>
              <p className="text-sm text-text-secondary">
                Permanently delete your account and all associated data.
              </p>
            </div>
            <Button
              type="button"
              variant="danger"
              onClick={() => setModal("delete")}
            >
              Delete account
            </Button>
          </li>
        </ul>
      </section>

      <ConfirmationModal
        isOpen={modal === "logout"}
        title="Log out?"
        description="You will need to sign in again to access your dashboard."
        confirmLabel="Log out"
        variant="default"
        onCancel={closeModal}
        onConfirm={async () => {
          await signOut({ callbackUrl: "/login" });
        }}
      />

      <ConfirmationModal
        isOpen={modal === "clear"}
        title="Clear all data?"
        description={
          <>
            This will permanently delete all your transactions, uploaded
            statement records, and custom categorization rules. Your login and
            profile will remain.
          </>
        }
        confirmLabel="Clear all data"
        variant="danger"
        onCancel={closeModal}
        onConfirm={async () => {
          try {
            await clearData.mutateAsync();
            toast("All data cleared", "success");
            closeModal();
          } catch (err) {
            toast(
              err instanceof Error ? err.message : "Failed to clear data",
              "error",
            );
          }
        }}
      />

      <ConfirmationModal
        isOpen={modal === "delete"}
        title="Delete account?"
        description={
          <>
            This cannot be undone. All your data including your account will be
            permanently removed.
          </>
        }
        confirmLabel="Delete my account"
        variant="danger"
        requireText="DELETE"
        onCancel={closeModal}
        onConfirm={async () => {
          try {
            await deleteAccount.mutateAsync();
            await signOut({ callbackUrl: "/login" });
          } catch (err) {
            toast(
              err instanceof Error ? err.message : "Failed to delete account",
              "error",
            );
          }
        }}
      />
    </>
  );
}
