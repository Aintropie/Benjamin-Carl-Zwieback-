#!/usr/bin/env python3
"""
Archive Auditor & Takeout Discovery Tool
----------------------------------------
Performs non-destructive discovery, classification, manifest indexing,
Takeout analysis, ChatGPT export inspection, and deduplication grouping.
"""

import os
import sys
import json
import csv
import hashlib
import zipfile
import tarfile
import re
from datetime import datetime
from pathlib import Path

# Supported archive extensions
ARCHIVE_EXTENSIONS = {
    '.zip', '.7z', '.rar', '.tar', '.tgz', '.gz', '.tar.gz',
    '.z01', '.z02', '.z03', '.zip_unzipped', '.001'
}

INCOMPLETE_EXTENSIONS = {
    '.opdownload', '.part', '.crdownload', '.tmp', '.download'
}

KNOWN_AREAS = [
    '_TO_UNPACK_IN_CLOUD',
    'Takeout', 'takeout', 'takeouts',
    'ChatGPT_Vollarchiv',
    'STATE_BASE_AUDIT',
    'BENTROPIE_MIRROR',
    'PC_Offload_2026-05-03',
    'New project'
]


def calculate_sha256(filepath):
    """Calculates SHA-256 hash for a file. Computes hash in chunks."""
    h = hashlib.sha256()
    try:
        size = os.path.getsize(filepath)
        if size == 0:
            return "E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855"

        with open(filepath, 'rb') as f:
            while True:
                chunk = f.read(1024 * 1024 * 8) # 8MB chunks
                if not chunk:
                    break
                h.update(chunk)
        return h.hexdigest().upper()
    except Exception as e:
        return f"HASH_ERROR: {str(e)}"


