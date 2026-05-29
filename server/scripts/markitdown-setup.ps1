# setup-markitdown.ps1

$ErrorActionPreference = "Stop"

$REPO_URL = "https://github.com/microsoft/markitdown.git"

$DEFAULT_REPO_DIR = if ($env:MARKITDOWN_REPO_DIR) {
    $env:MARKITDOWN_REPO_DIR
} else {
    Join-Path $PWD ".markitdown-src"
}

$DEFAULT_VENV_DIR = if ($env:MARKITDOWN_VENV_DIR) {
    $env:MARKITDOWN_VENV_DIR
} else {
    Join-Path $PWD ".venv-markitdown"
}

$DEFAULT_PYTHON_BIN = if ($env:PYTHON_BIN) {
    $env:PYTHON_BIN
} else {
    "python"
}

function Show-Usage {
    Write-Host "Usage:"
    Write-Host "  .\setup-markitdown.ps1 [repo_dir] [venv_dir] [python_bin]"
    Write-Host ""
    Write-Host "Defaults:"
    Write-Host "  repo_dir: $DEFAULT_REPO_DIR"
    Write-Host "  venv_dir: $DEFAULT_VENV_DIR"
    Write-Host "  python_bin: $DEFAULT_PYTHON_BIN"
}

function Test-CommandExists {
    param (
        [string]$Command
    )

    return $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

function Setup-MarkItDown {
    param (
        [string]$RepoDir,
        [string]$VenvDir,
        [string]$PythonBin
    )

    if (-not (Test-CommandExists "git")) {
        Write-Error "git is required but not installed."
        exit 1
    }

    if (-not (Test-CommandExists $PythonBin)) {
        Write-Error "Python executable not found: $PythonBin"
        exit 1
    }

    if (-not (Test-CommandExists "uv")) {
        Write-Host "uv is required but not installed. Installing..."

        if (Test-CommandExists "powershell") {
            powershell -ExecutionPolicy Bypass -c "irm https://astral.sh/uv/install.ps1 | iex"
        } else {
            Write-Error "PowerShell is required to install uv."
            exit 1
        }

        $env:PATH += ";$HOME\.local\bin"
        $env:PATH += ";$HOME\AppData\Local\Programs\uv"

        if (-not (Test-CommandExists "uv")) {
            Write-Error "uv installation completed but uv was not found in PATH."
            Write-Host "Restart your terminal and re-run the script."
            exit 1
        }
    }

    if (-not (Test-Path (Join-Path $RepoDir ".git"))) {
        Write-Host "Cloning MarkItDown into $RepoDir"
        git clone $REPO_URL $RepoDir
    } else {
        Write-Host "MarkItDown repo already exists at $RepoDir"
    }

    if (-not (Test-Path $VenvDir)) {
        Write-Host "Creating virtual environment at $VenvDir"
        uv venv $VenvDir --python $PythonBin
    } else {
        Write-Host "Virtual environment already exists at $VenvDir"
    }

    Push-Location $RepoDir

    $VenvPython = Join-Path $VenvDir "Scripts\python.exe"

    uv pip install -e "packages/markitdown[all]" --python $VenvPython
    uv pip install -e "packages/markitdown-ocr" --python $VenvPython
    uv pip install openai --python $VenvPython

    Pop-Location

    Write-Host ""
    Write-Host "MarkItDown setup complete."
    Write-Host "Activate with:"
    Write-Host "  $VenvDir\Scripts\Activate.ps1"
}

if ($args.Count -gt 0 -and ($args[0] -eq "-h" -or $args[0] -eq "--help")) {
    Show-Usage
    exit 0
}

$repo_dir = if ($args.Count -ge 1) { $args[0] } else { $DEFAULT_REPO_DIR }
$venv_dir = if ($args.Count -ge 2) { $args[1] } else { $DEFAULT_VENV_DIR }
$python_bin = if ($args.Count -ge 3) { $args[2] } else { $DEFAULT_PYTHON_BIN }

Setup-MarkItDown -RepoDir $repo_dir -VenvDir $venv_dir -PythonBin $python_bin