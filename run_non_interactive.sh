#!/bin/bash

# Enhanced Command Runner for Non-Interactive Execution
# This script handles commands that might wait for user input

# Function to run commands in true background mode
run_background_command() {
    local cmd="$1"
    local log_file="$2"
    
    echo "Running in background: $cmd"
    echo "Logging to: $log_file"
    
    # Run command in background with output redirection
    nohup bash -c "$cmd" > "$log_file" 2>&1 &
    local pid=$!
    
    echo "Started with PID: $pid"
    
    # Give it a moment to start
    sleep 2
    
    # Check if process is still running
    if kill -0 "$pid" 2>/dev/null; then
        echo "Process running successfully"
        echo "$pid" > "${log_file}.pid"
    else
        echo "Process may have completed or failed"
        cat "$log_file"
    fi
}

# Function to run Playwright commands without interaction
run_playwright_install() {
    local browser="$1"
    local log_file="playwright_install_${browser}.log"
    
    echo "Installing Playwright $browser browser..."
    
    # Set environment variables to avoid interactive prompts
    export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=0
    export PLAYWRIGHT_BROWSERS_PATH=./playwright-browsers
    
    # Run the command with timeout to prevent hanging
    timeout 300 npx playwright install "$browser" > "$log_file" 2>&1 &
    local pid=$!
    
    echo "Playwright install started with PID: $pid"
    
    # Wait a bit and check status
    sleep 5
    
    if kill -0 "$pid" 2>/dev/null; then
        echo "Installation in progress... (will timeout after 5 minutes)"
        echo "Check $log_file for progress"
    else
        echo "Installation completed or failed"
        cat "$log_file"
    fi
}

# Function to check if backend is running
check_backend() {
    local backend_url="http://localhost:3001"
    
    if curl -s -f "$backend_url/health" > /dev/null 2>&1; then
        echo "✅ Backend is running at $backend_url"
        return 0
    else
        echo "❌ Backend is not responding at $backend_url"
        return 1
    fi
}

# Function to start backend if not running
ensure_backend() {
    if ! check_backend; then
        echo "Starting backend..."
        run_background_command "cargo run --bin backend --release" "backend.log"
        
        # Wait for backend to start
        local attempts=0
        while [ $attempts -lt 30 ]; do
            if check_backend; then
                echo "✅ Backend started successfully"
                return 0
            fi
            sleep 2
            attempts=$((attempts + 1))
        done
        
        echo "❌ Backend failed to start within 60 seconds"
        return 1
    fi
}

# Function to run tests without hanging
run_tests_safely() {
    local test_file="$1"
    local log_file="test_results.log"
    
    echo "Running tests: $test_file"
    
    # Set timeout and run in background
    timeout 300 npx playwright test "$test_file" --reporter=json > "$log_file" 2>&1 &
    local pid=$!
    
    echo "Tests started with PID: $pid"
    
    # Monitor the process
    local count=0
    while kill -0 "$pid" 2>/dev/null && [ $count -lt 150 ]; do
        echo "Tests running... (${count}s elapsed)"
        sleep 2
        count=$((count + 2))
    done
    
    if kill -0 "$pid" 2>/dev/null; then
        echo "Tests taking too long, terminating..."
        kill "$pid"
        echo "❌ Tests timed out"
        return 1
    else
        echo "✅ Tests completed"
        cat "$log_file"
        return 0
    fi
}

# Main execution based on arguments
case "$1" in
    "backend")
        ensure_backend
        ;;
    "playwright")
        run_playwright_install "${2:-chromium}"
        ;;
    "test")
        run_tests_safely "${2:-tests/basket-validation.spec.ts}"
        ;;
    "pipeline")
        # Run the integrated pipeline
        python3 integrated_basket_pipeline.py --file "${2:-test_lenovo_x86_parts.xlsx}" --upload --output pipeline_results.json --report pipeline_report.md
        ;;
    *)
        echo "Usage: $0 {backend|playwright|test|pipeline} [args...]"
        echo ""
        echo "Commands:"
        echo "  backend                     - Start backend if not running"
        echo "  playwright [browser]        - Install Playwright browser (default: chromium)"
        echo "  test [test-file]           - Run Playwright tests safely"
        echo "  pipeline [excel-file]      - Run integrated basket pipeline"
        exit 1
        ;;
esac
