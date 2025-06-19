#!/bin/bash

# K3SS Search - Installation Script
# This script sets up the complete environment for the file search application

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Global variable to store the environment name
CONDA_ENV_NAME=""

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

# Function to initialize conda in current shell
init_conda() {
    print_status "Initializing conda in current shell..."
    
    # Try multiple conda locations
    CONDA_PATHS=(
        "$HOME/miniconda3/etc/profile.d/conda.sh"
        "$HOME/anaconda3/etc/profile.d/conda.sh"
        "/opt/conda/etc/profile.d/conda.sh"
        "/usr/local/miniconda3/etc/profile.d/conda.sh"
    )
    
    for conda_path in "${CONDA_PATHS[@]}"; do
        if [ -f "$conda_path" ]; then
            source "$conda_path"
            print_success "Conda initialized from $conda_path"
            return 0
        fi
    done
    
    # Try to add conda to PATH if conda command exists
    if command_exists conda; then
        print_success "Conda found in PATH"
        return 0
    fi
    
    print_error "Could not initialize conda. Please ensure conda is installed and in your PATH."
    exit 1
}

# Function to wait for conda environment to be created
wait_for_env_creation() {
    local env_name=$1
    local max_wait=60  # Maximum wait time in seconds
    local wait_time=0
    
    print_status "Waiting for environment '$env_name' to be created..."
    
    while [ $wait_time -lt $max_wait ]; do
        if conda env list | grep -q "^$env_name "; then
            print_success "Environment '$env_name' created successfully"
            return 0
        fi
        sleep 2
        wait_time=$((wait_time + 2))
        echo -n "."
    done
    
    echo
    print_error "Timeout waiting for environment '$env_name' to be created"
    exit 1
}

# Function to wait for conda environment to be activated
wait_for_env_activation() {
    local env_name=$1
    local max_wait=30  # Maximum wait time in seconds
    local wait_time=0
    
    print_status "Waiting for environment '$env_name' to be activated..."
    
    while [ $wait_time -lt $max_wait ]; do
        if [[ "$CONDA_DEFAULT_ENV" == "$env_name" ]]; then
            print_success "Environment '$env_name' activated successfully"
            return 0
        fi
        sleep 1
        wait_time=$((wait_time + 1))
        echo -n "."
    done
    
    echo
    print_error "Timeout waiting for environment '$env_name' to be activated"
    exit 1
}

# Function to list existing conda environments
list_conda_envs() {
    print_status "Available conda environments:"
    conda env list | grep -v "^#" | awk '{print "  - " $1}' | grep -v "^  - $"
}

# Function to setup conda environment with user choice
setup_conda_env() {
    print_status "Setting up conda environment..."
    
    # Initialize conda first
    init_conda
    
    # List existing environments
    echo
    list_conda_envs
    echo
    
    # Ask user for choice
    echo -e "${YELLOW}Do you want to:${NC}"
    echo "1) Use an existing conda environment"
    echo "2) Create a new conda environment"
    echo
    read -p "Enter your choice (1 or 2): " choice
    
    case $choice in
        1)
            echo
            read -p "Enter the name of the existing environment to use: " env_name
            
            # Check if environment exists
            if ! conda env list | grep -q "^$env_name "; then
                print_error "Environment '$env_name' does not exist!"
                exit 1
            fi
            
            print_status "Activating existing environment '$env_name'..."
            conda activate "$env_name"
            wait_for_env_activation "$env_name"
            CONDA_ENV_NAME="$env_name"
            ;;
        2)
            echo
            read -p "Enter the name for the new environment: " env_name
            
            # Check if environment already exists
            if conda env list | grep -q "^$env_name "; then
                print_warning "Environment '$env_name' already exists. Removing and recreating..."
                conda env remove -n "$env_name" -y
                sleep 2
            fi
            
            print_status "Creating new environment '$env_name' with Python 3.12..."
            conda create -n "$env_name" python=3.12 -y
            wait_for_env_creation "$env_name"
            
            print_status "Activating new environment '$env_name'..."
            conda activate "$env_name"
            wait_for_env_activation "$env_name"
            CONDA_ENV_NAME="$env_name"
            ;;
        *)
            print_error "Invalid choice. Please run the script again and choose 1 or 2."
            exit 1
            ;;
    esac
    
    # Verify we're in the correct environment
    print_status "Verifying conda environment..."
    echo "Current environment: $CONDA_DEFAULT_ENV"
    echo "Python version: $(python --version)"
    echo "Python path: $(which python)"
    
    if [[ "$CONDA_DEFAULT_ENV" != "$env_name" ]]; then
        print_error "Failed to activate environment '$env_name'. Current environment: $CONDA_DEFAULT_ENV"
        exit 1
    fi
    
    print_success "Conda environment '$env_name' is ready!"
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
    
    # Verify we're still in the conda environment
    if [[ -z "$CONDA_DEFAULT_ENV" ]]; then
        print_error "Conda environment not active! This should not happen."
        exit 1
    fi
    
    print_status "Installing Python dependencies in environment: $CONDA_DEFAULT_ENV"
    print_status "Using pip: $(which pip)"
    
    # Install Python dependencies
    pip install -r requirements.txt
    
    print_success "Backend setup completed in environment: $CONDA_DEFAULT_ENV"
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
    
    # Get the current environment name
    local env_name="$CONDA_ENV_NAME"
    
    # Backend startup script
    cat > start_backend.sh << EOF
