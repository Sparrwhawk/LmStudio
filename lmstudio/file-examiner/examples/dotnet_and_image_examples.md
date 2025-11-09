# .NET and Image File Support Examples

This document shows examples of how to use the File Examiner plugin with .NET files and images.

## .NET File Examples

### Reading C# Source Code
```javascript
// Read a C# file
const result = await api.read_file({
    file_path: "C:\\MyProject\\Program.cs"
});
// Returns the source code content
```

### Getting Project File Information
```javascript
// Get info about a .csproj file
const info = await api.get_file_info({
    file_path: "C:\\MyProject\\MyApp.csproj"
});
// Returns project file metadata with .NET-specific information
```

### Examining a .NET Assembly
```javascript
// Get info about a DLL file
const dllInfo = await api.get_file_info({
    file_path: "C:\\MyProject\\bin\\Debug\\MyApp.dll"
});
// Returns binary file metadata (content not readable)
```

## Image File Examples

### Getting Image Metadata
```javascript
// Get info about an image file
const imageInfo = await api.get_file_info({
    file_path: "C:\\Pictures\\photo.jpg"
});
// Returns image metadata including format information
```

### Reading Image Files
```javascript
// Attempt to read an image (returns metadata instead)
const result = await api.read_file({
    file_path: "C:\\Pictures\\screenshot.png"
});
// Returns: {isBinary: true, content: "[Binary file - content not readable as text]", ...metadata}
```

## Supported File Types

### .NET Files (Text Content):
- `.cs` - C# source files
- `.vb` - VB.NET source files  
- `.fs` - F# source files
- `.csproj`, `.vbproj`, `.fsproj` - Project files
- `.sln` - Solution files
- `.config` - Configuration files
- `.razor`, `.cshtml` - Web files
- `.resx` - Resource files
- `.xaml` - XAML markup files

### .NET Files (Metadata Only):
- `.dll` - Dynamic Link Libraries
- `.exe` - Executables
- `.msi` - Installer packages
- `.nupkg` - NuGet packages

### Image Files (Metadata Only):
- `.jpg`, `.jpeg`, `.png`, `.gif`, `.bmp`
- `.tiff`, `.webp`, `.svg`, `.ico`
- `.heic`, `.heif`, `.raw`, `.cr2`, `.nef`, `.arw`, `.dng`

## Security Features

- All .NET and image files are subject to the same security restrictions
- System directories remain blocked
- 10MB file size limit applies
- Binary files return metadata only for security