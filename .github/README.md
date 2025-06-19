# K3SS Search

## Overview
A comprehensive web application for discovering, searching, and collecting documents from various storage locations for LLM processing.

## Quick Start
```bash
git clone https://github.com/k3ss-official/k3ss-search.git
cd k3ss-search
chmod +x install.sh
./install.sh
```

## Features
- 🔍 Smart file discovery across local and cloud storage
- 📄 Multi-format document parsing (PDF, Word, Excel, etc.)
- 🔎 Advanced search with multiple terms
- 🤖 LLM-ready formatted output
- 💻 Modern React web interface

## Architecture
- **Backend**: Flask API with document parsing services
- **Frontend**: React application with Tailwind CSS
- **Storage**: Supports local drives, Google Drive, iCloud, Dropbox, OneDrive

## Supported File Types
- Documents: PDF, Word (.docx, .doc)
- Spreadsheets: Excel (.xlsx, .xls), CSV
- Text: .txt, .md, .rtf
- Code: .py, .js, .html, .css, .json

## Installation Requirements
- Python 3.11+
- Node.js 18+
- Conda/Miniconda (recommended)

## Usage
1. Run the application with `./start_app.sh`
2. Open http://localhost:5173
3. Select storage locations to search
4. Enter search terms (comma-separated)
5. Select files from results
6. Format and copy for LLM use

## Development
See README.md for detailed development instructions and API documentation.

## License
MIT License - see LICENSE file for details.

