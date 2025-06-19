#!/bin/bash

# File Search & Collection Tool - Installation Script
# This script sets up the complete environment for the file search application

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to detect OS
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        echo "windows"
    else
        echo "unknown"
    fi
}

# Function to install conda/miniconda
install_conda() {
    local os=$(detect_os)
    print_status "Installing Miniconda..."
    
    case $os in
        "linux")
            wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O miniconda.sh
            bash miniconda.sh -b -p $HOME/miniconda3
            ;;
        "macos")
            if [[ $(uname -m) == "arm64" ]]; then
                wget https://repo.anaconda.com/miniconda/Miniconda3-latest-MacOSX-arm64.sh -O miniconda.sh
            else
                wget https://repo.anaconda.com/miniconda/Miniconda3-latest-MacOSX-x86_64.sh -O miniconda.sh
            fi
            bash miniconda.sh -b -p $HOME/miniconda3
            ;;
        *)
            print_error "Unsupported operating system: $os"
            print_error "Please install conda/miniconda manually from https://docs.conda.io/en/latest/miniconda.html"
            exit 1
            ;;
    esac
    
    # Initialize conda
    $HOME/miniconda3/bin/conda init bash
    export PATH="$HOME/miniconda3/bin:$PATH"
    rm -f miniconda.sh
    print_success "Miniconda installed successfully"
}

# Function to setup conda environment
setup_conda_env() {
    print_status "Setting up conda environment..."
    
    # Check if conda is available
    if ! command_exists conda; then
        # Try to source conda
        if [ -f "$HOME/miniconda3/etc/profile.d/conda.sh" ]; then
            source "$HOME/miniconda3/etc/profile.d/conda.sh"
        elif [ -f "$HOME/anaconda3/etc/profile.d/conda.sh" ]; then
            source "$HOME/anaconda3/etc/profile.d/conda.sh"
        else
            print_error "Conda not found in PATH and conda.sh not found"
            return 1
        fi
    fi
    
    # Create conda environment
    ENV_NAME="file-search-tool"
    if conda env list | grep -q "^$ENV_NAME "; then
        print_warning "Environment $ENV_NAME already exists. Removing and recreating..."
        conda env remove -n $ENV_NAME -y
    fi
    
    conda create -n $ENV_NAME python=3.11 -y
    conda activate $ENV_NAME
    
    print_success "Conda environment '$ENV_NAME' created and activated"
}

# Function to install Node.js
install_nodejs() {
    print_status "Checking Node.js installation..."
    
    if command_exists node; then
        NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -ge 18 ]; then
            print_success "Node.js $(node --version) is already installed"
            return 0
        else
            print_warning "Node.js version is too old ($(node --version)). Need v18 or higher."
        fi
    fi
    
    print_status "Installing Node.js via conda..."
    conda install -c conda-forge nodejs=20 -y
    
    if command_exists node; then
        print_success "Node.js $(node --version) installed successfully"
    else
        print_error "Failed to install Node.js"
        exit 1
    fi
}

# Function to install pnpm
install_pnpm() {
    print_status "Installing pnpm..."
    
    if command_exists pnpm; then
        print_success "pnpm is already installed"
        return 0
    fi
    
    npm install -g pnpm
    print_success "pnpm installed successfully"
}

# Function to setup backend
setup_backend() {
    print_status "Setting up backend..."
    
    cd backend
    
    # Install Python dependencies
    print_status "Installing Python dependencies..."
    pip install -r requirements.txt
    
    print_success "Backend setup completed"
    cd ..
}

# Function to setup frontend
setup_frontend() {
    print_status "Setting up frontend..."
    
    cd frontend
    
    # Install Node.js dependencies
    print_status "Installing Node.js dependencies..."
    pnpm install
    
    print_success "Frontend setup completed"
    cd ..
}

# Function to create startup scripts
create_startup_scripts() {
    print_status "Creating startup scripts..."
    
    # Backend startup script
    cat > start_backend.sh << 'EOF'
#!/bin/bash
cd backend
source activate file-search-tool 2>/dev/null || conda activate file-search-tool
python src/main.py
EOF
    
    # Frontend startup script
    cat > start_frontend.sh << 'EOF'
#!/bin/bash
cd frontend
pnpm run dev --host
EOF
    
    # Combined startup script
    cat > start_app.sh << 'EOF'
#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Starting File Search & Collection Tool...${NC}"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${BLUE}Shutting down servers...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Start backend
echo -e "${BLUE}Starting backend server...${NC}"
./start_backend.sh &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend
echo -e "${BLUE}Starting frontend server...${NC}"
./start_frontend.sh &
FRONTEND_PID=$!

# Wait a moment for frontend to start
sleep 5

echo -e "${GREEN}✅ Application started successfully!${NC}"
echo -e "${GREEN}📱 Frontend: http://localhost:3000${NC}"
echo -e "${GREEN}🔧 Backend API: http://localhost:5000${NC}"
echo -e "${BLUE}Press Ctrl+C to stop the application${NC}"

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
EOF
    
    # Make scripts executable
    chmod +x start_backend.sh start_frontend.sh start_app.sh
    
    print_success "Startup scripts created"
}

# Main installation function
main() {
    echo -e "${BLUE}"
    echo "=================================================="
    echo "  File Search & Collection Tool - Installer"
    echo "=================================================="
    echo -e "${NC}"
    
    # Check if we're in the right directory
    if [ ! -f "README.md" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
        print_error "Please run this script from the project root directory"
        print_error "Expected structure: backend/, frontend/, README.md"
        exit 1
    fi
    
    # Detect OS
    OS=$(detect_os)
    print_status "Detected OS: $OS"
    
    # Check for conda/miniconda
    if ! command_exists conda; then
        print_warning "Conda/Miniconda not found"
        read -p "Do you want to install Miniconda? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            install_conda
        else
            print_error "Conda is required for this installation. Please install it manually."
            exit 1
        fi
    else
        print_success "Conda found: $(conda --version)"
    fi
    
    # Setup conda environment
    setup_conda_env
    
    # Install Node.js
    install_nodejs
    
    # Install pnpm
    install_pnpm
    
    # Setup backend
    setup_backend
    
    # Setup frontend
    setup_frontend
    
    # Create startup scripts
    create_startup_scripts
    
    echo -e "${GREEN}"
    echo "=================================================="
    echo "  Installation completed successfully! 🎉"
    echo "=================================================="
    echo -e "${NC}"
    echo
    echo -e "${BLUE}To start the application:${NC}"
    echo -e "  ${GREEN}./start_app.sh${NC}     - Start both backend and frontend"
    echo
    echo -e "${BLUE}Or start components separately:${NC}"
    echo -e "  ${GREEN}./start_backend.sh${NC}  - Start only the backend server"
    echo -e "  ${GREEN}./start_frontend.sh${NC} - Start only the frontend server"
    echo
    echo -e "${BLUE}Access the application at:${NC}"
    echo -e "  ${GREEN}http://localhost:3000${NC}"
    echo
    echo -e "${BLUE}API documentation:${NC}"
    echo -e "  ${GREEN}http://localhost:5000/api${NC}"
    echo
    print_status "Happy file searching! 🔍"
}

# Run main function
main "$@"

