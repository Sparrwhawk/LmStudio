import { text, tool, type Tool, type ToolsProviderController } from "@lmstudio/sdk";
import { promises as fs } from "fs";
import * as path from "path";
import * as mimeTypes from "mime-types";
import { z } from "zod";
import { configSchematics } from "./config";

// Default security configuration (fallback if config not available)
const DEFAULT_RESTRICTED_PATHS = [
  "C:\\Windows\\System32",
  "C:\\Program Files", 
  "C:\\Program Files (x86)"
];

const DEFAULT_ALLOWED_EXTENSIONS = [
  ".txt", ".md", ".json", ".xml", ".csv", ".log",
  ".yml", ".yaml", ".ini", ".cfg", ".conf", ".properties",
  ".js", ".ts", ".py", ".java", ".cpp", ".c", ".h", 
  ".html", ".css", ".sql", ".php", ".rb", ".go", ".rs",
  ".cs", ".vb", ".fs", ".csproj", ".vbproj", ".fsproj",
  ".sln", ".config", ".resx", ".xaml", ".razor",
  ".cshtml", ".vbhtml", ".aspx", ".ascx", ".asmx",
  ".dll", ".exe", ".msi", ".nupkg",
  ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".tif",
  ".webp", ".svg", ".ico", ".heic", ".heif", ".raw",
  ".cr2", ".nef", ".arw", ".dng"
];

const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Get configuration values with fallbacks
 */
function getConfig(ctl: ToolsProviderController) {
  const pluginConfig = ctl.getPluginConfig(configSchematics);
  
  // Parse allowed extensions from config
  const allowedExtensionsStr = pluginConfig.get("allowedExtensions");
  const allowedExtensions = allowedExtensionsStr
    .split(",")
    .map(ext => ext.trim())
    .filter(ext => ext.length > 0);
    
  // Parse restricted paths from config
  const restrictedPathsStr = pluginConfig.get("restrictedPaths");
  const restrictedPaths = restrictedPathsStr
    .split(",")
    .map(path => path.trim())
    .filter(path => path.length > 0);
    
  // Get other config values
  const maxFileSizeMB = pluginConfig.get("maxFileSize");
  const maxFileSize = maxFileSizeMB * 1024 * 1024; // Convert MB to bytes
  
  const enableImageFiles = pluginConfig.get("enableImageFiles");
  const enableDotNetFiles = pluginConfig.get("enableDotNetFiles");
  const enableBinaryFiles = pluginConfig.get("enableBinaryFiles");
  
  return {
    allowedExtensions: allowedExtensions.length > 0 ? allowedExtensions : DEFAULT_ALLOWED_EXTENSIONS,
    restrictedPaths: restrictedPaths.length > 0 ? restrictedPaths : DEFAULT_RESTRICTED_PATHS,
    maxFileSize,
    enableImageFiles,
    enableDotNetFiles,
    enableBinaryFiles
  };
}

/**
 * Validate file path for security
 */
function validatePath(filePath: string, restrictedPaths: string[]): string {
  const normalizedPath = path.resolve(filePath);
  
  // Check if path is in restricted directories
  for (const restrictedPath of restrictedPaths) {
    if (normalizedPath.toLowerCase().startsWith(restrictedPath.toLowerCase())) {
      throw new Error(`Access denied: Path is in restricted directory: ${restrictedPath}`);
    }
  }

  return normalizedPath;
}

/**
 * Validate file extension based on configuration
 */
function validateExtension(filePath: string, allowedExtensions: string[], config: any): boolean {
  const ext = path.extname(filePath).toLowerCase();
  
  // Check if extension is in allowed list
  if (!allowedExtensions.includes(ext)) {
    throw new Error(`File type not allowed: ${ext}. Allowed types: ${allowedExtensions.join(', ')}`);
  }
  
  // Additional checks based on file type enablement
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".tif", ".webp", ".svg", ".ico", ".heic", ".heif", ".raw", ".cr2", ".nef", ".arw", ".dng"];
  const dotnetExtensions = [".cs", ".vb", ".fs", ".csproj", ".vbproj", ".fsproj", ".sln", ".razor", ".cshtml", ".vbhtml", ".aspx", ".ascx", ".asmx"];
  const binaryExtensions = [".dll", ".exe", ".msi", ".nupkg"];
  
  if (imageExtensions.includes(ext) && !config.enableImageFiles) {
    throw new Error(`Image files are disabled in plugin configuration`);
  }
  
  if (dotnetExtensions.includes(ext) && !config.enableDotNetFiles) {
    throw new Error(`.NET files are disabled in plugin configuration`);
  }
  
  if (binaryExtensions.includes(ext) && !config.enableBinaryFiles) {
    throw new Error(`Binary files are disabled in plugin configuration`);
  }
  
  return true;
}

/**
 * Format file size in human readable format
 */
