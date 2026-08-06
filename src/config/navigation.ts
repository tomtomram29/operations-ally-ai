import {
  LayoutDashboard,
  Users,
  TrendingUp,
  FileText,
  Package,
  IdCard,
  BarChart3,
  Sparkles,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  description: string;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

/**
 * Single source of truth for app navigation. Route files, the sidebar and the
 * command palette all read from here so a new module is added in one place.
 */
export const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      {
        label: "Dashboard",
        to: "/",
        icon: LayoutDashboard,
        description: "Business KPIs, cash flow and daily briefing",
      },
      {
        label: "AI Assistant",
        to: "/assistant",
        icon: Sparkles,
        description: "Your executive assistant for the whole company",
      },
    ],
  },
  {
    title: "Revenue",
    items: [
      { label: "Customers", to: "/customers", icon: Users, description: "CRM and relationship history" },
      { label: "Sales", to: "/sales", icon: TrendingUp, description: "Pipeline, quotations and orders" },
      { label: "Invoices", to: "/invoices", icon: FileText, description: "Billing, payments and dunning" },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Inventory", to: "/inventory", icon: Package, description: "Stock levels and reorder alerts" },
      { label: "Employees", to: "/employees", icon: IdCard, description: "Team, roles and time tracking" },
      { label: "Reports", to: "/reports", icon: BarChart3, description: "Financial and operational analytics" },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Settings", to: "/settings", icon: Settings, description: "Company profile, billing and access" },
    ],
  },
];

export const navItems: NavItem[] = navSections.flatMap((section) => section.items);