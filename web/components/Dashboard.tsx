"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, AlertTriangle, XCircle, RefreshCw } from "lucide-react";

interface Stats {
  total: number;
  present: number;
  onTime: number;
  late: number;
  absent: number;
}

interface UserLog {
  id: string;
  fullName: string;
  status: "ON_TIME" | "LATE" | "ABSENT";
  checkTime?: string;
  latenessReason?: string;
}

export default function Dashboard() {
  const { t, language, setLanguage } = useLanguage();
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const statsRes = await api.get("/dashboard/stats");
      setStats(statsRes.data);

      const usersRes = await api.get("/dashboard/users");
      setUsers(usersRes.data);
    } catch (error) {
      console.error("Failed to fetch data", error);
      // In TWA, might want to show an alert or toast
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // TWA Ready
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
    fetchData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ON_TIME":
        return <Badge variant="success">{t("status_on_time")}</Badge>;
      case "LATE":
        return <Badge variant="warning">{t("status_late")}</Badge>;
      case "ABSENT":
      default:
        return <Badge variant="danger">{t("status_absent")}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 space-y-6 pb-20">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">{t("dashboard")}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setLanguage(language === "uz" ? "ru" : "uz")}
            className="px-3 py-1 bg-white border rounded shadow-sm text-sm font-medium"
          >
            {language === "uz" ? "🇷🇺 RU" : "🇺🇿 UZ"}
          </button>
          <button
            onClick={fetchData}
            className="p-2 bg-white border rounded shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("total_employees")}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total ?? "-"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("on_time")}
            </CardTitle>
            <Clock className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.onTime ?? "-"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("late")}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.late ?? "-"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("absent")}</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.absent ?? "-"}</div>
          </CardContent>
        </Card>
      </div>

      {/* Employee List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">{t("employee_list")}</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-4 text-center text-gray-500">{t("loading")}</div>
          ) : users.length === 0 ? (
            <div className="p-4 text-center text-gray-500">{t("no_data")}</div>
          ) : (
            <div className="divide-y">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="p-4 flex justify-between items-center hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">{user.fullName}</p>
                    {user.checkTime && (
                      <p className="text-xs text-gray-500">
                        {new Date(user.checkTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                    {user.latenessReason && (
                      <p className="text-xs text-red-500 mt-1 italic">
                        &quot;{user.latenessReason}&quot;
                      </p>
                    )}
                  </div>
                  <div>{getStatusBadge(user.status)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
