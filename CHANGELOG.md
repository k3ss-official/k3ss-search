# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2025-06-19

### Added
- Initial release of File Search & Collection Tool
- Flask backend with file discovery and parsing services
- React frontend with modern UI using Tailwind CSS and shadcn/ui
- Support for multiple file formats (PDF, Word, Excel, text files)
- Multi-storage location discovery (local, Google Drive, iCloud, Dropbox, OneDrive)
- Advanced search functionality with multiple terms
- LLM-ready formatted output generation
- Automated installation script with conda support
- Comprehensive documentation and usage examples

### Features
- **File Discovery**: Automatic detection of accessible storage locations
- **Document Parsing**: Text extraction from PDF, Word, Excel, and other formats
- **Search Engine**: Content and filename search across multiple locations
- **LLM Integration**: Structured output formatting for AI consumption
- **Web Interface**: Responsive React application with real-time updates
- **Cross-Platform**: Support for macOS, Linux, and Windows

### Technical Details
- Backend: Flask with CORS support, SQLAlchemy ORM
- Frontend: React with Vite, Tailwind CSS, shadcn/ui components
- Document Parsing: pdfplumber, python-docx, openpyxl
- File System: Cross-platform path handling and cloud storage detection
- API: RESTful endpoints for discovery, search, and formatting

### Installation
- Automated setup script with conda environment management
- Dependency management for both Python and Node.js
- Startup scripts for easy application launching

