import { text, tool, type Tool, type ToolsProviderController } from "@lmstudio/sdk";
import { promises as fs } from "fs";
import * as path from "path";
import * as mimeTypes from "mime-types";
import { z } from "zod";

// Security configuration
const RESTRICTED_PATHS = [
  "C:\\Windows\\System32",
  "C:\\Program Files", 
  "C:\\Program Files (x86)"
];

const ALLOWED_EXTENSIONS = [
  ".txt", ".md", ".json", ".xml", ".csv", ".log",
  ".js", ".ts", ".py", ".java", ".cpp", ".c", ".h", 
  ".html", ".css", ".sql", ".yml", ".yaml", ".ini",
  ".cfg", ".conf", ".properties"
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Validate file path for security
 */
function validatePath(filePath: string): string {
  const normalizedPath = path.resolve(filePath);
  
  // Check if path is in restricted directories
  for (const restrictedPath of RESTRICTED_PATHS) {
    if (normalizedPath.toLowerCase().startsWith(restrictedPath.toLowerCase())) {
      throw new Error(`Access denied: Path is in restricted directory: ${restrictedPath}`);
    }
  }

  return normalizedPath;
}

/**
 * Validate file extension
 */
function validateExtension(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  if (ALLOWED_EXTENSIONS.length > 0 && !ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(`File type not allowed: ${ext}`);
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

  // Read file tool
  const readFileTool = tool({
    name: "read_file",
    description: text`
      Read the contents of a file from the local file system. 
      Only specific file types are allowed for security.
      Restricted from accessing system directories.
    `,
    parameters: {
      file_path: z.string().describe("Absolute path to the file to read"),
      encoding: z.string().optional().default("utf8").describe("File encoding (default: utf8)")
    },
    implementation: async ({ file_path, encoding }) => {
      try {
        const validatedPath = validatePath(file_path);
        validateExtension(validatedPath);

        // Check if file exists
        const stats = await fs.stat(validatedPath);
        
        if (!stats.isFile()) {
          throw new Error("Path is not a file");
        }

        // Check file size
        if (stats.size > MAX_FILE_SIZE) {
          throw new Error(`File too large: ${stats.size} bytes (max: ${MAX_FILE_SIZE})`);
        }

        const content = await fs.readFile(validatedPath, encoding as BufferEncoding);
        
        return {
          success: true,
          content: content,
          path: validatedPath,
          size: stats.size,
          sizeFormatted: formatFileSize(stats.size),
          encoding: encoding,
          mimeType: mimeTypes.lookup(validatedPath) || "unknown",
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
        const validatedPath = validatePath(dir_path);

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
    `,
    parameters: {
      file_path: z.string().describe("Absolute path to the file or directory")
    },
    implementation: async ({ file_path }) => {
      try {
        const validatedPath = validatePath(file_path);
        const stats = await fs.stat(validatedPath);

        return {
          success: true,
          path: validatedPath,
          name: path.basename(validatedPath),
          directory: path.dirname(validatedPath),
          extension: path.extname(validatedPath),
          type: stats.isFile() ? "file" : stats.isDirectory() ? "directory" : "other",
          size: stats.size,
          sizeFormatted: formatFileSize(stats.size),
          created: stats.birthtime,
          lastModified: stats.mtime,
          lastAccessed: stats.atime,
          mimeType: stats.isFile() ? (mimeTypes.lookup(validatedPath) || "unknown") : null,
          readable: true,
          writable: false // This plugin is read-only
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
        const validatedPath = validatePath(search_path);
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