function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export async function fileExaminerTools(ctl: ToolsProviderController): Promise<Tool[]> {
  const tools: Tool[] = [];

  // Get configuration values
  const config = getConfig(ctl);

  // Read file tool
  const readFileTool = tool({
    name: "read_file",
    description: text`
      Read the contents of a file from the local file system. 
      File types and restrictions are configurable in plugin settings.
      Restricted from accessing system directories.
      For binary files (images, executables), returns metadata instead of content.
    `,
    parameters: {
      file_path: z.string().describe("Absolute path to the file to read"),
      encoding: z.string().optional().default("utf8").describe("File encoding (default: utf8)")
    },
    implementation: async ({ file_path, encoding }) => {
      try {
        const validatedPath = validatePath(file_path, config.restrictedPaths);
        validateExtension(validatedPath, config.allowedExtensions, config);

        // Check if file exists
        const stats = await fs.stat(validatedPath);
        
        if (!stats.isFile()) {
          throw new Error("Path is not a file");
        }

        // Check file size
        if (stats.size > config.maxFileSize) {
          throw new Error(`File too large: ${stats.size} bytes (max: ${config.maxFileSize})`);
        }

        const ext = path.extname(validatedPath).toLowerCase();
        const mimeType = mimeTypes.lookup(validatedPath) || "unknown";
        
        // Binary file extensions that should return metadata instead of content
        const binaryExtensions = [
          ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".tif",
          ".webp", ".ico", ".heic", ".heif", ".raw", ".cr2", ".nef", 
          ".arw", ".dng", ".dll", ".exe", ".msi", ".nupkg"
        ];
        
        const isBinaryFile = binaryExtensions.includes(ext) || 
                           mimeType.startsWith("image/") || 
                           mimeType.startsWith("application/");

        if (isBinaryFile) {
          // For binary files, return metadata only
          return {
            success: true,
            isBinary: true,
            content: `[Binary file - content not readable as text]`,
            path: validatedPath,
            size: stats.size,
            sizeFormatted: formatFileSize(stats.size),
            mimeType: mimeType,
            lastModified: stats.mtime,
            fileType: ext,
            message: `This is a binary file (${ext}). Only metadata is shown. Use get_file_info for detailed information.`
          };
        }

        // For text files, read content normally
        const content = await fs.readFile(validatedPath, encoding as BufferEncoding);
        
        return {
          success: true,
          isBinary: false,
          content: content,
          path: validatedPath,
          size: stats.size,
          sizeFormatted: formatFileSize(stats.size),
          encoding: encoding,
          mimeType: mimeType,
          lastModified: stats.mtime
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred"
        };
      }
    }
  });

  // List directory tool  
  const listDirectoryTool = tool({
    name: "list_directory", 
    description: text`
      List the contents of a directory.
      Returns information about files and subdirectories.
    `,
    parameters: {
      dir_path: z.string().describe("Absolute path to the directory to list"),
      include_hidden: z.boolean().optional().default(false).describe("Whether to include hidden files")
    },
    implementation: async ({ dir_path, include_hidden }) => {
      try {
        const validatedPath = validatePath(dir_path, config.restrictedPaths);

        const stats = await fs.stat(validatedPath);
        if (!stats.isDirectory()) {
          throw new Error("Path is not a directory");
        }

        const entries = await fs.readdir(validatedPath, { withFileTypes: true });
        const items = [];

        for (const entry of entries) {
          if (!include_hidden && entry.name.startsWith(".")) {
            continue;
          }

          const itemPath = path.join(validatedPath, entry.name);
          const itemStats = await fs.stat(itemPath);

          items.push({
            name: entry.name,
            path: itemPath,
            type: entry.isDirectory() ? "directory" : "file",
            size: itemStats.size,
            sizeFormatted: formatFileSize(itemStats.size),
            lastModified: itemStats.mtime,
            extension: entry.isFile() ? path.extname(entry.name) : null,
            mimeType: entry.isFile() ? (mimeTypes.lookup(entry.name) || "unknown") : null
          });
        }

        return {
          success: true,
          path: validatedPath,
          items: items,
          count: items.length
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred"
        };
      }
    }
  });

  // Get file info tool
  const getFileInfoTool = tool({
    name: "get_file_info",
    description: text`
      Get detailed metadata and information about a file or directory.
      For images, includes dimensions and image-specific data when possible.
      For .NET files, includes assembly and project information.
    `,
    parameters: {
      file_path: z.string().describe("Absolute path to the file or directory")
    },
    implementation: async ({ file_path }) => {
      try {
        const validatedPath = validatePath(file_path, config.restrictedPaths);
        const stats = await fs.stat(validatedPath);
        const ext = path.extname(validatedPath).toLowerCase();
        const mimeType = stats.isFile() ? (mimeTypes.lookup(validatedPath) || "unknown") : null;

        let additionalInfo: any = {};

        // Enhanced info for specific file types
        if (stats.isFile()) {
          // .NET file specific info
          const dotnetFiles = [".cs", ".vb", ".fs", ".csproj", ".vbproj", ".fsproj", ".sln", ".config"];
          if (dotnetFiles.includes(ext)) {
            additionalInfo.fileCategory = ".NET Development File";
            additionalInfo.framework = "Microsoft .NET";
            
            if ([".cs", ".vb", ".fs"].includes(ext)) {
              additionalInfo.fileType = "Source Code";
              additionalInfo.language = ext === ".cs" ? "C#" : ext === ".vb" ? "VB.NET" : "F#";
            } else if ([".csproj", ".vbproj", ".fsproj"].includes(ext)) {
              additionalInfo.fileType = "Project File";
              additionalInfo.description = "MSBuild project definition";
            } else if (ext === ".sln") {
              additionalInfo.fileType = "Solution File";
              additionalInfo.description = "Visual Studio solution";
            }
          }

          // Image file specific info
          const imageFiles = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".tif", ".webp", ".svg", ".ico"];
          if (imageFiles.includes(ext)) {
            additionalInfo.fileCategory = "Image File";
            additionalInfo.imageFormat = ext.replace(".", "").toUpperCase();
            additionalInfo.description = `${additionalInfo.imageFormat} image file`;
            
            // Note: For actual image dimensions, would need additional libraries like 'sharp' or 'image-size'
            additionalInfo.note = "Use image processing tools to get dimensions and detailed metadata";
          }

          // Binary/executable files
          const binaryFiles = [".dll", ".exe", ".msi"];
          if (binaryFiles.includes(ext)) {
            additionalInfo.fileCategory = "Binary/Executable";
            additionalInfo.warning = "Binary file - content cannot be read as text";
            
            if (ext === ".dll") {
              additionalInfo.fileType = "Dynamic Link Library";
              additionalInfo.description = ".NET assembly or Windows library";
            } else if (ext === ".exe") {
              additionalInfo.fileType = "Executable";
              additionalInfo.description = "Windows application or .NET assembly";
            } else if (ext === ".msi") {
              additionalInfo.fileType = "Installer Package";
              additionalInfo.description = "Windows Installer package";
            }
          }
        }

        return {
          success: true,
          path: validatedPath,
          name: path.basename(validatedPath),
          directory: path.dirname(validatedPath),
          extension: ext,
          type: stats.isFile() ? "file" : stats.isDirectory() ? "directory" : "other",
          size: stats.size,
          sizeFormatted: formatFileSize(stats.size),
          created: stats.birthtime,
          lastModified: stats.mtime,
          lastAccessed: stats.atime,
          mimeType: mimeType,
          readable: true,
          writable: false, // This plugin is read-only
          ...additionalInfo
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred"
        };
      }
    }
  });

  // Search files tool
  const searchFilesTool = tool({
    name: "search_files",
    description: text`
      Search for files matching a pattern in the specified directory.
      Supports wildcard patterns (* and ?).
    `,
    parameters: {
      search_path: z.string().describe("Directory path to search in"), 
      pattern: z.string().describe("File name pattern (supports wildcards * and ?)"),
      recursive: z.boolean().optional().default(false).describe("Whether to search recursively")
    },
    implementation: async ({ search_path, pattern, recursive }) => {
      try {
        const validatedPath = validatePath(search_path, config.restrictedPaths);
        const results: any[] = [];

        const matchesPattern = (filename: string, pattern: string): boolean => {
          const regex = new RegExp(
            "^" + pattern.replace(/\*/g, ".*").replace(/\?/g, ".") + "$", 
            "i"
          );
          return regex.test(filename);
        };

        const searchInDirectory = async (dirPath: string, depth: number = 0): Promise<void> => {
          if (depth > 10) return; // Prevent infinite recursion
          
          const entries = await fs.readdir(dirPath, { withFileTypes: true });

          for (const entry of entries) {
            const entryPath = path.join(dirPath, entry.name);
            
            if (entry.isFile()) {
              if (matchesPattern(entry.name, pattern)) {
                const stats = await fs.stat(entryPath);
                results.push({
                  name: entry.name,
                  path: entryPath,
                  directory: path.dirname(entryPath),
                  size: stats.size,
                  sizeFormatted: formatFileSize(stats.size),
                  lastModified: stats.mtime,
                  extension: path.extname(entry.name),
                  mimeType: mimeTypes.lookup(entryPath) || "unknown"
                });
              }
            } else if (entry.isDirectory() && recursive) {
              try {
                await searchInDirectory(entryPath, depth + 1);
              } catch (e) {
                // Skip directories we can't access
              }
            }
          }
        };

        await searchInDirectory(validatedPath);

        return {
          success: true,
          searchPath: validatedPath,
          pattern: pattern,
          recursive: recursive,
          results: results,
          count: results.length
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred"
        };
      }
    }
  });

  tools.push(readFileTool, listDirectoryTool, getFileInfoTool, searchFilesTool);
  return tools;
}