import { redirect } from "next/navigation";
import { adminHome } from "@/lib/admin/navigation";
export default function DashboardAlias() { redirect(adminHome); }
