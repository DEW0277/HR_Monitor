"use client";

import React, { createContext, useContext, useState } from "react";

type Language = "uz" | "ru";

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

const translations: Record<Language, Record<string, string>> = {
  uz: {
    dashboard: "Boshqaruv Paneli",
    total_employees: "Jami Xodimlar",
    present: "Kelganlar",
    on_time: "Vaqtida",
    late: "Kechikkan",
    absent: "Kelmagan",
    loading: "Yuklanmoqda...",
    no_data: "Ma'lumot yo'q",
    refresh: "Yangilash",
    status_on_time: "Vaqtida",
    status_late: "Kechikkan",
    status_absent: "Kelmagan",
    today_stats: "Bugungi Statistika",
    employee_list: "Xodimlar Ro'yxati",
  },
  ru: {
    dashboard: "Панель управления",
    total_employees: "Всего сотрудников",
    present: "Пришли",
    on_time: "Вовремя",
    late: "Опоздали",
    absent: "Отсутствуют",
    loading: "Загрузка...",
    no_data: "Нет данных",
    refresh: "Обновить",
    status_on_time: "Вовремя",
    status_late: "Опоздал",
    status_absent: "Отсутствует",
    today_stats: "Статистика за сегодня",
    employee_list: "Список сотрудников",
  },
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (
      typeof window !== "undefined" &&
      window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code === "ru"
    ) {
      return "ru";
    }
    return "uz";
  });

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
