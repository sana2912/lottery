import {
  Activity,
  BarChart3,
  BookmarkCheck,
  BookOpen,
  CalendarDays,
  FlaskConical,
  Gauge,
  LayoutDashboard,
  Scale,
  Search,
  Shapes
} from "lucide-react";
import homeMockJson from "@/frontend/pages/home/home.mock.json";

export const homeContent = homeMockJson;

export const homeFeatureIconMap = {
  analytics: BarChart3,
  backtest: Gauge,
  calendar: CalendarDays,
  compare: Scale,
  dashboard: LayoutDashboard,
  methodology: BookOpen,
  patterns: Shapes,
  prediction: FlaskConical,
  results: Search,
  watchlist: BookmarkCheck
} as const;

export const homeFallbackFeatureIcon = Activity;
