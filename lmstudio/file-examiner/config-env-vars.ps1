# File Examiner Plugin Configuration via Environment Variables

# You can set these environment variables to configure the plugin:

# Allowed file extensions (comma-separated with dots)
$env:FILE_EXAMINER_ALLOWED_EXTENSIONS = ".txt,.md,.json,.js,.cs,.py"

# Maximum file size in MB
$env:FILE_EXAMINER_MAX_SIZE = "10"

# Restricted paths (comma-separated)
$env:FILE_EXAMINER_RESTRICTED_PATHS = "C:\Windows\System32,C:\Program Files"

# Enable/disable file types (true/false)
$env:FILE_EXAMINER_ENABLE_IMAGES = "true"
$env:FILE_EXAMINER_ENABLE_DOTNET = "true" 
$env:FILE_EXAMINER_ENABLE_BINARY = "true"

# To apply these settings:
# 1. Run these commands in PowerShell
# 2. Restart LM Studio
# 3. Start a new chat