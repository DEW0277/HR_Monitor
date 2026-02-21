"use client";

import { LanguageProvider } from "@/contexts/LanguageContext";
import Dashboard from "@/components/Dashboard";

export default function Page() {
  return (
    <LanguageProvider>
      <Dashboard />
    </LanguageProvider>
  );
}
