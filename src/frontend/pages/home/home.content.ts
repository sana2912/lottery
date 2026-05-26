import {
  BarChart3,
  CalendarDays,
  FlaskConical,
  LayoutDashboard,
  Scale,
  Search,
  Shapes
} from "lucide-react";

export { Activity as homeFallbackFeatureIcon } from "lucide-react";
export { default as homeContent } from "@/frontend/pages/home/home.mock.json";

export const homeFeatureIconMap = {
  analytics: BarChart3,
  calendar: CalendarDays,
  compare: Scale,
  dashboard: LayoutDashboard,
  patterns: Shapes,
  prediction: FlaskConical,
  results: Search
} as const;
