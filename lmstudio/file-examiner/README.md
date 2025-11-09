# LM Studio File Examiner Add-on

A secure add-on for LM Studio that allows AI models to safely examine and read files from your local file system.

## Features

- **Safe File Reading**: Read text files with configurable security restrictions
- **Directory Browsing**: List directory contents and navigate file structure
- **File Information**: Get detailed metadata about files and directories
- **File Search**: Search for files using pattern matching with wildcard support
- **Configurable Security**: Customizable file type restrictions and security controls through LM Studio settings
- **Size Limits**: Configurable file size limits to prevent memory issues
- **.NET Support**: Full support for .NET development files
- **Image Support**: Metadata extraction for image files

## Configuration

The File Examiner plugin is fully configurable through LM Studio's plugin settings. You can customize:

### **Allowed File Extensions**
- Comma-separated list of file extensions (include dots: `.txt,.js,.cs`)
- Default includes text, code, .NET, and image files
- Can be modified to restrict or expand supported file types

### **Security Settings**
- **Max File Size**: Set maximum file size limit (1-100 MB)
- **Restricted Paths**: Define directories that are completely blocked
- **File Type Toggles**: Enable/disable categories of files:
  - Image Files (metadata only)
  - .NET Development Files  
  - Binary Files (metadata only)

### **Default Configuration**
- **Max file size**: 10MB
- **Restricted paths**: Windows system directories and Program Files
- **All file types enabled** by default

> **Note**: Changes to configuration require restarting the chat session to take effect.

## Security Features

### Restricted Paths
The add-on automatically blocks access to sensitive system directories:
- `C:\Windows\System32`
- `C:\Program Files`
- `C:\Program Files (x86)`

### Allowed File Types
Only specific file extensions are permitted for security:

**Text and Documentation:**
- Text files: `.txt`, `.md`, `.log`
- Configuration: `.json`, `.xml`, `.yml`, `.yaml`, `.ini`, `.cfg`, `.conf`, `.properties`
- Data files: `.csv`

**Programming Languages:**
- Web: `.js`, `.ts`, `.html`, `.css`, `.php`
- System: `.py`, `.java`, `.cpp`, ".c", `.h`, `.sql`, `.rb`, `.go`, `.rs`

**.NET Development Files:**
- Source code: `.cs`, `.vb`, `.fs`
- Project files: `.csproj`, `.vbproj`, `.fsproj`, `.sln`
- Web files: `.razor`, `.cshtml`, `.vbhtml`, `.aspx`, `.ascx`, `.asmx`
- Resources: `.config`, `.resx`, `.xaml`
- Binaries: `.dll`, `.exe`, `.msi`, `.nupkg` *(metadata only)*

**Image Files:** *(metadata only)*
- Common formats: `.jpg`, `.jpeg`, `.png`, `.gif`, `.bmp`, `.tiff`, `.webp`, `.svg`, `.ico`
- RAW formats: `.heic`, `.heif`, `.raw`, `.cr2`, `.nef`, `.arw`, `.dng`

> **Note:** Binary files (images, executables) return metadata and file information only, not raw content.

### File Size Limits
- Maximum file size: 10MB (configurable)
- Prevents memory exhaustion from large files

## Installation

1. Copy the plugin folder to your LM Studio plugins directory
2. Install dependencies:
   ```bash
   npm install
   ```
3. Restart LM Studio
4. Enable the "File Examiner" plugin in LM Studio settings

## Configuration Access

To configure the File Examiner plugin:

1. **Open LM Studio**
2. **Go to Settings** (⚙️ icon)
3. **Navigate to Extensions/Plugins**
4. **Find "File Examiner"** in the plugin list
5. **Click "Configure"** or the settings icon next to the plugin
6. **Modify settings** as needed:
   - Allowed file extensions
   - Maximum file size
   - Restricted paths  
   - Enable/disable file type categories
7. **Save configuration**
8. **Start a new chat** for changes to take effect

### Configuration Examples

**Restrict to only text files:**
```
.txt,.md,.log
```

**Add custom file types:**
```
.txt,.md,.json,.py,.cs,.jsx,.vue,.go
```

**Increase file size limit:**
```
25 (for 25MB limit)
```

## API Endpoints

### `read_file`
Read the contents of a file from the local file system.

**Parameters:**
- `file_path` (string, required): Absolute path to the file
- `encoding` (string, optional): File encoding (default: "utf8")

**Example:**
```javascript
const result = await api.read_file({
    file_path: "C:\\Users\\YourName\\Documents\\example.txt",
    encoding: "utf8"
});
```

### `list_directory`
List the contents of a directory.