#!/bin/bash

# Initialize conda
if [ -f "\$HOME/miniconda3/etc/profile.d/conda.sh" ]; then
    source "\$HOME/miniconda3/etc/profile.d/conda.sh"
elif [ -f "\$HOME/anaconda3/etc/profile.d/conda.sh" ]; then
    source "\$HOME/anaconda3/etc/profile.d/conda.sh"
fi

# Activate the conda environment
conda activate $env_name

# Start backend
cd backend
python src/main.py
EOF
    
    # Frontend startup script
    cat > start_frontend.sh << 'EOF'
#!/bin/bash
cd frontend
pnpm run dev --host
EOF
    
    # Combined startup script
    cat > start_app.sh << EOF
#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\${BLUE}Starting K3SS Search...\${NC}"

# Function to cleanup on exit
cleanup() {
    echo -e "\n\${BLUE}Shutting down servers...\${NC}"
    kill \$BACKEND_PID 2>/dev/null || true
    kill \$FRONTEND_PID 2>/dev/null || true
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Start backend
echo -e "\${BLUE}Starting backend server...\${NC}"
./start_backend.sh &
BACKEND_PID=\$!

# Wait a moment for backend to start
sleep 3

# Start frontend
echo -e "\${BLUE}Starting frontend server...\${NC}"
./start_frontend.sh &
FRONTEND_PID=\$!

# Wait a moment for frontend to start
sleep 5

echo -e "\${GREEN}✅ Application started successfully!\${NC}"
echo -e "\${GREEN}📱 Frontend: http://localhost:3000\${NC}"
echo -e "\${GREEN}🔧 Backend API: http://localhost:5000\${NC}"
echo -e "\${BLUE}Press Ctrl+C to stop the application\${NC}"

# Wait for processes
wait \$BACKEND_PID \$FRONTEND_PID
EOF
    
    # Make scripts executable
    chmod +x start_backend.sh start_frontend.sh start_app.sh
    
    print_success "Startup scripts created for environment: $env_name"
}

# Function to create post-install instructions
create_post_install_instructions() {
    local env_name="$CONDA_ENV_NAME"
    
    cat > POST_INSTALL_INSTRUCTIONS.md << EOF
# Post-Installation Instructions

## Important: Conda Environment Activation

The installation script created/used the conda environment: **$env_name**

However, conda environment activation only works within the script's shell session. 
After the script finishes, you need to manually activate the environment.

## To Use K3SS Search:

### Option 1: Use the startup script (Recommended)
\`\`\`bash
./start_app.sh
\`\`\`
This script automatically activates the conda environment and starts both servers.

### Option 2: Manual activation and startup
\`\`\`bash
# Activate the conda environment
conda activate $env_name

# Start the application
./start_app.sh
\`\`\`

### Option 3: Start components separately
\`\`\`bash
# Terminal 1 - Backend (automatically activates conda env)
./start_backend.sh

# Terminal 2 - Frontend
./start_frontend.sh
\`\`\`

## Troubleshooting

If you see "command not found: pip" or similar errors, it means you're not in the conda environment.

**Solution:**
\`\`\`bash
conda activate $env_name
\`\`\`

## Environment Details
- Environment name: $env_name
- Python path: \$(which python) (when activated)
- Pip path: \$(which pip) (when activated)

## Access K3SS Search
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
EOF
}

# Main installation function
main() {
    echo -e "${BLUE}"
    echo "=================================================="
    echo "  K3SS Search - Installer"
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
    
    # Setup conda environment with user choice
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
    
    # Create post-install instructions
    create_post_install_instructions
    
    echo -e "${GREEN}"
    echo "=================================================="
    echo "  Installation completed successfully! 🎉"
    echo "=================================================="
    echo -e "${NC}"
    echo
    echo -e "${BLUE}Environment used: ${GREEN}$CONDA_ENV_NAME${NC}"
    echo
    echo -e "${YELLOW}⚠️  IMPORTANT: Environment Activation Required ⚠️${NC}"
    echo -e "${BLUE}The conda environment is only active during this script.${NC}"
    echo -e "${BLUE}To use the application, you have two options:${NC}"
    echo
    echo -e "${GREEN}Option 1 (Recommended): Use the startup script${NC}"
    echo -e "  ${GREEN}./start_app.sh${NC}     - Automatically activates environment and starts both servers"
    echo
    echo -e "${GREEN}Option 2: Manual activation${NC}"
    echo -e "  ${GREEN}conda activate $CONDA_ENV_NAME${NC}  - Activate the environment first"
    echo -e "  ${GREEN}./start_app.sh${NC}                    - Then start the application"
    echo
    echo -e "${BLUE}Access K3SS Search at:${NC}"
    echo -e "  ${GREEN}http://localhost:5173${NC}"
    echo -e "${BLUE}Backend API running on:${NC}"
    echo -e "  ${GREEN}http://localhost:5010${NC}"
    echo
    echo -e "${BLUE}For detailed instructions, see:${NC}"
    echo -e "  ${GREEN}POST_INSTALL_INSTRUCTIONS.md${NC}"
    echo
    print_status "Happy searching with K3SS Search! 🔍"
}

# Run main function
main "$@"

