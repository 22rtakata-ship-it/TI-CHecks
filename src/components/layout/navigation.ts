import {
  BookOpen,
  PackageCheck,
  LayoutDashboard,
  ClipboardList,
  ListTodo,
  CircleDot,
  Paperclip,
  FileBarChart2,
  Settings2,
} from "lucide-react";

export const links = [
  ["diario", "Diário", BookOpen],
  ["dashboard", "Dashboard", LayoutDashboard],
  ["atividades", "Atividades", ListTodo],
  ["ocorrencias", "Ocorrências", CircleDot],
  ["checklists", "Checklists", ClipboardList],
  ["validades", "Validades", PackageCheck],
  ["evidencias", "Evidências", Paperclip],
  ["relatorios", "Relatórios", FileBarChart2],
  ["configuracoes", "Configurações", Settings2],
] as const;
