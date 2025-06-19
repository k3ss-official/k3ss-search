# K3SS Search

A comprehensive web application for discovering, searching, and collecting documents from various storage locations for LLM processing. Built with Flask backend and React frontend.

## Features

- **🔍 Smart File Discovery**: Automatically detects accessible storage locations including:
  - Local drives and home directory
  - Google Drive sync folders
  - iCloud Drive (macOS)
  - Dropbox and OneDrive
  - External drives and mounted volumes

- **📄 Multi-Format Document Parsing**: Extracts text content from:
  - PDF documents (using pdfplumber and PyPDF2)
  - Word documents (.docx, .doc)
  - Excel spreadsheets (.xlsx, .xls)
  - Text files (.txt, .md, .rtf)
  - CSV files
  - Code files (.py, .js, .html, .css, .json)

- **🔎 Advanced Search**: 
  - Multi-term search across file names and content
  - Boolean search with multiple keywords
  - File type filtering and metadata search

- **🤖 LLM-Ready Output**: 
  - Formats collected documents for optimal LLM consumption
  - Structured output with metadata and content
  - Copy-to-clipboard functionality

- **💻 Modern Web Interface**:
  - Responsive React frontend with Tailwind CSS
  - Real-time search results
  - Batch file selection and processing
  - Progress indicators and status updates

## Architecture

```
k3ss-search/
├── backend/           # Flask API server
│   ├── src/
│   │   ├── services/  # File discovery and parsing services
│   │   ├── routes/    # API endpoints
│   │   └── main.py    # Flask app entry point
│   ├── venv/          # Python virtual environment
│   └── requirements.txt
├── frontend/          # React web application
│   ├── src/
│   │   ├── components/ # UI components
│   │   └── App.jsx    # Main React component
│   └── package.json
├── install.sh         # Automated installation script
└── README.md
```

## Quick Start

### Option 1: Automated Installation (Recommended)

```bash
git clone https://github.com/k3ss-official/k3ss-search.git
cd k3ss-search
chmod +x install.sh
./install.sh
```

The install script will:
1. Check for conda/miniconda installation
2. Let you choose existing conda environment or create new one
3. Install all Python dependencies in the conda environment
4. Install Node.js dependencies
5. Create startup scripts
6. Provide clear usage instructions

### Option 2: Manual Installation

#### Prerequisites
- Python 3.11+
- Node.js 18+
- pnpm (or npm)
- Conda/Miniconda (recommended)

#### Backend Setup
```bash
cd backend
conda activate your-env  # or create new environment
pip install -r requirements.txt
```

#### Frontend Setup
```bash
cd frontend
pnpm install  # or npm install
```

#### Running the Application
```bash
# Use the automated startup script (recommended)
./start_app.sh

# Or start components separately:
# Terminal 1 - Backend
./start_backend.sh

# Terminal 2 - Frontend  
./start_frontend.sh
```

Access the application at `http://localhost:5173` (frontend) with backend API at `http://localhost:5000`

## Usage

1. **Discover Storage Locations**: The app automatically detects accessible storage locations on your system
2. **Select Locations**: Choose which locations to search from the discovered list
3. **Enter Search Terms**: Add comma-separated search terms (e.g., "Victoria, gytj, dwp ai tool")
4. **Search Files**: Click "Search Files" to find matching documents
5. **Select Results**: Choose individual files or select all results
6. **Format for LLM**: Click "Format for LLM" to generate structured output
7. **Copy Content**: Use the copy button to get LLM-ready formatted content

## Supported File Types

| Category | Extensions | Parser |
|----------|------------|--------|
| Documents | .pdf | pdfplumber, PyPDF2 |
| Word Docs | .docx, .doc | python-docx |
| Spreadsheets | .xlsx, .xls | openpyxl |
| Text Files | .txt, .md, .rtf | Built-in |
| Data Files | .csv | Built-in |
| Code Files | .py, .js, .html, .css, .json | Built-in |

## API Endpoints

- `GET /api/discover-locations` - Discover accessible storage locations
- `POST /api/search` - Search for files with specified terms
- `POST /api/format-llm` - Format selected files for LLM consumption
- `GET /api/file-content/<path>` - Get full content of a specific file

## Configuration

The application works out-of-the-box with sensible defaults. For advanced usage:

### Backend Configuration
- Port: Default 5000 (configurable in `src/main.py`)
- CORS: Enabled for all origins
- Database: SQLite (automatically created)

### Frontend Configuration
- Port: Default 5173 (Vite dev server)
- API URL: `http://localhost:5000/api` (configurable in `App.jsx`)

## Security & Privacy

- **Read-only access**: The application only reads files, never modifies them
- **Local processing**: All file processing happens locally on your machine
- **No cloud uploads**: Files are never uploaded to external services
- **Permission-based**: Only accesses files your user account can read

## Troubleshooting

### Common Issues

1. **Backend won't start - Database error**
   - Fixed in latest version - database directory is created automatically

2. **Port already in use**
   ```bash
   # Kill processes on ports 5000 and 5173
   pkill -f "python src/main.py"
   pkill -f "vite"
   ```

3. **Conda environment not active**
   ```bash
   conda activate your-env-name
   ./start_app.sh
   ```

4. **Permission denied errors**
   - Ensure your user has read access to the directories you want to search
   - On macOS, you may need to grant Terminal access to folders in System Preferences

### Performance Tips

- Limit search scope to specific directories for faster results
- Use specific search terms to reduce processing time
- Consider excluding system directories and caches

## Development

### Project Structure
```
backend/src/
├── services/
│   └── file_discovery.py    # Core file discovery and parsing logic
├── routes/
│   ├── search.py           # Search API endpoints
│   └── user.py            # User management (template)
└── main.py                # Flask application entry point

frontend/src/
├── components/ui/         # Reusable UI components (shadcn/ui)
├── App.jsx               # Main application component
└── main.jsx              # React entry point
```

### Adding New File Types

1. Add the extension to `supported_extensions` in `FileDiscoveryService`
2. Implement a parser method (e.g., `_extract_xyz_text`)
3. Add the parser to `_extract_text_content` method
4. Install any required parsing libraries

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue on GitHub
- Check the troubleshooting section above
- Review the API documentation

---

Built with ❤️ using Flask, React, and modern web technologies.

