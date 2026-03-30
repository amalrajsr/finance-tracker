import { useMutation } from "@tanstack/react-query";

export function useDeleteAccount() {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/settings/account", { method: "DELETE" });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete account");
      }
      return data;
    },
  });
}
