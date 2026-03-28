import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const settingsProfileQueryKey = ["settings", "profile"] as const;

export interface SettingsProfile {
  name: string | null;
  email: string;
  createdAt: string;
}

async function parseJsonBody<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text.trim()) {
    throw new Error(
      res.ok
        ? "Empty response from server"
        : "Server error (no details). Try restarting the dev server after running: npx prisma generate",
    );
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Invalid response from server");
  }
}

async function fetchProfile(): Promise<SettingsProfile> {
  const res = await fetch("/api/settings/profile");
  const data = await parseJsonBody<SettingsProfile & { error?: string }>(res);
  if (!res.ok) {
    throw new Error(data.error || "Failed to load profile");
  }
  return data;
}

export function useSettingsProfile() {
  return useQuery({
    queryKey: settingsProfileQueryKey,
    queryFn: fetchProfile,
  });
}

export function useUpdateSettingsProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string | null) => {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await parseJsonBody<SettingsProfile & { error?: string }>(
        res,
      );
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(settingsProfileQueryKey, data);
    },
  });
}
