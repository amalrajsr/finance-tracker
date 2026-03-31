import { AuthThemeToggle } from "@/components/auth/auth-theme-toggle";
import { AuthBrandPanel } from "./_components/auth-brand-panel";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1.2fr_1fr]">
      <AuthBrandPanel />

      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8 sm:px-6 lg:px-8 relative">
        <AuthThemeToggle />
        <div className="w-full max-w-sm lg:max-w-md">{children}</div>
      </div>
    </div>
  );
}
