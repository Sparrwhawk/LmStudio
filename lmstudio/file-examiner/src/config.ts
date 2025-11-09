import { createConfigSchematics } from "@lmstudio/sdk";

export const configSchematics = createConfigSchematics()
  .field(
    "allowedExtensions",
    "string",
    {
      displayName: "Allowed File Extensions",
      subtitle: "Comma-separated list of allowed file extensions (include the dots, e.g., .txt,.js,.cs)",
      placeholder: ".txt,.md,.json,.js,.cs,.py"
    },
    ".txt,.md,.json,.xml,.csv,.log,.yml,.yaml,.ini,.cfg,.conf,.properties,.js,.ts,.py,.java,.cpp,.c,.h,.html,.css,.sql,.php,.rb,.go,.rs,.cs,.vb,.fs,.csproj,.vbproj,.fsproj,.sln,.config,.resx,.xaml,.razor,.cshtml,.vbhtml,.aspx,.ascx,.asmx,.dll,.exe,.msi,.nupkg,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.tif,.webp,.svg,.ico,.heic,.heif,.raw,.cr2,.nef,.arw,.dng"
  )
  .field(
    "maxFileSize",
    "numeric",
    {
      int: true,
      min: 1,
      max: 100,
      displayName: "Max File Size (MB)",
      subtitle: "Maximum file size allowed for reading",
      slider: { min: 1, max: 100, step: 1 }
    },
    10
  )
  .field(
    "restrictedPaths",
    "string",
    {
      displayName: "Restricted Paths", 
      subtitle: "Comma-separated list of directory paths that are blocked for security",
      placeholder: "C:\\Windows\\System32,C:\\Program Files"
    },
    "C:\\Windows\\System32,C:\\Program Files,C:\\Program Files (x86)"
  )
  .field(
    "enableImageFiles",
    "boolean",
    {
      displayName: "Enable Image Files",
      subtitle: "Allow reading image files (returns metadata only)"
    },
    true
  )
  .field(
    "enableDotNetFiles", 
    "boolean",
    {
      displayName: "Enable .NET Files",
      subtitle: "Allow .NET development files (.cs, .csproj, .sln, etc.)"
    },
    true
  )
  .field(
    "enableBinaryFiles",
    "boolean",
    {
      displayName: "Enable Binary Files",
      subtitle: "Allow binary files like DLLs and executables (metadata only)"
    },
    true
  )
  .build();