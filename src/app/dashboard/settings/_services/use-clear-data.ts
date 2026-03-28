import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useClearAllData() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/settings/data", { method: "DELETE" });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        throw new Error(data.error || "Failed to clear data");
      }
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries();
    },
  });
}
