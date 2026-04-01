import type { MetadataRoute } from "next";

const SIZES = [72, 96, 128, 144, 152, 192, 256, 384, 512] as const;

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FinTrack — Privacy-First Expense Tracker",
    short_name: "FinTrack",
    description:
      "Track your expenses by uploading bank statements. No bank API access, no credential sharing. Your data stays yours.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#F6F3ED",
    theme_color: "#F6F3ED",
    icons: [
      ...SIZES.map((size) => ({
        src: `/standard/icon-${size}x${size}.png`,
        sizes: `${size}x${size}`,
        type: "image/png" as const,
      })),
      ...SIZES.map((size) => ({
        src: `/maskable/icon-maskable-${size}x${size}.png`,
        sizes: `${size}x${size}`,
        type: "image/png" as const,
        purpose: "maskable" as const,
      })),
    ],
  };
}
