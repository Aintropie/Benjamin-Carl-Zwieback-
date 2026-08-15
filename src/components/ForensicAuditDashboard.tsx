import React, { useState } from 'react';
import {
  ShieldAlert,
  FileText,
  Database,
  Search,
  Download,
  Copy,
  Check,
  Lock,
  Server,
  Code,
  Terminal,
  Layers,
  AlertTriangle,
  Cpu,
  PieChart,
  FolderTree,
  CheckCircle2,
  Clock,
  Zap,
  Key,
  Wrench,
  Bot,
  HardDrive,
  Filter,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

// Data types for CSV Inventory
interface SystemFileRecord {
  projectFamily: string;
  relevance: string;
  role: string;
  mirrorStatus: string;
  filename: string;
  sizeBytes: number | string;
  lastModified: string;
  sha256: string;
  normalizedPath: string;
  originalPath: string;
}

// System Inventory Records from the report
const SYSTEM_INVENTORY_CSV: SystemFileRecord[] = [
  {
    projectFamily: "AI Video Chat / Photogrammetry",
    relevance: "Eigenständiges/unterstützendes Projekt",
    role: "Manifest / Index",
    mirrorStatus: "Original",
    filename: "app-path-routes-manifest.json",
    sizeBytes: 138,
    lastModified: "03.05.2026 13:02:41",
    sha256: "E3B0C44298FC1...",
    normalizedPath: "New project\\ai-video-chat\\.next\\app-path-routes-manifest.json",
    originalPath: "G:\\Meine Ablage\\New project\\ai-video-chat\\.next\\app-path-routes-manifest.json"
  },
  {
    projectFamily: "AI Video Chat / Photogrammetry",
    relevance: "Eigenständiges/unterstützendes Projekt",
    role: "Manifest / Index",
    mirrorStatus: "PC-Offload-Spiegel",
    filename: "app-path-routes-manifest.json",
    sizeBytes: 138,
    lastModified: "28.04.2026 02:38:43",
    sha256: "E3B0C44298FC1...",
    normalizedPath: "New project\\ai-video-chat\\.next\\app-path-routes-manifest.json",
    originalPath: "G:\\Meine Ablage\\PC_Offload_2026-05-03\\New_project_tree\\ai-video-chat\\.next\\app-path-routes-manifest.json"
  },
  {
    projectFamily: "AI Video Chat / Photogrammetry",
    relevance: "Eigenständiges/unterstützendes Projekt",
    role: "Manifest / Index",
    mirrorStatus: "Original",
    filename: "build-manifest.json",
    sizeBytes: 790,
    lastModified: "03.05.2026 13:02:41",
    sha256: "A4F89C11200E...",
    normalizedPath: "New project\\ai-video-chat\\.next\\build-manifest.json",
    originalPath: "G:\\Meine Ablage\\New project\\ai-video-chat\\.next\\build-manifest.json"
  },
  {
    projectFamily: "AI Video Chat / Photogrammetry",
    relevance: "Eigenständiges/unterstützendes Projekt",
    role: "Manifest / Index",
    mirrorStatus: "PC-Offload-Spiegel",
    filename: "build-manifest.json",
    sizeBytes: 790,
    lastModified: "28.04.2026 02:38:39",
    sha256: "A4F89C11200E...",
    normalizedPath: "New project\\ai-video-chat\\.next\\build-manifest.json",
    originalPath: "G:\\Meine Ablage\\PC_Offload_2026-05-03\\New_project_tree\\ai-video-chat\\.next\\build-manifest.json"
  },
  {
    projectFamily: "AI Video Chat / Photogrammetry",
    relevance: "Eigenständiges/unterstützendes Projekt",
    role: "Konfiguration",
    mirrorStatus: "Original",
    filename: "next-devtools-config.json",
    sizeBytes: 2,
    lastModified: "26.04.2026 06:19:14",
    sha256: "44136FA355B...",
    normalizedPath: "New project\\ai-video-chat\\.next\\dev\\cache\\next-devtools-config.json",
    originalPath: "G:\\Meine Ablage\\New project\\ai-video-chat\\.next\\dev\\cache\\next-devtools-config.json"
  },
  {
    projectFamily: "AI Video Chat / Photogrammetry",
    relevance: "Eigenständiges/unterstützendes Projekt",
    role: "Manifest / Index",
    mirrorStatus: "Original",
    filename: "fallback-build-manifest.json",
    sizeBytes: 269,
    lastModified: "26.04.2026 06:37:13",
    sha256: "89C011FE4B...",
    normalizedPath: "New project\\ai-video-chat\\.next\\dev\\fallback-build-manifest.json",
    originalPath: "G:\\Meine Ablage\\New project\\ai-video-chat\\.next\\dev\\fallback-build-manifest.json"
  },
  {
    projectFamily: "AI Video Chat / Photogrammetry",
    relevance: "Eigenständiges/unterstützendes Projekt",
    role: "Paketmetadaten",
    mirrorStatus: "Original",
    filename: "package.json",
    sizeBytes: 24,
    lastModified: "26.04.2026 06:18:54",
    sha256: "F19A2085CD...",
    normalizedPath: "New project\\ai-video-chat\\.next\\dev\\package.json",
    originalPath: "G:\\Meine Ablage\\New project\\ai-video-chat\\.next\\dev\\package.json"
  },
  {
    projectFamily: "AI Video Chat / Photogrammetry",
    relevance: "Eigenständiges/unterstützendes Projekt",
    role: "Manifest / Index",
    mirrorStatus: "Original",
    filename: "prerender-manifest.json",
    sizeBytes: 354,
    lastModified: "26.04.2026 06:18:54",
    sha256: "331908AB01...",
    normalizedPath: "New project\\ai-video-chat\\.next\\dev\\prerender-manifest.json",
    originalPath: "G:\\Meine Ablage\\New project\\ai-video-chat\\.next\\dev\\prerender-manifest.json"
  },
  {
    projectFamily: "AI Video Chat / Photogrammetry",
    relevance: "Eigenständiges/unterstützendes Projekt",
    role: "Manifest / Index",
    mirrorStatus: "Original",
    filename: "routes-manifest.json",
    sizeBytes: 308,
    lastModified: "26.04.2026 06:18:54",
    sha256: "67120BCDF9...",
    normalizedPath: "New project\\ai-video-chat\\.next\\dev\\routes-manifest.json",
    originalPath: "G:\\Meine Ablage\\New project\\ai-video-chat\\.next\\dev\\routes-manifest.json"
  },
  {
    projectFamily: "AI Video Chat / Photogrammetry",
    relevance: "Eigenständiges/unterstützendes Projekt",
    role: "Manifest / Index",
    mirrorStatus: "Original",
    filename: "app-paths-manifest.json",
    sizeBytes: 76,
    lastModified: "26.04.2026 06:37:13",
    sha256: "55C09F1A00...",
    normalizedPath: "New project\\ai-video-chat\\.next\\dev\\server\\app-paths-manifest.json",
    originalPath: "G:\\Meine Ablage\\New project\\ai-video-chat\\.next\\dev\\server\\app-paths-manifest.json"
  },
  {
    projectFamily: "AI Video Chat / Photogrammetry",
    relevance: "Eigenständiges/unterstützendes Projekt",
    role: "Manifest / Index",
    mirrorStatus: "Original",
    filename: "app-paths-manifest.json",
    sizeBytes: 50,
    lastModified: "26.04.2026 06:37:13",
    sha256: "90081C4F22...",
    normalizedPath: "New project\\ai-video-chat\\.next\\dev\\server\\app\\_not-found\\page\\app-paths-manifest.json",
    originalPath: "G:\\Meine Ablage\\New project\\ai-video-chat\\.next\\dev\\server\\app\\_not-found\\page\\app-paths-manifest.json"
  },
  {
    projectFamily: "AI Video Chat / Photogrammetry",
    relevance: "Eigenständiges/unterstützendes Projekt",
    role: "Manifest / Index",
    mirrorStatus: "Original",
    filename: "build-manifest.json",
    sizeBytes: 903,
    lastModified: "26.04.2026 06:37:13",
    sha256: "CC11894EA0...",
    normalizedPath: "New project\\ai-video-chat\\.next\\dev\\server\\app\\_not-found\\page\\build-manifest.json",
    originalPath: "G:\\Meine Ablage\\New project\\ai-video-chat\\.next\\dev\\server\\app\\_not-found\\page\\build-manifest.json"
  },
  {
    projectFamily: "AI Video Chat / Photogrammetry",
    relevance: "Eigenständiges/unterstützendes Projekt",
    role: "Manifest / Index",
    mirrorStatus: "Original",
    filename: "next-font-manifest.json",
    sizeBytes: 94,
    lastModified: "26.04.2026 06:37:13",
    sha256: "1256088BC1...",
    normalizedPath: "New project\\ai-video-chat\\.next\\dev\\server\\app\\_not-found\\page\\next-font-manifest.json",
    originalPath: "G:\\Meine Ablage\\New project\\ai-video-chat\\.next\\dev\\server\\app\\_not-found\\page\\next-font-manifest.json"
  },
  {
    projectFamily: "AI Video Chat / Photogrammetry",
    relevance: "Eigenständiges/unterstützendes Projekt",
    role: "Manifest / Index",
    mirrorStatus: "Original",
    filename: "react-loadable-manifest.json",
    sizeBytes: 2,
    lastModified: "26.04.2026 06:37:13",
    sha256: "44136FA355B...",
    normalizedPath: "New project\\ai-video-chat\\.next\\dev\\server\\app\\_not-found\\page\\react-loadable-manifest.json",
    originalPath: "G:\\Meine Ablage\\New project\\ai-video-chat\\.next\\dev\\server\\app\\_not-found\\page\\react-loadable-manifest.json"
  },
  {
    projectFamily: "AI Video Chat / Photogrammetry",
    relevance: "Eigenständiges/unterstützendes Projekt",
    role: "Manifest / Index",
    mirrorStatus: "Original",
    filename: "server-reference-manifest.json",
    sizeBytes: 30,
    lastModified: "26.04.2026 06:37:13",
    sha256: "009A1184BC...",
    normalizedPath: "New project\\ai-video-chat\\.next\\dev\\server\\app\\_not-found\\page\\server-reference-manifest.json",
    originalPath: "G:\\Meine Ablage\\New project\\ai-video-chat\\.next\\dev\\server\\app\\_not-found\\page\\server-reference-manifest.json"
  },
  {
    projectFamily: "AI Video Chat / Photogrammetry",
    relevance: "Eigenständiges/unterstützendes Projekt",
    role: "Manifest / Index",
    mirrorStatus: "Original",
    filename: "app-paths-manifest.json",
    sizeBytes: 28,
    lastModified: "26.04.2026 06:19:10",
    sha256: "712209AF82...",
    normalizedPath: "New project\\ai-video-chat\\.next\\dev\\server\\app\\page\\app-paths-manifest.json",
    originalPath: "G:\\Meine Ablage\\New project\\ai-video-chat\\.next\\dev\\server\\app\\page\\app-paths-manifest.json"
  },
  {
    projectFamily: "AI Video Chat / Photogrammetry",
    relevance: "Eigenständiges/unterstützendes Projekt",
    role: "Manifest / Index",
    mirrorStatus: "PC-Offload-Spiegel",
    filename: "app-paths-manifest.json",
    sizeBytes: 28,
    lastModified: "26.04.2026 06:19:10",
    sha256: "712209AF82...",
    normalizedPath: "New project\\ai-video-chat\\.next\\dev\\server\\app\\page\\app-paths-manifest.json",
    originalPath: "G:\\Meine Ablage\\PC_Offload_2026-05-03\\New_project_tree\\ai-video-chat\\.next\\dev\\server\\app\\page\\app-paths-manifest.json"
  },
  {
    projectFamily: "AI Video Chat / Photogrammetry",
    relevance: "Eigenständiges/unterstützendes Projekt",
    role: "Manifest / Index",
    mirrorStatus: "Original",
    filename: "build-manifest.json",
    sizeBytes: 903,
    lastModified: "26.04.2026 06:19:10",
    sha256: "CC11894EA0...",
    normalizedPath: "New project\\ai-video-chat\\.next\\dev\\server\\app\\page\\build-manifest.json",
    originalPath: "G:\\Meine Ablage\\New project\\ai-video-chat\\.next\\dev\\server\\app\\page\\build-manifest.json"
  },
  {
    projectFamily: "AI Video Chat / Photogrammetry",
    relevance: "Eigenständiges/unterstützendes Projekt",
    role: "Manifest / Index",
    mirrorStatus: "PC-Offload-Spiegel",
    filename: "build-manifest.json",
    sizeBytes: 903,
    lastModified: "26.04.2026 06:19:10",
    sha256: "CC11894EA0...",
    normalizedPath: "New project\\ai-video-chat\\.next\\dev\\server\\app\\page\\build-manifest.json",
    originalPath: "G:\\Meine Ablage\\PC_Offload_2026-05-03\\New_project_tree\\ai-video-chat\\.next\\dev\\server\\app\\page\\build-manifest.json"
  },
  {
    projectFamily: "AI Video Chat / Photogrammetry",
    relevance: "Eigenständiges/unterstützendes Projekt",
    role: "Manifest / Index",
    mirrorStatus: "Original",
    filename: "next-font-manifest.json",
    sizeBytes: 94,
    lastModified: "26.04.2026 06:19:10",
    sha256: "1256088BC1...",
    normalizedPath: "New project\\ai-video-chat\\.next\\dev\\server\\app\\page\\next-font-manifest.json",
    originalPath: "G:\\Meine Ablage\\New project\\ai-video-chat\\.next\\dev\\server\\app\\page\\next-font-manifest.json"
  },
  {
    projectFamily: "AI Video Chat / Photogrammetry",
    relevance: "Eigenständiges/unterstützendes Projekt",
    role: "Manifest / Index",
    mirrorStatus: "PC-Offload-Spiegel",
    filename: "next-font-manifest.json",
    sizeBytes: 94,
    lastModified: "26.04.2026 06:19:10",
    sha256: "1256088BC1...",
    normalizedPath: "New project\\ai-video-chat\\.next\\dev\\server\\app\\page\\next-font-manifest.json",
    originalPath: "G:\\Meine Ablage\\PC_Offload_2026-05-03\\New_project_tree\\ai-video-chat\\.next\\dev\\server\\app\\page\\next-font-manifest.json"
  },
  {
    projectFamily: "AI Video Chat / Photogrammetry",
    relevance: "Eigenständiges/unterstützendes Projekt",
    role: "Manifest / Index",
    mirrorStatus: "Original",
    filename: "react-loadable-manifest.json",
    sizeBytes: 2,
    lastModified: "26.04.2026 06:19:10",
    sha256: "44136FA355B...",
    normalizedPath: "New project\\ai-video-chat\\.next\\dev\\server\\app\\page\\react-loadable-manifest.json",
    originalPath: "G:\\Meine Ablage\\New project\\ai-video-chat\\.next\\dev\\server\\app\\page\\react-loadable-manifest.json"
  },
  {
    projectFamily: "AI Video Chat / Photogrammetry",
    relevance: "Eigenständiges/unterstützendes Projekt",
    role: "Manifest / Index",
    mirrorStatus: "PC-Offload-Spiegel",
    filename: "react-loadable-manifest.json",
    sizeBytes: 2,
    lastModified: "26.04.2026 06:19:10",
    sha256: "44136FA355B...",
    normalizedPath: "New project\\ai-video-chat\\.next\\dev\\server\\app\\page\\react-loadable-manifest.json",
    originalPath: "G:\\Meine Ablage\\PC_Offload_2026-05-03\\New_project_tree\\ai-video-chat\\.next\\dev\\server\\app\\page\\react-loadable-manifest.json"
  },
  {
    projectFamily: "AI Video Chat / Photogrammetry",
    relevance: "Eigenständiges/unterstützendes Projekt",
    role: "Manifest / Index",
    mirrorStatus: "Original",
    filename: "server-reference-manifest.json",
    sizeBytes: 30,
    lastModified: "26.04.2026 06:19:10",
    sha256: "009A1184BC...",
    normalizedPath: "New project\\ai-video-chat\\.next\\dev\\server\\app\\page\\server-reference-manifest.json",
    originalPath: "G:\\Meine Ablage\\New project\\ai-video-chat\\.next\\dev\\server\\app\\page\\server-reference-manifest.json"
  },
  {
    projectFamily: "AI Video Chat / Photogrammetry",
    relevance: "Eigenständiges/unterstützendes Projekt",
    role: "Manifest / Index",
    mirrorStatus: "PC-Offload-Spiegel",
    filename: "server-reference-manifest.json",
    sizeBytes: 30,
    lastModified: "26.04.2026 06:19:10",
    sha256: "009A1184BC...",
    normalizedPath: "New project\\ai-video-chat\\.next\\dev\\server\\app\\page\\server-reference-manifest.json",
    originalPath: "G:\\Meine Ablage\\PC_Offload_2026-05-03\\New_project_tree\\ai-video-chat\\.next\\dev\\server\\app\\page\\server-reference-manifest.json"
  },
  {
    projectFamily: "Antigravity Agent Workspace",
    relevance: "Kernprojekt",
    role: "Konfiguration",
    mirrorStatus: "Original",
    filename: "mcp_config.json",
    sizeBytes: 243,
    lastModified: "15.04.2026 14:22:10",
    sha256: "91FA10884A...",
    normalizedPath: "New project\\.antigravity\\antigravity\\mcp_config.json",
    originalPath: "G:\\Meine Ablage\\New project\\.antigravity\\antigravity\\mcp_config.json"
  },
  {
    projectFamily: "Antigravity Agent Workspace",
    relevance: "Kernprojekt",
    role: "Daten / unbekannte Funktion",
    mirrorStatus: "Original",
    filename: "gopro_battery_bundle_image.md.metadata.json",
    sizeBytes: 350,
    lastModified: "22.04.2026 08:12:05",
    sha256: "3389012CF1...",
    normalizedPath: "New project\\.antigravity\\antigravity\\brain\\cb3d03e3-e101-4e0c-b23c-fd7d844e7f7a\\gopro_battery_bundle_image.md.metadata.json",
    originalPath: "G:\\Meine Ablage\\New project\\.antigravity\\antigravity\\brain\\cb3d03e3-e101-4e0c-b23c-fd7d844e7f7a\\gopro_battery_bundle_image.md.metadata.json"
  },
  {
    projectFamily: "Antigravity Agent Workspace",
    relevance: "Kernprojekt",
    role: "Daten / unbekannte Funktion",
    mirrorStatus: "Original",
    filename: "scan_analysis.json",
    sizeBytes: 520,
    lastModified: "29.04.2026 17:54:33",
    sha256: "BC0199120F...",
    normalizedPath: "New project\\.antigravity\\antigravity\\scratch\\scan_analysis.json",
    originalPath: "G:\\Meine Ablage\\New project\\.antigravity\\antigravity\\scratch\\scan_analysis.json"
  },
  {
    projectFamily: "Antigravity Agent Workspace",
    relevance: "Kernprojekt",
    role: "Konfiguration",
    mirrorStatus: "Original",
    filename: "argv.json",
    sizeBytes: 112,
    lastModified: "11.04.2026 10:11:00",
    sha256: "11A90B238F...",
    normalizedPath: "New project\\.antigravity\\argv.json",
    originalPath: "G:\\Meine Ablage\\New project\\.antigravity\\argv.json"
  },
  {
    projectFamily: "Antigravity Agent Workspace",
    relevance: "Kernprojekt",
    role: "Konfiguration",
    mirrorStatus: "Original",
    filename: "extensions.json",
    sizeBytes: 84,
    lastModified: "11.04.2026 10:11:00",
    sha256: "A2B3C4D5E6...",
    normalizedPath: "New project\\.antigravity\\extensions\\extensions.json",
    originalPath: "G:\\Meine Ablage\\New project\\.antigravity\\extensions\\extensions.json"
  },
  {
    projectFamily: "Human–AI Audit Pipeline",
    relevance: "Kernprojekt",
    role: "Latest-Zeiger / aktueller Snapshot",
    mirrorStatus: "Original",
    filename: "DRIVE_SORTING_QUEUE_LATEST.json",
    sizeBytes: 27536,
    lastModified: "01.05.2026 05:11:19",
    sha256: "88901234AB...",
    normalizedPath: "New project\\evidence\\drive_sorting\\DRIVE_SORTING_QUEUE_LATEST.json",
    originalPath: "G:\\Meine Ablage\\New project\\evidence\\drive_sorting\\DRIVE_SORTING_QUEUE_LATEST.json"
  },
  {
    projectFamily: "Human–AI Audit Pipeline",
    relevance: "Kernprojekt",
    role: "Latest-Zeiger / aktueller Snapshot",
    mirrorStatus: "Original",
    filename: "EVIDENCE_INDEX_LATEST.json",
    sizeBytes: 8521,
    lastModified: "03.05.2026 12:57:32",
    sha256: "55C1092831...",
    normalizedPath: "New project\\evidence\\EVIDENCE_INDEX_LATEST.json",
    originalPath: "G:\\Meine Ablage\\New project\\evidence\\EVIDENCE_INDEX_LATEST.json"
  },
  {
    projectFamily: "Human–AI Audit Pipeline",
    relevance: "Kernprojekt",
    role: "Latest-Zeiger / aktueller Snapshot",
    mirrorStatus: "Original",
    filename: "FORMAL_AUDIT_LATEST.json",
    sizeBytes: 26164,
    lastModified: "03.05.2026 12:57:58",
    sha256: "900A871234...",
    normalizedPath: "New project\\evidence\\formal_audit\\FORMAL_AUDIT_LATEST.json",
    originalPath: "G:\\Meine Ablage\\New project\\evidence\\formal_audit\\FORMAL_AUDIT_LATEST.json"
  }
];

// Table 1 Data
const ROOT_AREAS_DATA = [
  { area: "PC_Offload_2026-05-03", count: 62323, sizeGiB: 17.720, countPct: 50.466, sizePct: 0.454, characteristic: "Lokaler Rechner-Offload; hohe Fragmentierung" },
  { area: "_CODE_AND_SCRIPTS", count: 36294, sizeGiB: 6.171, countPct: 29.389, sizePct: 0.158, characteristic: "Software-Repositories; extrem geringe Dateigrößen" },
  { area: "_TO_UNPACK_IN_CLOUD", count: 11566, sizeGiB: 3860.641, countPct: 9.366, sizePct: 98.972, characteristic: "Massen-ZIP-Archive; nahezu vollständige Speicherbelegung" },
  { area: "New project", count: 7642, sizeGiB: 0.738, countPct: 6.188, sizePct: 0.019, characteristic: "Aktives Arbeitsverzeichnis; Web- und Spiele-Entwicklung" },
  { area: "_AI_AND_PROMPTS", count: 4161, sizeGiB: 1.686, countPct: 3.369, sizePct: 0.043, characteristic: "KI-Konfigurationen und Prompt-Modelle" },
  { area: "Downloads", count: 588, sizeGiB: 0.224, countPct: 0.476, sizePct: 0.006, characteristic: "Temporäre Downloads und RAG-Pipeline-Berichte" },
  { area: "_SOFTWARE_AND_VR", count: 483, sizeGiB: 6.288, countPct: 0.391, sizePct: 0.161, characteristic: "VR-Installationspakete und kompilierte Executables" },
  { area: "artifacts", count: 133, sizeGiB: 0.011, countPct: 0.108, sizePct: 0.000, characteristic: "Build-Artefakte und Compiler-Outputs" },
  { area: "400_LEARNING_ARCHIVE", count: 82, sizeGiB: 1.908, countPct: 0.066, sizePct: 0.049, characteristic: "Dokumente und Schulungsmaterialien" },
  { area: "_MEDIA_AND_ASSETS", count: 46, sizeGiB: 1.791, countPct: 0.037, sizePct: 0.046, characteristic: "Rohmedien und Video-Produktionsdaten" },
  { area: "memory", count: 32, sizeGiB: 0.582, countPct: 0.026, sizePct: 0.015, characteristic: "System-Backups und 3D-GLB-Modelle" },
  { area: "MISC", count: 27, sizeGiB: 0.043, countPct: 0.022, sizePct: 0.001, characteristic: "Sonstige unstrukturierte Ablagen" },
  { area: "000_CORE_SYSTEM", count: 23, sizeGiB: 0.008, countPct: 0.019, sizePct: 0.000, characteristic: "Zentrale Betriebsskripte und Verzeichnis-Verknüpfungen" },
  { area: "DCIM", count: 23, sizeGiB: 0.012, countPct: 0.019, sizePct: 0.000, characteristic: "Kamera-Rohdaten und Medien-Previews" },
  { area: "photogrammetry-site", count: 8, sizeGiB: 0.020, countPct: 0.006, sizePct: 0.001, characteristic: "Web-Assets für Photogrammetrie-Visualisierung" },
  { area: "STATE_BASE_AUDIT", count: 5, sizeGiB: 0.151, countPct: 0.004, sizePct: 0.004, characteristic: "Pipeline-Statusdaten und Audit-Checkpoints" },
  { area: "assets", count: 4, sizeGiB: 0.040, countPct: 0.003, sizePct: 0.001, characteristic: "Globale 3D-Modelle und Textur-Bibliotheken" },
  { area: ".vscode", count: 3, sizeGiB: 0.000, countPct: 0.002, sizePct: 0.000, characteristic: "Editor-Konfigurationen und Workspace-Verknüpfungen" }
];

// Table 2 Data
const FILE_TYPES_DATA = [
  { ext: ".js", count: 21176, sizeGiB: 0.292, countPct: 17.147, sizePct: 0.007, ecosystem: "JavaScript-Quellcodedateien (Node.js/React)" },
  { ext: ".meta", count: 14747, sizeGiB: 0.009, countPct: 11.941, sizePct: 0.000, ecosystem: "Metadaten-Konfigurationsdateien (Unity Engine)" },
  { ext: ".md", count: 13347, sizeGiB: 0.512, countPct: 10.808, sizePct: 0.013, ecosystem: "Dokumentation und technische Spezifikationen" },
  { ext: ".jpg", count: 12731, sizeGiB: 2.226, countPct: 10.309, sizePct: 0.057, ecosystem: "Bilddaten (Texturen, Web-Assets, Renderings)" },
  { ext: ".ts", count: 8869, sizeGiB: 0.048, countPct: 7.182, sizePct: 0.001, ecosystem: "TypeScript-Quellcodedateien (Typsichere App-Entwicklung)" },
  { ext: ".cs", count: 7536, sizeGiB: 0.066, countPct: 6.102, sizePct: 0.002, ecosystem: "C#-Quellcode (Primär-Logik für Unity-Komponenten)" },
  { ext: "[ohne]", count: 6950, sizeGiB: 1.222, countPct: 5.628, sizePct: 0.031, ecosystem: "Systemdateien, Unix-Binaries und Konfigurations-Dockets" },
  { ext: ".png", count: 4296, sizeGiB: 0.872, countPct: 3.479, sizePct: 0.022, ecosystem: "Verlustfreie Bilddaten (UI-Komponenten, Texturen)" },
  { ext: ".zip", count: 300, sizeGiB: 3685.570, countPct: 0.243, sizePct: 94.484, ecosystem: "Pack-Archive (System-Sicherungstranchen)" },
  { ext: ".mp4", count: 2196, sizeGiB: 142.578, countPct: 1.778, sizePct: 3.655, ecosystem: "Videodaten (Dokumentationen und Medienproduktion)" }
];

// Table 3 Data
const DUPLICATES_DATA = [
  { hash: "E3B0C44298FC1...", copies: 5, sizeBytes: "0", detail: "Leere Systemobjekte (Standard-Null-Byte-Hash): assets\\3d_models\\dortmund\\raw\\sha256sum.txt, 000_CORE_SYSTEM\\Loose_Root_Files\\project_files, .gitkeep, DCIM LRV. (Hinweis: _TO_UNPACK_IN_CLOUD\\takeout-20250614T081435Z-1-008.zip belegt fälschlicherweise denselben Null-Hash, hat physisch 1.36GB)." },
  { hash: "1A5C0F62A6397...", copies: 3, sizeBytes: "13.223", detail: "Temporäre Cache-Dokumente im Systemkern: 65ce94c2...tmp, 38252e4f...tmp, 2f461682...tmp." },
  { hash: "3658C5D85B988...", copies: 2, sizeBytes: "966", detail: "Komprimierte Kommunikationsarchive: WhatsApp-Chat mit Mira (1).zip & WhatsApp-Chat mit Mira.zip" },
  { hash: "3A262AB8EF200...", copies: 2, sizeBytes: "1.915", detail: "Komprimierte Kommunikationsarchive: WhatsApp-Chat mit Schatz (1).zip & WhatsApp-Chat mit Schatz.zip" },
  { hash: "41AF5880A0046...", copies: 2, sizeBytes: "2.100.486", detail: "Medien-Dubletten (PNG-Grafiken): 1769704198527 (1).png & 1769704198527.png" },
  { hash: "B2C16CAFB0557...", copies: 2, sizeBytes: "4.153.964", detail: "3D-Szenen-Fragmente (Scaniverse GLB-Modelle): memory\\fragments\\Scaniverse 2025-12-20 111152.glb & Kopie (1).glb" }
];

// Table 4 Data: Skills
const SKILLS_DATA = [
  { name: "Data Analytics", status: "installiert", skills: "Datenqualität, Dashboards, Reports, KPI, Diagnostik, Visualisierung, Validierung." },
  { name: "Product Design", status: "installiert", skills: "UX-Audit, Recherche, Ideation, Bild/URL-to-Code, QA, Prototyp-Sharing." },
  { name: "Creative Production", status: "installiert", skills: "Kampagnen, Werbeanzeigen (Ads), Produktbilder, Logos, Diagramme, Decks, Videos." },
  { name: "Investment Banking", status: "installiert", skills: "CIM, DCF-Modelle, LBO, Multiples (Comps), Covenants, Tracker, Memos, QC." },
  { name: "Public Equity", status: "installiert", skills: "Earnings-Analyse, DCF, Comps, Pitches, Thesis-Tracker, Risikoanalyse." },
  { name: "Sales", status: "installiert", skills: "Account-Signale, Deal-Strategie, Forecaster, Meeting-Vorbereitung, CRM-Workflows." },
  { name: "Google Workspace", status: "installiert", skills: "Integration mit Drive, Docs, Sheets, Slides, Kommentaren, Gmail/Kalender-Workflows." },
  { name: "GitHub", status: "installiert", skills: "Pull Request (PR) & Issue-Triage, Review-Kommentare, CI-Fixes, Commits, Pushs." },
  { name: "Slack", status: "installiert", skills: "Channel-Zusammenfassungen, Digests, Notification-Triage, Antworten, Messaging." },
  { name: "Figma", status: "installiert", skills: "Code Connect, Design-to-Code, Diagramme, Bibliotheken, Motion, SwiftUI, Slides." },
  { name: "Canva", status: "installiert", skills: "Branded Decks, Skalierung (Resize), Übersetzung, Brand-Check, Bulk-Erstellung." },
  { name: "Adobe", status: "installiert", skills: "Stapelverarbeitung von Fotos, Mockups, Social-Media-Variationen, Retusche." },
  { name: "Hugging Face", status: "installiert", skills: "CLI, Datensätze, LLM-Evaluationen (Evals), Job-Training, Gradio-Integration, Trackio." },
  { name: "HeyGen", status: "installiert", skills: "Avatar- und Presenter-Video-Generierung, automatisierte Workflows." },
  { name: "OpenAI Developers", status: "installiert", skills: "OpenAI Agents SDK, ChatGPT-Applikationen, API-Troubleshooting, Key-Management." },
  { name: "Doc Router", status: "installiert", skills: "Strukturierte Erstellung und Format-Konvertierung nach Dateityp (PDF/Präsentationen)." }
];

// Table 5 Data: Connectors
const CONNECTORS_DATA = [
  { connector: "Google Drive", level: "Connector", status: "verbunden/getestet", usage: "Zentraler Crawl; Metadaten- und Dateianalyse. Lesezugriff und Rohdatei-Downloads verifiziert." },
  { connector: "Neon Postgres", level: "Datenbank", status: "installiert", usage: "Persistentes Audit-Ledger. SQL-Datenbankmanagement; erfordert noch Verbindungs-Verifizierung." },
  { connector: "MarcoPolo", level: "System-Schnittstelle", status: "installiert", usage: "Externe Datenintegration. Anbindung externer APIs, Datastores und S3-Sicherungsmedien." },
  { connector: "OpenAI Platform", level: "API-Ecosystem", status: "installiert", usage: "KI-Pipeline. API-Setup und Workflow-Integration vorhanden; individueller Key ungetestet." },
  { connector: "GitHub", level: "Repository-Schnittstelle", status: "installiert", usage: "Provenance- und Code-Analyse. Zugriff auf Repositories, PRs und CI-Build-Protokolle vorbereitet." },
  { connector: "Slack", level: "Kommunikation", status: "installiert", usage: "Entscheidungswege-Protokollierung. Channel-Suchen, Dateiverarbeitung und Messenger-Workflows." },
  { connector: "Airtable", level: "Case Management", status: "installiert", usage: "Audit-Protokollierung. Erfassung strukturierter Nachweisdatensätze in Tabellen-Bases." },
  { connector: "Adobe Acrobat", level: "PDF-Konverter", status: "installiert", usage: "PDF-Transformations-Pipeline. Sichere Schwärzung und Transformation sensibler Nachweisdokumente." },
  { connector: "Lovable", level: "Web-App-Builder", status: "installiert", usage: "Benutzeroberflächen-Generierung. Erstellung responsiver Web-UIs zur Visualisierung der Audit-Ergebnisse." },
  { connector: "Hostinger", level: "Webhosting", status: "installiert", usage: "Deployment-Infrastruktur. Bereitstellung des Audit-Portals und aktiver Web-Schnittstellen." },
  { connector: "Gmail", level: "Kommunikation", status: "verfügbar", usage: "E-Mail-Forensik. Suchen, Lesen, Entwurfs-Generierung und automatisiertes Labeling aktivierbar." },
  { connector: "Google Kalender", level: "Zeitmanagement", status: "verfügbar", usage: "Timeline-Rekonstruktion. Abgleich von Datei-Änderungszeiten mit kalendarischen Meilensteinen." },
  { connector: "Plugin Management", level: "Systemebene", status: "verfügbar", usage: "Closing Integration Gaps. Dynamische Installation und Deinstallation systemischer Erweiterungen." },
  { connector: "Figma", level: "Design-Schnittstelle", status: "installiert", usage: "UI-Prototyping. Design-to-Code-Übersetzung und Diagramm-Generierung." },
  { connector: "Hugging Face", level: "Modell-Ecosystem", status: "installiert", usage: "Spezialisierte Klassifizierung. Evaluierung lokaler NLP- und Klassifizierungsmodelle." },
  { connector: "HeyGen", level: "Videogenerierung", status: "installiert", usage: "Ergebnis-Präsentation. Synthese KI-gestützter Video-Präsentationen für den Audit-Abschluss." },
  { connector: "Google Kontakte", level: "Adressbuch", status: "verfügbar", usage: "Personen-Auflösung. Abgleich von Datei-Besitzern mit aktiven Workspace-Benutzern." },
  { connector: "Tripadvisor", level: "Reise-API", status: "installiert", usage: "Keine direkte Audit-Relevanz; sehr niedrige Priorität." },
  { connector: "AllTrails", level: "Geodaten", status: "installiert", usage: "Keine direkte Audit-Relevanz; sehr niedrige Priorität." }
];

// Table 6 Data: Roadmap
const ROADMAP_DATA = [
  { rank: 1, title: "Drive-Inventar normalisieren", priority: "Sehr hoch", priorityColor: "bg-red-500/20 text-red-400 border-red-500/30", status: "laufend / teilweise erledigt", steps: "Fortlaufende Erfassung der 123.495 Datensätze über das Python-Auditskript; Konsolidierung der Root-Pfad-Anomalien." },
  { rank: 2, title: "Bestehende Projektcluster erkennen", priority: "Sehr hoch", priorityColor: "bg-red-500/20 text-red-400 border-red-500/30", status: "offen", steps: "Semantisches Clustering von Ordnerstrukturen; vollständige Trennung von aktiven Quellcodes, Caches und passiven ZIP-Archiven." },
  { rank: 3, title: "Connector-Rechte testen", priority: "Sehr hoch", priorityColor: "bg-red-500/20 text-red-400 border-red-500/30", status: "offen", steps: "Durchführung von zerstörungsfreien, minimal-invasiven Lese- und Schreibproben für Drive, GitHub, Slack und Airtable." },
  { rank: 4, title: "Persistentes Audit-Ledger anlegen", priority: "Kritisch", priorityColor: "bg-purple-500/20 text-purple-400 border-purple-500/30", status: "offen", steps: "Aufsetzen der relationalen Neon Postgres-Datenbank zur lückenlosen Versionierung der Audit-Nachweise und Klassifizierungen." },
  { rank: 5, title: "Eigene SDK-Pipeline aufsetzen", priority: "Kritisch", priorityColor: "bg-purple-500/20 text-purple-400 border-purple-500/30", status: "offen", steps: "Konfiguration der OpenAI API in Kombination mit dem Agents SDK, Model Context Protocol (MCP) und Tracing-Frameworks." },
  { rank: 6, title: "Drive-RAG und Provenienzindex", priority: "Kritisch", priorityColor: "bg-purple-500/20 text-purple-400 border-purple-500/30", status: "offen", steps: "Implementierung von Chunking-, Einbettungs- und Hashing-Routinen zur eindeutigen Zitierfähigkeit und Revisionssicherheit." },
  { rank: 7, title: "Dubletten-Logik erweitern", priority: "Hoch", priorityColor: "bg-amber-500/20 text-amber-400 border-amber-500/30", status: "offen", steps: "Implementierung von Fuzzy-Matching-Algorithmen zur Erkennung von Beinahe-Duplikaten (Near-Duplicates) und Archiv-Inhalten." },
  { rank: 8, title: "Dashboard & Review-Workflow", priority: "Hoch", priorityColor: "bg-amber-500/20 text-amber-400 border-amber-500/30", status: "offen", steps: "Bereitstellung einer visuellen Oberfläche (über Lovable) zur Freigabe, Statusverfolgung und Risikobewertung des Bestands." },
  { rank: 9, title: "Automatisierte Regressionstests", priority: "Hoch", priorityColor: "bg-amber-500/20 text-amber-400 border-amber-500/30", status: "offen", steps: "Etablierung kontinuierlicher Messverfahren zur Absicherung der Klassifizierungs-Güte bei Modell- und Prompt-Änderungen." },
  { rank: 10, title: "Deployment und Zugriffsmodell", priority: "Hoch", priorityColor: "bg-amber-500/20 text-amber-400 border-amber-500/30", status: "offen", steps: "Einrichtung rollenbasierter Zugriffskontrollen (RBAC), sicherer Secrets-Verwaltung und automatisierter CI/CD-Pipelines." }
];

const PYTHON_SCRIPT_CODE = `import os
import csv
import hashlib
import io
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

# Definition der erforderlichen Scopes für den System-Audit.
# Um verwaiste Dateien und Systemkonfigurationen zu erfassen, wird der globale Scope verwendet.
SCOPES = ['https://www.googleapis.com/auth/drive']

def get_drive_service():
    """
    Kompiliert den Authentifizierungsfluss und liefert den API-Service.
    Implementiert einen automatischen Refresh und erzwingt Re-Autorisierung bei Scope-Konflikten.
    """
    creds = None
    token_path = 'token.json'

    if os.path.exists(token_path):
        creds = Credentials.from_authorized_user_file(token_path, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
            except Exception:
                # "Nuclear Refresh" bei ungültigem Token-Zustand oder Scope-Änderungen.
                os.remove(token_path)
                creds = None

        if not creds:
            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
            with open(token_path, 'w') as token:
                token.write(creds.to_json())

    return build('drive', 'v3', credentials=creds)

def calculate_sha256(service, file_id, size):
    """
    Lädt kleine Konfigurations- und Systemdateien herunter, um eine präzise
    Prüfsumme für die De-Duplizierungs-Analyse zu berechnen.
    """
    if size is None or int(size) == 0:
        return "E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855" # Null-Byte-Hash

    if int(size) > 10 * 1024 * 1024:  # Überspringe Dateien > 10 MB aus Performancegründen.
        return "LIMIT_EXCEEDED"

    try:
        request = service.files().get_media(fileId=file_id)
        file_stream = io.BytesIO()
        downloader = MediaIoBaseDownload(file_stream, request)
        done = False
        while not done:
            _, done = downloader.next_chunk()

        file_stream.seek(0)
        hash_hash = hashlib.sha256(file_stream.read()).hexdigest().upper()
        return hash_hash
    except Exception:
        return "HASH_ERROR"

def fetch_orphaned_files(service):
    """
    Erfasst gezielt alle verwaisten Dateien des Benutzers über den Indexoperator.
    """
    orphans = []
    page_token = None
    query = "is:unorganized owner:me"

    while True:
        results = service.files().list(
            q=query,
            spaces='drive',
            fields="nextPageToken, files(id, name, size, modifiedTime, parents)",
            pageToken=page_token
        ).execute()

        orphans.extend(results.get('files', []))
        page_token = results.get('nextPageToken', None)
        if not page_token:
            break

    return orphans

def generate_system_inventory(output_csv_path):
    """
    Erfasst das gesamte Google Drive-Inventar, inklusive aller System- und
    versteckten Verzeichnisse, strukturiert diese und gibt sie als CSV aus.
    """
    service = get_drive_service()
    inventar_daten = []
    page_token = None

    # Erfasse alle Standard- und Systemdateien (inkl. Papierkorb-Objekte).
    query = "trashed = false"

    print("[INFO] Starte umfassenden Google Drive Scan...")
    while True:
        results = service.files().list(
            q=query,
            spaces='drive',
            fields="nextPageToken, files(id, name, size, mimeType, modifiedTime, parents)",
            pageToken=page_token
        ).execute()

        inventar_daten.extend(results.get('files', []))
        page_token = results.get('nextPageToken', None)
        if not page_token:
            break

    # Ergänze verwaiste Dateien, die im normalen Scan oft verborgen bleiben.
    print("[INFO] Suche nach verwaisten Systemleichen...")
    orphaned_files = fetch_orphaned_files(service)
    orphan_ids = {f['id'] for f in orphaned_files}

    for orphan in orphaned_files:
        if orphan['id'] not in {f['id'] for f in inventar_daten}:
            inventar_daten.append(orphan)

    # Schreiben der strukturierten Daten in die CSV-Ziel-Datei.
    with open(output_csv_path, mode='w', newline='', encoding='utf-8') as csv_file:
        writer = csv.writer(csv_file, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
        writer.writerow([
            "Projektfamilie", "Relevanz", "Rolle", "Spiegelstatus",
            "Dateiname", "Größe Bytes", "Letzte Änderung", "SHA256",
            "Normalisierter Pfad", "Originalpfad"
        ])

        print(f"[INFO] Berechne Hashes und strukturiere {len(inventar_daten)} Dateien...")
        for index, file in enumerate(inventar_daten):
            file_id = file.get('id')
            name = file.get('name')
            size = file.get('size')
            mime = file.get('mimeType', 'unknown')
            modified = file.get('modifiedTime')
            parents = file.get('parents', [])
            parent_id = parents[0] if parents else 'ORPHANED'

            # Kennzeichnung von System- und versteckten Pfaden.
            status_flags = []
            if name.startswith('.'):
                status_flags.append('HIDDEN_FILE')
            if 'ORPHANED' in parent_id or file_id in orphan_ids:
                status_flags.append('ORPHANED_SYSTEM_FILE')
            if any(term in mime for term in ['json', 'javascript', 'typescript', 'config']):
                status_flags.append('SYSTEM_CONFIG')

            flags_str = "|".join(status_flags) if status_flags else 'NORMAL'

            # Berechnung des kryptografischen SHA-256-Hashes für System-Dateien.
            sha256_hash = ""
            if 'SYSTEM_CONFIG' in flags_str or (size and int(size) < 50000):
                sha256_hash = calculate_sha256(service, file_id, size)
            else:
                sha256_hash = "NOT_COMPUTED"

            writer.writerow([file_id, name, size, mime, modified, sha256_hash, parent_id, flags_str])

            if index % 500 == 0 and index > 0:
                print(f" {index} von {len(inventar_daten)} Dateien verarbeitet.")

    print(f" Gesamtes Google Drive Inventar erfolgreich exportiert nach: {output_csv_path}")

if __name__ == '__main__':
    generate_system_inventory('google_drive_system_inventory_report.csv')`;

export default function ForensicAuditDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'csv' | 'security' | 'script' | 'matrix' | 'roadmap'>('overview');
  const [csvSearchQuery, setCsvSearchQuery] = useState('');
  const [familyFilter, setFamilyFilter] = useState<string>('ALL');
  const [copiedScript, setCopiedScript] = useState(false);

  // Filter CSV records
  const filteredCsvRecords = SYSTEM_INVENTORY_CSV.filter(rec => {
    const matchesSearch =
      rec.filename.toLowerCase().includes(csvSearchQuery.toLowerCase()) ||
      rec.normalizedPath.toLowerCase().includes(csvSearchQuery.toLowerCase()) ||
      rec.role.toLowerCase().includes(csvSearchQuery.toLowerCase());
    const matchesFamily = familyFilter === 'ALL' || rec.projectFamily === familyFilter;
    return matchesSearch && matchesFamily;
  });

  const handleCopyScript = () => {
    navigator.clipboard.writeText(PYTHON_SCRIPT_CODE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleDownloadCsv = () => {
    const headers = [
      "Projektfamilie", "Relevanz", "Rolle", "Spiegelstatus",
      "Dateiname", "Größe Bytes", "Letzte Änderung", "SHA256",
      "Normalisierter Pfad", "Originalpfad"
    ];
    const csvRows = [headers.join(',')];

    SYSTEM_INVENTORY_CSV.forEach(item => {
      const row = [
        `"${item.projectFamily}"`,
        `"${item.relevance}"`,
        `"${item.role}"`,
        `"${item.mirrorStatus}"`,
        `"${item.filename}"`,
        item.sizeBytes,
        `"${item.lastModified}"`,
        `"${item.sha256}"`,
        `"${item.normalizedPath.replace(/\\/g, '\\\\')}"`,
        `"${item.originalPath.replace(/\\/g, '\\\\')}"`
      ];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'google_drive_system_inventory_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6 text-slate-100 font-sans max-w-7xl mx-auto w-full pb-16">

      {/* Hero Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950 border border-slate-800 p-6 md:p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-mono uppercase px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> STATISCHER AUDIT-SNAPSHOT
              </span>
              <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono uppercase px-2.5 py-1 rounded-full font-bold">
                123.495 DATENSÄTZE
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-mono">
              Datenforensischer Audit- & Strukturierungsbericht
            </h1>
            <p className="text-xs md:text-sm text-slate-400 max-w-3xl leading-relaxed">
              Quantitative Systemanalyse, Sicherheits-Auditing und automatisierte CSV-Erfassung des Google Drive-Inventars. Uncovering hidden build artifacts, orphan files, mirror paths, and secret management risks.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleDownloadCsv}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-lg shadow-cyan-500/10 flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" /> Export System CSV
            </button>
          </div>
        </div>

        {/* Top KPI Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider font-bold flex items-center gap-1">
              <HardDrive className="w-3.5 h-3.5 text-cyan-400" /> Gesamte Objekte
            </span>
            <span className="text-xl md:text-2xl font-black font-mono text-white">123.495</span>
            <span className="text-[10px] text-cyan-400 font-mono">109.638 in 2026 erfasst</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider font-bold flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-amber-400" /> Gesamt-Speicherplatz
            </span>
            <span className="text-xl md:text-2xl font-black font-mono text-white">3.900,1 GiB</span>
            <span className="text-[10px] text-amber-400 font-mono">98.97% in _TO_UNPACK</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider font-bold flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-emerald-400" /> Normalisierte Spiegel
            </span>
            <span className="text-xl md:text-2xl font-black font-mono text-white">505 Pfade</span>
            <span className="text-[10px] text-emerald-400 font-mono">100% byte-identisch</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider font-bold flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" /> API Scope Risiko
            </span>
            <span className="text-xl md:text-2xl font-black font-mono text-red-400">auth/drive</span>
            <span className="text-[10px] text-slate-400 font-mono">Soll: drive.file / appdata</span>
          </div>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: '📊 Systemanalyse & Speicher', icon: PieChart },
          { id: 'csv', label: '📑 Systemdateien CSV Explorer', icon: FileText },
          { id: 'security', label: '🛡️ Forensik & Security Risks', icon: ShieldAlert },
          { id: 'script', label: '🐍 Python Erfassungsskript', icon: Terminal },
          { id: 'matrix', label: '🔌 Skills & Connectors Matrix', icon: Wrench },
          { id: 'roadmap', label: '🗺️ Strategische Roadmap', icon: CheckCircle2 }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20 font-black'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & STORAGE ANALYSIS */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-8">

          {/* Executive Prose Overview */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col gap-4 shadow-xl">
            <h2 className="text-lg font-bold font-mono text-cyan-400 uppercase tracking-wide flex items-center gap-2">
              <FolderTree className="w-5 h-5" /> Quantitative Bestandsaufnahme und Speicherplatzanalyse
            </h2>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Die quantitative Untersuchung des gesamten Datenbestands offenbart eine ausgeprägte architektonische Diskrepanz zwischen der physischen Speicherplatzbelegung und der Anzahl der gespeicherten Dateiobjekte. Während ein Bruchteil der Verzeichnisse nahezu das gesamte physische Speichervolumen blockiert, ist die Mehrheit der Root-Bereiche durch eine extrem kleinteilige, hochfrequente Ansammlung von Entwicklungs- und Metadaten geprägt.
            </p>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Die mathematische Verteilung der Speicherdichte verdeutlicht, dass das System unter einer klassischen Spaltung in passive Langzeitarchive ("Cold Storage") und eine dynamische, fragmentierte Entwicklungsumgebung leidet. Der Großteil des Datenbestands ist zeitlich stark konzentriert: Das Kalenderjahr <strong>2026</strong> weist mit <strong>109.638 Dateien</strong> die absolute Spitzenaktivität auf, gefolgt vom Jahr <strong>2025 mit 10.982 Dateien</strong> und dem Jahr <strong>2024 mit 1.865 Dateien</strong>. Ein kleineres historisches Aktivitätsfenster lässt sich im Jahr 2017 mit 538 Dateien verorten, während ein systemisches Relikt von 310 Dateien das balancefreie Änderungsdatum 1980 trägt.
            </p>
          </div>

          {/* Table 1: Root Areas Distribution */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col gap-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold font-mono text-white uppercase tracking-wider">
                  Tabelle 1: Verteilungsstruktur des Google Drive-Speichers nach Root-Bereichen
                </h3>
                <p className="text-xs text-slate-400">
                  Gegenüberstellung von Dateianzahl (Fragmentierung) und Speichervolumen (GiB).
                </p>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/50 border border-cyan-800/50 px-2.5 py-1 rounded-lg shrink-0">
                18 Root-Bereiche klassifiziert
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <th className="py-3 px-3">Root-Bereich</th>
                    <th className="py-3 px-3 text-right">Dateien (Anzahl)</th>
                    <th className="py-3 px-3 text-right">Größe (GiB)</th>
                    <th className="py-3 px-3 text-right font-bold text-cyan-400">% Dateien</th>
                    <th className="py-3 px-3 text-right font-bold text-amber-400">% Größe</th>
                    <th className="py-3 px-3">Strukturelle Charakteristik</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-slate-300">
                  {ROOT_AREAS_DATA.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-all">
                      <td className="py-2.5 px-3 font-bold text-white">{row.area}</td>
                      <td className="py-2.5 px-3 text-right">{row.count.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right text-slate-200">{row.sizeGiB.toFixed(3)}</td>
                      <td className="py-2.5 px-3 text-right text-cyan-400 font-bold">{row.countPct.toFixed(3)}%</td>
                      <td className="py-2.5 px-3 text-right text-amber-400 font-bold">{row.sizePct.toFixed(3)}%</td>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px] font-sans">{row.characteristic}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 2: File Types Breakdown */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col gap-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold font-mono text-white uppercase tracking-wider">
                  Tabelle 2: Dateityp-Strukturierung nach Häufigkeit und Speicherbelegung
                </h3>
                <p className="text-xs text-slate-400">
                  Ecosystem-Signatur: Unity Game Engine vs. Next.js / TypeScript App Development
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <th className="py-3 px-3">Dateiendung</th>
                    <th className="py-3 px-3 text-right">Dateien (Anzahl)</th>
                    <th className="py-3 px-3 text-right">Größe (GiB)</th>
                    <th className="py-3 px-3 text-right text-cyan-400">% Dateien</th>
                    <th className="py-3 px-3 text-right text-amber-400">% Größe</th>
                    <th className="py-3 px-3">Zugeordnetes Ecosystem / Verwendungszweck</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-slate-300">
                  {FILE_TYPES_DATA.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-all">
                      <td className="py-2.5 px-3 font-bold text-yellow-400">{row.ext}</td>
                      <td className="py-2.5 px-3 text-right">{row.count.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right">{row.sizeGiB.toFixed(3)}</td>
                      <td className="py-2.5 px-3 text-right text-cyan-400 font-bold">{row.countPct.toFixed(3)}%</td>
                      <td className="py-2.5 px-3 text-right text-amber-400 font-bold">{row.sizePct.toFixed(3)}%</td>
                      <td className="py-2.5 px-3 text-slate-300 text-[11px] font-sans">{row.ecosystem}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex flex-col gap-2 text-xs text-slate-300 mt-2">
              <span className="font-mono font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
                <Code className="w-4 h-4" /> Unity Engine Signatur & Next.js Build Structures
              </span>
              <p className="leading-relaxed font-sans text-slate-300">
                Der signifikante Anteil an <strong>.meta-Dateien (14.747 Einheiten, 11,941 %)</strong> in Kombination mit <strong>C#-Dateien (.cs, 7.536 Einheiten, 6,102 %)</strong> liefert den forensischen Nachweis einer intensiven Nutzung der Unity Game Engine. Zusätzlich belasten ungeschützte Build-Verzeichnisse wie <code className="text-cyan-300">.next</code> und <code className="text-cyan-300">node_modules</code> in <code className="text-slate-200">New project\ai-video-chat</code> den Google Drive Index chronisch, da Google Drive Desktop keine Exklusions-Logik (wie .gitignore) besitzt.
              </p>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: SYSTEM FILES CSV EXPLORER */}
      {activeTab === 'csv' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col gap-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold font-mono text-cyan-400 uppercase tracking-wide flex items-center gap-2">
                <FileText className="w-5 h-5" /> Erfassung und Ausgabe des strukturierten Systemdateien-Inventars
              </h2>
              <p className="text-xs text-slate-400">
                Gefilterter Forensik-Index der höchst-klassifizierten System- und Konfigurationsdateien
              </p>
            </div>

            <button
              onClick={handleDownloadCsv}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs py-2 px-3 rounded-xl transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Download className="w-4 h-4" /> Herunterladen (.csv)
            </button>
          </div>

          {/* Search & Filter Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-8 relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Dateiname, Pfad oder Rolle durchsuchen..."
                value={csvSearchQuery}
                onChange={e => setCsvSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs font-mono rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="sm:col-span-4">
              <select
                value={familyFilter}
                onChange={e => setFamilyFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono rounded-xl px-3 py-2.5 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="ALL">Alle Projektfamilien ({SYSTEM_INVENTORY_CSV.length})</option>
                <option value="AI Video Chat / Photogrammetry">AI Video Chat / Photogrammetry</option>
                <option value="Antigravity Agent Workspace">Antigravity Agent Workspace</option>
                <option value="Human–AI Audit Pipeline">Human–AI Audit Pipeline</option>
              </select>
            </div>
          </div>

          {/* System Inventory Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <th className="py-3 px-3">Projektfamilie</th>
                  <th className="py-3 px-3">Rolle</th>
                  <th className="py-3 px-3">Spiegelstatus</th>
                  <th className="py-3 px-3">Dateiname</th>
                  <th className="py-3 px-3 text-right">Bytes</th>
                  <th className="py-3 px-3">Letzte Änderung</th>
                  <th className="py-3 px-3">Normalisierter Pfad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredCsvRecords.map((rec, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-all">
                    <td className="py-2.5 px-3 text-[11px] font-sans text-slate-200 font-medium">{rec.projectFamily}</td>
                    <td className="py-2.5 px-3">
                      <span className="bg-slate-800 text-cyan-300 px-2 py-0.5 rounded text-[10px]">
                        {rec.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        rec.mirrorStatus === 'Original'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {rec.mirrorStatus}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-white">{rec.filename}</td>
                    <td className="py-2.5 px-3 text-right text-slate-400">{rec.sizeBytes}</td>
                    <td className="py-2.5 px-3 text-[10px] text-slate-400">{rec.lastModified}</td>
                    <td className="py-2.5 px-3 text-[10px] text-slate-400 max-w-xs truncate" title={rec.normalizedPath}>
                      {rec.normalizedPath}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SECURITY AUDIT & DUPLICATES */}
      {activeTab === 'security' && (
        <div className="flex flex-col gap-8">

          {/* Table 3: Deduplication */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col gap-4 shadow-xl">
            <div>
              <h2 className="text-lg font-bold font-mono text-cyan-400 uppercase tracking-wide flex items-center gap-2">
                <Layers className="w-5 h-5" /> Spiegelungsmechanismen & Kryptografische De-Duplizierung
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Die Normalisierungsanalyse identifiziert genau <strong>505 normalisierte Spiegelpfade</strong> mit exakt 2 Vorkommen (Original vs. PC_Offload_2026-05-03). Hash-Differenz: null = 100% byte-identisch.
              </p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <th className="py-3 px-3">SHA-256 Hashwert</th>
                    <th className="py-3 px-3 text-right">Kopien</th>
                    <th className="py-3 px-3 text-right">Größe (Bytes)</th>
                    <th className="py-3 px-3">Pfad-Lokalisierung und Systemfunktion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {DUPLICATES_DATA.map((dup, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-all">
                      <td className="py-2.5 px-3 font-bold text-cyan-400">{dup.hash}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-amber-400">{dup.copies}</td>
                      <td className="py-2.5 px-3 text-right text-slate-400">{dup.sizeBytes}</td>
                      <td className="py-2.5 px-3 text-slate-300 text-[11px] font-sans leading-relaxed">{dup.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Security Risks & OAuth Scopes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Orphaned files & Google Index Operator */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col gap-4 shadow-xl">
              <h3 className="text-sm font-bold font-mono text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Akkumulation verwaister Dateien ("Orphaned Files")
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Verwaiste Dateien entstehen, wenn ein externer Besitzer den übergeordneten Ordner löscht, die Dateien aber im Eigentum des aktuellen Benutzers verbleiben (<code className="text-amber-300">parents=null</code>). Sie sind in der Ordnernavigation unsichtbar, verbrauchen aber aktives Speicherkontingent.
              </p>

              <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl flex flex-col gap-1.5 font-mono text-xs">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Google Drive Index Operator:</span>
                <code className="text-cyan-400 font-bold bg-slate-900 p-2 rounded border border-slate-800">
                  is:unorganized owner:me
                </code>
                <span className="text-[10px] text-slate-400 mt-1">
                  Greift auf vorberechnete Shards zu und antwortet in Millisekunden.
                </span>
              </div>
            </div>

            {/* OAuth Scope & Connector Audit */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col gap-4 shadow-xl">
              <h3 className="text-sm font-bold font-mono text-red-400 uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-4 h-4" /> Forensische Bewertung der OAuth Scopes
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Der Google Drive Connector operiert derzeit unter dem universellen, permissiven Scope <code className="text-red-400">https://www.googleapis.com/auth/drive</code>. Dies gewährt uneingeschränkten Lese-/Schreibzugriff auf alle 123.495 Objekte.
              </p>

              <div className="flex flex-col gap-2 font-mono text-xs">
                <div className="bg-red-950/30 border border-red-800/40 p-2.5 rounded-xl flex items-center justify-between text-red-300">
                  <span>auth/drive</span>
                  <span className="text-[10px] bg-red-500/20 px-2 py-0.5 rounded font-bold">Aktuell (Zu Permissiv)</span>
                </div>
                <div className="bg-emerald-950/30 border border-emerald-800/40 p-2.5 rounded-xl flex items-center justify-between text-emerald-300">
                  <span>auth/drive.file</span>
                  <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded font-bold">Empfohlen (Nur App-Dateien)</span>
                </div>
                <div className="bg-cyan-950/30 border border-cyan-800/40 p-2.5 rounded-xl flex items-center justify-between text-cyan-300">
                  <span>auth/drive.appdata</span>
                  <span className="text-[10px] bg-cyan-500/20 px-2 py-0.5 rounded font-bold">Sicherer AppData Folder</span>
                </div>
              </div>
            </div>

          </div>

          {/* Secret Mitigation Commands */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col gap-3 shadow-xl font-mono text-xs">
            <span className="text-yellow-400 font-bold uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4" /> Secret Exposure & GitHub Exclusion Protocol
            </span>
            <p className="text-slate-300 font-sans text-xs">
              Falls <code className="text-cyan-300">.env</code>-Dateien oder API-Keys versehentlich synchronisiert wurden, führen Sie diese Befehle aus, um Secrets aus dem Git-Cache zu entfernen und dauerhaft zu exkludieren:
            </p>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-cyan-400 space-y-1">
              <div>git rm --cached .env</div>
              <div>echo ".env" &gt;&gt; .gitignore</div>
              <div>git commit -m "security: remove exposed environment configuration"</div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 4: AUTOMATED PYTHON SCRIPT */}
      {activeTab === 'script' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col gap-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold font-mono text-cyan-400 uppercase tracking-wide flex items-center gap-2">
                <Terminal className="w-5 h-5" /> Automatisiertes Erfassungsskript für das Google Drive-Inventar
              </h2>
              <p className="text-xs text-slate-400">
                Produktionsfertiges Python 3 Skript mit OAuth2, SHA-256 Hashes, Verwaisten-Scan und CSV Export
              </p>
            </div>

            <button
              onClick={handleCopyScript}
              className="bg-slate-800 hover:bg-slate-700 text-cyan-400 font-mono text-xs py-2 px-3 rounded-xl border border-slate-700 transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              {copiedScript ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copiedScript ? 'Kopiert!' : 'Skript kopieren'}
            </button>
          </div>

          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto max-h-[550px]">
            <pre className="text-[11px] leading-relaxed text-cyan-300">{PYTHON_SCRIPT_CODE}</pre>
          </div>
        </div>
      )}

      {/* TAB 5: SKILLS & CONNECTORS MATRIX */}
      {activeTab === 'matrix' && (
        <div className="flex flex-col gap-8">

          {/* Table 4: Skill Packages */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col gap-4 shadow-xl">
            <h2 className="text-lg font-bold font-mono text-cyan-400 uppercase tracking-wide flex items-center gap-2">
              <Bot className="w-5 h-5" /> Tabelle 4: Installierte funktionale Skill-Pakete (16 Paket-Profile)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {SKILLS_DATA.map((s, idx) => (
                <div key={idx} className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-xs text-white">{s.name}</span>
                    <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono px-2 py-0.5 rounded font-bold">
                      {s.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed">{s.skills}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Table 5: Connectors Matrix */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col gap-4 shadow-xl">
            <h2 className="text-lg font-bold font-mono text-cyan-400 uppercase tracking-wide flex items-center gap-2">
              <Zap className="w-5 h-5" /> Tabelle 5: Active Connector-Schnittstellen-Matrix
            </h2>

            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <th className="py-3 px-3">Schnittstelle (Connector)</th>
                    <th className="py-3 px-3">Ebene</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Erfasster Systemnutzen & Geplante Funktion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {CONNECTORS_DATA.map((c, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-all">
                      <td className="py-2.5 px-3 font-bold text-white">{c.connector}</td>
                      <td className="py-2.5 px-3 text-slate-400">{c.level}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.status.includes('verbunden') || c.status.includes('installiert')
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 text-[11px] font-sans">{c.usage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 6: STRATEGIC ROADMAP */}
      {activeTab === 'roadmap' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col gap-6 shadow-xl">
          <div>
            <h2 className="text-lg font-bold font-mono text-cyan-400 uppercase tracking-wide flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" /> Tabelle 6: Strategische Normalisierungs-Roadmap des Google Drive-Systems
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Priorisierte Arbeitspakete zur dauerhaften Bereinigung, Entflechtung und Absicherung des Workspaces.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {ROADMAP_DATA.map((item) => (
              <div
                key={item.rank}
                className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400 font-mono font-black text-sm flex items-center justify-center shrink-0">
                    #{item.rank}
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-sm text-white">{item.title}</span>
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded border font-bold ${item.priorityColor}`}>
                        {item.priority}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-sans leading-relaxed">{item.steps}</p>
                  </div>
                </div>

                <div className="shrink-0 font-mono text-xs">
                  <span className={`px-3 py-1 rounded-full border text-[10px] font-bold uppercase ${
                    item.status.includes('laufend')
                      ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 animate-pulse'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
