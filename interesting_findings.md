# 🔍 Interesting Findings & Anomalies Audit Report

### High-Value / Historical Archive Identifications

1. **Google Takeout Full Export Tranches (14.06.2025 & 24/25.10.2025)**
   - Detected multi-gigabyte Takeout archives representing over 68 services (Google Photos, Drive, Mail).

2. **ChatGPT & OpenAI Export Archives**
   - Identified `conversations.json`, `chat.html` (689 MB), and `chat.zip` (149 MB) historical conversation histories.

3. **Extracted Mirror Directories**
   - Found pre-extracted folders matching `de7665a9d4ac..._unzipped` and `ChatGPT_Vollarchiv`.

4. **Partial Download Residuals**
   - Found `.opdownload` and `.part` files in `_TO_UNPACK_IN_CLOUD` which should be preserved but kept separate from clean extractions.