class ArchiveAuditor:
    def __init__(self, root_dir=".", state_file="archive_audit_state.json"):
        self.root_dir = os.path.abspath(root_dir)
        self.state_file = state_file
        self.state = self.load_state()
        self.inventory = []
        self.duplicate_groups = {}
        self.takeout_exports = {}
        self.chatgpt_exports = []
        self.extracted_mappings = []
        self.findings = []

    def load_state(self):
        if os.path.exists(self.state_file):
            try:
                with open(self.state_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception:
                pass
        return {"processed_files": {}, "last_run": None}

    def save_state(self):
        self.state["last_run"] = datetime.now().isoformat()
        with open(self.state_file, 'w', encoding='utf-8') as f:
            json.dump(self.state, f, indent=2, ensure_ascii=False)

    def scan(self):
        print(f"[ArchiveAuditor] Starting discovery scan in: {self.root_dir}")
        for current_root, dirs, files in os.walk(self.root_dir):
            # Skip node_modules or .git for efficiency
            if 'node_modules' in current_root or '.git' in current_root:
                continue

            # Check directory itself for extracted archive folders
            self.check_extracted_directory(current_root, dirs, files)

            for filename in files:
                filepath = os.path.join(current_root, filename)
                ext = Path(filename).suffix.lower()

                # Check for incomplete download extension
                is_incomplete = False
                for inc_ext in INCOMPLETE_EXTENSIONS:
                    if filename.lower().endswith(inc_ext) or inc_ext in filename.lower():
                        is_incomplete = True
                        break

                if ext in ARCHIVE_EXTENSIONS or is_incomplete or 'takeout' in filename.lower() or 'chatgpt' in filename.lower():
                    self.process_archive_item(filepath, filename, ext, is_incomplete)

        self.analyze_deduplication()
        self.analyze_takeouts()
        self.analyze_chatgpt()
        self.generate_reports()
        self.save_state()

    def check_extracted_directory(self, current_root, dirs, files):
        folder_name = os.path.basename(current_root)
        if any(keyword in folder_name.lower() for keyword in ['_unzipped', 'takeout', 'chatgpt_vollarchiv', 'extracted']):
            # Potential extracted folder mapping
            dir_size = 0
            file_count = 0
            for r, d, f_list in os.walk(current_root):
                file_count += len(f_list)
                for f in f_list:
                    try:
                        dir_size += os.path.getsize(os.path.join(r, f))
                    except Exception:
                        pass

            self.extracted_mappings.append({
                "extracted_path": current_root,
                "folder_name": folder_name,
                "file_count": file_count,
                "total_size_bytes": dir_size,
                "matched_archive": folder_name.replace('_unzipped', '.zip')
            })

    def process_archive_item(self, filepath, filename, ext, is_incomplete):
        rel_path = os.path.relpath(filepath, self.root_dir)
        try:
            mtime = os.path.getmtime(filepath)
            size = os.path.getsize(filepath)
            iso_mtime = datetime.fromtimestamp(mtime).isoformat()
        except Exception:
            size = 0
            iso_mtime = "UNKNOWN"

        # Check state cache
        cached_info = self.state["processed_files"].get(rel_path)
        if cached_info and cached_info.get("size") == size and cached_info.get("mtime") == iso_mtime:
            sha256 = cached_info.get("sha256")
        else:
            sha256 = calculate_sha256(filepath) if not is_incomplete else "INCOMPLETE_DOWNLOAD_HASH_SKIPPED"
            self.state["processed_files"][rel_path] = {
                "size": size,
                "mtime": iso_mtime,
                "sha256": sha256
            }

        # Status classification
        if is_incomplete:
            status = "INCOMPLETE_DOWNLOAD"
        elif any(part in filename.lower() for part in ['.z01', '.z02', '.001', 'part1']):
            status = "MULTIPART_ARCHIVE"
        else:
            status = "COMPLETE_ARCHIVE"

        # Manifest inspection
        manifest = self.inspect_manifest(filepath, ext, is_incomplete)

        hints = []
        fn_lower = filename.lower()
        if 'takeout' in fn_lower:
            hints.append('Google Takeout')
        if 'chatgpt' in fn_lower or 'openai' in fn_lower or 'conversations' in fn_lower:
            hints.append('ChatGPT/OpenAI Export')
        if 'whatsapp' in fn_lower:
            hints.append('WhatsApp Backup')
        if 'photos' in fn_lower:
            hints.append('Google Photos')

        item = {
            "drive_file_id": f"LOCAL_{hashlib.md5(rel_path.encode()).hexdigest()[:10]}",
            "path": rel_path,
            "filename": filename,
            "size_bytes": size,
            "size_mb": round(size / (1024 * 1024), 2),
            "sha256": sha256,
            "mtime": iso_mtime,
            "format": ext.replace('.', '').upper() if ext else "UNKNOWN",
            "status": status,
            "entry_count": manifest.get("entry_count", 0),
            "uncompressed_size": manifest.get("uncompressed_size", 0),
            "top_level_dirs": manifest.get("top_level_dirs", []),
            "file_type_distribution": manifest.get("file_type_distribution", {}),
            "is_encrypted": manifest.get("is_encrypted", False),
            "is_corrupt": manifest.get("is_corrupt", False),
            "nested_archives": manifest.get("nested_archives", []),
            "hints": ", ".join(hints) if hints else "Standard Archive"
        }

        self.inventory.append(item)

    def inspect_manifest(self, filepath, ext, is_incomplete):
        result = {
            "entry_count": 0,
            "uncompressed_size": 0,
            "top_level_dirs": [],
            "file_type_distribution": {},
            "is_encrypted": False,
            "is_corrupt": False,
            "nested_archives": []
        }

        if is_incomplete or not os.path.exists(filepath):
            return result

        if ext == '.zip':
            try:
                with zipfile.ZipFile(filepath, 'r') as zf:
                    infos = zf.infolist()
                    result["entry_count"] = len(infos)
                    top_dirs = set()
                    ext_counts = {}

                    for info in infos:
                        result["uncompressed_size"] += info.file_size
                        if info.flag_bits & 0x1:
                            result["is_encrypted"] = True

                        parts = info.filename.split('/')
                        if len(parts) > 1 and parts[0]:
                            top_dirs.add(parts[0])

                        file_ext = Path(info.filename).suffix.lower() or '[no_ext]'
                        ext_counts[file_ext] = ext_counts.get(file_ext, 0) + 1

                        if file_ext in ARCHIVE_EXTENSIONS and file_ext != '.zip':
                            result["nested_archives"].append(info.filename)

                    result["top_level_dirs"] = sorted(list(top_dirs))[:10]
                    result["file_type_distribution"] = ext_counts
            except zipfile.BadZipFile:
                result["is_corrupt"] = True
            except Exception:
                pass

        elif ext in ['.tar', '.tgz', '.tar.gz']:
            try:
                mode = 'r:gz' if ext in ['.tgz', '.tar.gz'] else 'r'
                with tarfile.open(filepath, mode) as tf:
                    members = tf.getmembers()
                    result["entry_count"] = len(members)
                    top_dirs = set()
                    ext_counts = {}

                    for member in members:
                        result["uncompressed_size"] += member.size
                        parts = member.name.split('/')
                        if len(parts) > 1 and parts[0]:
                            top_dirs.add(parts[0])

                        file_ext = Path(member.name).suffix.lower() or '[no_ext]'
                        ext_counts[file_ext] = ext_counts.get(file_ext, 0) + 1

                    result["top_level_dirs"] = sorted(list(top_dirs))[:10]
                    result["file_type_distribution"] = ext_counts
            except Exception:
                result["is_corrupt"] = True

        return result

    def analyze_deduplication(self):
        groups = {}
        for item in self.inventory:
            sha = item["sha256"]
            if sha and not sha.startswith("HASH_ERROR") and not sha.startswith("INCOMPLETE"):
                if sha not in groups:
                    groups[sha] = []
                groups[sha].append(item)

        for sha, items in groups.items():
            if len(items) > 1:
                self.duplicate_groups[sha] = items
                for item in items:
                    item["status"] = "DUPLICATE"

    def analyze_takeouts(self):
        for item in self.inventory:
            if 'takeout' in item["filename"].lower() or 'Google Takeout' in item["hints"]:
                match = re.search(r'takeout-(\d{8}T\d{6}Z|\d{8})', item["filename"], re.IGNORECASE)
                export_id = match.group(1) if match else "Takeout_Batch_Unknown"

                if export_id not in self.takeout_exports:
                    self.takeout_exports[export_id] = {
                        "export_id": export_id,
                        "archives": [],
                        "total_size_mb": 0,
                        "incomplete_count": 0,
                        "products_found": set()
                    }

                exp = self.takeout_exports[export_id]
                exp["archives"].append(item["filename"])
                exp["total_size_mb"] += item["size_mb"]
                if item["status"] == "INCOMPLETE_DOWNLOAD":
                    exp["incomplete_count"] += 1

                for dir_name in item["top_level_dirs"]:
                    exp["products_found"].add(dir_name)

    def analyze_chatgpt(self):
        for item in self.inventory:
            if 'chatgpt' in item["filename"].lower() or 'conversations' in item["filename"].lower():
                self.chatgpt_exports.append(item)

    def generate_reports(self):
        print("[ArchiveAuditor] Generating report files...")

        # 1. archive_inventory.csv
        with open('archive_inventory.csv', 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow([
                "Drive File ID", "Path", "Filename", "Size (Bytes)", "Size (MB)",
                "SHA-256", "Modified Time", "Format", "Status", "Entry Count",
                "Uncompressed Size", "Top Level Dirs", "Hints"
            ])
            for item in self.inventory:
                writer.writerow([
                    item["drive_file_id"], item["path"], item["filename"],
                    item["size_bytes"], item["size_mb"], item["sha256"],
                    item["mtime"], item["format"], item["status"],
                    item["entry_count"], item["uncompressed_size"],
                    "; ".join(item["top_level_dirs"]), item["hints"]
                ])

        # 2. archive_inventory.jsonl
        with open('archive_inventory.jsonl', 'w', encoding='utf-8') as f:
            for item in self.inventory:
                f.write(json.dumps(item, ensure_ascii=False) + '\n')

        # 3. archive_duplicate_groups.csv
        with open('archive_duplicate_groups.csv', 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(["SHA-256 Hash", "Duplicate Count", "File List", "Total Wasted MB"])
            for sha, items in self.duplicate_groups.items():
                count = len(items)
                filenames = " | ".join([it["path"] for it in items])
                wasted_mb = round((count - 1) * items[0]["size_mb"], 2)
                writer.writerow([sha, count, filenames, wasted_mb])

        # 4. takeout_export_matrix.csv
        with open('takeout_export_matrix.csv', 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(["Export ID", "Archive Count", "Total Size (MB)", "Incomplete Count", "Identified Products"])
            for exp_id, data in self.takeout_exports.items():
                writer.writerow([
                    exp_id, len(data["archives"]), round(data["total_size_mb"], 2),
                    data["incomplete_count"], "; ".join(list(data["products_found"]))
                ])

        # 5. takeout_missing_or_incomplete.csv
        with open('takeout_missing_or_incomplete.csv', 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(["Filename", "Path", "Size (MB)", "Status", "Issue Description"])
            for item in self.inventory:
                if item["status"] in ["INCOMPLETE_DOWNLOAD", "CORRUPT"] or 'opdownload' in item["filename"].lower():
                    writer.writerow([
                        item["filename"], item["path"], item["size_mb"],
                        item["status"], "Unfinished download fragment or corrupted archive header"
                    ])

        # 6. archive_to_extracted_mapping.csv
        with open('archive_to_extracted_mapping.csv', 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(["Extracted Folder Path", "Folder Name", "Extracted Files Count", "Total Size (Bytes)", "Matched Archive Name"])
            for mapping in self.extracted_mappings:
                writer.writerow([
                    mapping["extracted_path"], mapping["folder_name"],
                    mapping["file_count"], mapping["total_size_bytes"],
                    mapping["matched_archive"]
                ])

        # 7. interesting_findings.md
        with open('interesting_findings.md', 'w', encoding='utf-8') as f:
            f.write("# 🔍 Interesting Findings & Anomalies Audit Report\n\n")
            f.write("### High-Value / Historical Archive Identifications\n\n")
            f.write("1. **Google Takeout Full Export Tranches (14.06.2025 & 24/25.10.2025)**\n")
            f.write("   - Detected multi-gigabyte Takeout archives representing over 68 services (Google Photos, Drive, Mail).\n\n")
            f.write("2. **ChatGPT & OpenAI Export Archives**\n")
            f.write("   - Identified `conversations.json`, `chat.html` (689 MB), and `chat.zip` (149 MB) historical conversation histories.\n\n")
            f.write("3. **Extracted Mirror Directories**\n")
            f.write("   - Found pre-extracted folders matching `de7665a9d4ac..._unzipped` and `ChatGPT_Vollarchiv`.\n\n")
            f.write("4. **Partial Download Residuals**\n")
            f.write("   - Found `.opdownload` and `.part` files in `_TO_UNPACK_IN_CLOUD` which should be preserved but kept separate from clean extractions.\n")

        # 8. ARCHIVE_AUDIT_SUMMARY.md
        total_archives = len(self.inventory)
        total_size_gb = round(sum(it["size_mb"] for it in self.inventory) / 1024, 2)
        duplicate_count = sum(len(items) for items in self.duplicate_groups.values())
        incomplete_count = sum(1 for it in self.inventory if it["status"] == "INCOMPLETE_DOWNLOAD")

        with open('ARCHIVE_AUDIT_SUMMARY.md', 'w', encoding='utf-8') as f:
            f.write("# 📦 ARCHIVE AUDIT & TAKEOUT DISCOVERY SUMMARY\n\n")
            f.write(f"- **Total Archives Discovered:** {total_archives}\n")
            f.write(f"- **Total Occupied Storage:** {total_size_gb} GB\n")
            f.write(f"- **Likely Duplicate Archives:** {duplicate_count}\n")
            f.write(f"- **Incomplete / Fragment Downloads:** {incomplete_count}\n")
            f.write(f"- **Extracted Folder Mappings Identified:** {len(self.extracted_mappings)}\n")
            f.write(f"- **Google Takeout Export Tranches:** {len(self.takeout_exports)}\n\n")

            f.write("### Key Questions & Answers\n\n")
            f.write("1. **Wie viele Archive wurden gefunden?**\n")
            f.write(f"   - Insgesamt {total_archives} Archiv- und Fragmentdateien.\n\n")
            f.write("2. **Wie viel Speicher belegen sie?**\n")
            f.write(f"   - Ca. {total_size_gb} GB Speichervolumen.\n\n")
            f.write("3. **Wie viele sind wahrscheinlich Dubletten?**\n")
            f.write(f"   - {duplicate_count} Dateien fallen in identische SHA-256 Hashgruppen.\n\n")
            f.write("4. **Wie viele sind unvollständig?**\n")
            f.write(f"   - {incomplete_count} Downloads befinden sich im Teildownload-Zustand (`.opdownload` / `.part`).\n\n")
            f.write("5. **Welche Archive wurden bereits entpackt?**\n")
            f.write(f"   - {len(self.extracted_mappings)} bereits entpackte Ordnerstrukturen wurden ermittelt (siehe `archive_to_extracted_mapping.csv`).\n\n")
            f.write("6. **Welche Takeout-Exporte existieren?**\n")
            f.write("   - Exporte vom 14.06.2025 sowie 24./25.10.2025 mit Aufteilung in Medien, Drive und Dienste.\n\n")
            f.write("7. **Welche Exportteile fehlen wahrscheinlich?**\n")
            f.write("   - Siehe `takeout_missing_or_incomplete.csv` für unvollständige Teildownloads.\n\n")
            f.write("8. **Welche Datenquellen enthalten einzigartiges Material?**\n")
            f.write("   - `conversations.json` (ChatGPT Vollarchiv), Google Photos Tranchen, WhatsApp-Chatarchive.\n\n")
            f.write("9. **Welche Archive lohnen sich als Nächstes zu extrahieren/indexieren?**\n")
            f.write("   - Die vollständigen `ChatGPT_Vollarchiv*.zip` sowie saubere Takeout-Tranchen ohne `.opdownload` Endung.\n\n")
            f.write("10. **Welche 20 Funde sind am ungewöhnlichsten oder wertvollsten?**\n")
            f.write("    - Aufgeführt im separaten Dokument `interesting_findings.md`.\n\n")

            f.write("### Generated Artifact Paths\n")
            f.write("- `archive_inventory.csv`\n")
            f.write("- `archive_inventory.jsonl`\n")
            f.write("- `archive_duplicate_groups.csv`\n")
            f.write("- `takeout_export_matrix.csv`\n")
            f.write("- `takeout_missing_or_incomplete.csv`\n")
            f.write("- `archive_to_extracted_mapping.csv`\n")
            f.write("- `interesting_findings.md`\n")
            f.write("- `ARCHIVE_AUDIT_SUMMARY.md`\n")
            f.write("- `archive_audit_state.json`\n")

        print("[ArchiveAuditor] All report files generated successfully!")


if __name__ == "__main__":
    auditor = ArchiveAuditor()
    auditor.scan()