**Parameters:**
- `dir_path` (string, required): Absolute path to the directory
- `include_hidden` (boolean, optional): Include hidden files (default: false)

**Example:**
```javascript
const result = await api.list_directory({
    dir_path: "C:\\Users\\YourName\\Documents",
    include_hidden: false
});
```

### `get_file_info`
Get detailed information and metadata about a file.

**Parameters:**
- `file_path` (string, required): Absolute path to the file

**Example:**
```javascript
const result = await api.get_file_info({
    file_path: "C:\\Users\\YourName\\Documents\\example.txt"
});
```

### `search_files`
Search for files matching a pattern in a directory.

**Parameters:**
- `search_path` (string, required): Directory to search in
- `pattern` (string, required): File name pattern (supports wildcards * and ?)
- `recursive` (boolean, optional): Search subdirectories (default: false)

**Example:**
```javascript
const result = await api.search_files({
    search_path: "C:\\Users\\YourName\\Documents",
    pattern: "*.txt",
    recursive: true
});
```

## Usage Examples

### Basic File Reading
```javascript
// Read a configuration file
const config = await api.read_file({
    file_path: "C:\\MyApp\\config.json"
});

if (config.success) {
    console.log("File contents:", config.data.content);
    console.log("File size:", config.data.size, "bytes");
    console.log("MIME type:", config.data.mimeType);
}
```

### Directory Exploration
```javascript
// List files in a directory
const listing = await api.list_directory({
    dir_path: "C:\\Users\\YourName\\Projects"
});

if (listing.success) {
    listing.data.items.forEach(item => {
        console.log(`${item.type}: ${item.name} (${item.size} bytes)`);
    });
}
```

### File Search
```javascript
// Find all Python files in a project
const pythonFiles = await api.search_files({
    search_path: "C:\\MyProjects\\PythonApp",
    pattern: "*.py",
    recursive: true
});

if (pythonFiles.success) {
    console.log(`Found ${pythonFiles.data.count} Python files:`);
    pythonFiles.data.results.forEach(file => {
        console.log(`- ${file.path}`);
    });
}
```

## Response Format

All API endpoints return a consistent response format:

```javascript
{
    success: boolean,
    data: {
        // Endpoint-specific data
    },
    error: string // Only present if success is false
}
```

## Testing

Run the test suite to verify the add-on functionality:

```bash
npm test
```

The test suite includes:
- Directory listing tests
- File reading tests
- File information retrieval tests
- File search tests
- Security validation tests

## Configuration

### Customizing Security Settings

Edit `manifest.json` to modify security settings:

```json
{
    "security": {
        "restricted_paths": [
            "C:\\Windows\\System32",
            "C:\\Program Files"
        ],
        "allowed_extensions": [
            ".txt", ".md", ".json"
        ],
        "max_file_size": "10MB"
    }
}
```

### Adding New File Types

To allow additional file types, add them to the `allowed_extensions` array in `manifest.json`:

```json
"allowed_extensions": [
    ".txt", ".md", ".json", ".log", ".csv",
    ".js", ".ts", ".py", ".cpp", ".java"
]
```

## Error Handling

The add-on includes comprehensive error handling:

- **Path validation**: Prevents access to restricted directories
- **File type validation**: Blocks unauthorized file extensions
- **Size validation**: Prevents reading files that are too large
- **Permission checking**: Verifies file access permissions
- **Existence validation**: Confirms files and directories exist

Common error messages:
- `"Access denied: Path is in restricted directory"`
- `"File type not allowed: .exe"`
- `"File too large: 50MB (max: 10MB)"`
- `"Path is not a file"`
- `"Path is not a directory"`

## Troubleshooting

### Add-on Not Loading
1. Verify all files are in the correct directory
2. Check that `package.json` and `manifest.json` are valid JSON
3. Ensure Node.js dependencies are installed
4. Check LM Studio console for error messages

### Permission Errors
1. Ensure LM Studio has appropriate file system permissions
2. Check that target files are not locked by other processes
3. Verify the file path exists and is accessible

### File Type Restrictions
If you need to read files with extensions not in the allowed list:
1. Add the extension to `manifest.json`
2. Restart LM Studio
3. Test the file access

## Security Considerations

This add-on provides read-only access to the file system with multiple security layers:

1. **Path Restriction**: Blocks access to sensitive system directories
2. **Extension Filtering**: Only allows specific file types
3. **Size Limits**: Prevents reading of excessively large files
4. **No Write Access**: The add-on cannot modify or create files
5. **Input Validation**: All paths are normalized and validated

## License

MIT License - See LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## Changelog

### Version 1.0.0
- Initial release
- Basic file reading functionality
- Directory listing
- File search with patterns
- Security restrictions
- Comprehensive test suite