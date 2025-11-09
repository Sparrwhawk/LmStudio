const fs = require('fs').promises;
const path = require('path');
const mime = require('mime-types');
const { promisify } = require('util');

/**
 * LM Studio File Examiner Add-on
 * Provides safe file system access for AI models
 */
class FileExaminer {
    constructor() {
        this.manifest = require('./manifest.json');
        this.restrictedPaths = this.manifest.security.restricted_paths;
        this.allowedExtensions = this.manifest.security.allowed_extensions;
        this.maxFileSize = this.parseFileSize(this.manifest.security.max_file_size);
    }

    /**
     * Parse file size string to bytes
     */
    parseFileSize(sizeStr) {
        const units = { B: 1, KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 };
        const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)$/i);
        if (!match) return 10 * 1024 * 1024; // Default 10MB
        return parseFloat(match[1]) * units[match[2].toUpperCase()];
    }

    /**
     * Validate file path for security
     */
    validatePath(filePath) {
        const normalizedPath = path.resolve(filePath);
        
        // Check if path is in restricted directories
        for (const restrictedPath of this.restrictedPaths) {
            if (normalizedPath.toLowerCase().startsWith(restrictedPath.toLowerCase())) {
                throw new Error(`Access denied: Path is in restricted directory: ${restrictedPath}`);
            }
        }

        return normalizedPath;
    }

    /**
     * Validate file extension
     */
    validateExtension(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        if (this.allowedExtensions.length > 0 && !this.allowedExtensions.includes(ext)) {
            throw new Error(`File type not allowed: ${ext}`);
        }
        return true;
    }

    /**
     * Read file contents
     */
    async readFile(filePath, encoding = 'utf8') {
        try {
            const validatedPath = this.validatePath(filePath);
            this.validateExtension(validatedPath);

            // Check if file exists
            const stats = await fs.stat(validatedPath);
            
            if (!stats.isFile()) {
                throw new Error('Path is not a file');
            }

            // Check file size
            if (stats.size > this.maxFileSize) {
                throw new Error(`File too large: ${stats.size} bytes (max: ${this.maxFileSize})`);
            }

            const content = await fs.readFile(validatedPath, encoding);
            
            return {
                success: true,
                data: {
                    content: content,
                    path: validatedPath,
                    size: stats.size,
                    encoding: encoding,
                    mimeType: mime.lookup(validatedPath) || 'unknown',
                    lastModified: stats.mtime
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * List directory contents
     */
    async listDirectory(dirPath, includeHidden = false) {
        try {
            const validatedPath = this.validatePath(dirPath);

            const stats = await fs.stat(validatedPath);
            if (!stats.isDirectory()) {
                throw new Error('Path is not a directory');
            }

            const entries = await fs.readdir(validatedPath, { withFileTypes: true });
            const items = [];

            for (const entry of entries) {
                if (!includeHidden && entry.name.startsWith('.')) {
                    continue;
                }

                const itemPath = path.join(validatedPath, entry.name);
                const itemStats = await fs.stat(itemPath);

                items.push({
                    name: entry.name,
                    path: itemPath,
                    type: entry.isDirectory() ? 'directory' : 'file',
                    size: itemStats.size,
                    lastModified: itemStats.mtime,
                    extension: entry.isFile() ? path.extname(entry.name) : null,
                    mimeType: entry.isFile() ? (mime.lookup(entry.name) || 'unknown') : null
                });
            }

            return {
                success: true,
                data: {
                    path: validatedPath,
                    items: items,
                    count: items.length
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get file information and metadata
     */
    async getFileInfo(filePath) {
        try {
            const validatedPath = this.validatePath(filePath);
            const stats = await fs.stat(validatedPath);

            return {
                success: true,
                data: {
                    path: validatedPath,
                    name: path.basename(validatedPath),
                    directory: path.dirname(validatedPath),
                    extension: path.extname(validatedPath),
                    type: stats.isFile() ? 'file' : stats.isDirectory() ? 'directory' : 'other',
                    size: stats.size,
                    sizeFormatted: this.formatFileSize(stats.size),
                    created: stats.birthtime,
                    lastModified: stats.mtime,
                    lastAccessed: stats.atime,
                    permissions: stats.mode,
                    mimeType: stats.isFile() ? (mime.lookup(validatedPath) || 'unknown') : null,
                    readable: true, // Will be false if we can't access it
                    writable: false // This add-on is read-only
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Search for files matching a pattern
     */
    async searchFiles(searchPath, pattern, recursive = false) {
        try {
            const validatedPath = this.validatePath(searchPath);
            const results = [];

            const searchInDirectory = async (dirPath, depth = 0) => {
                const entries = await fs.readdir(dirPath, { withFileTypes: true });

                for (const entry of entries) {
                    const entryPath = path.join(dirPath, entry.name);
                    
                    if (entry.isFile()) {
                        if (this.matchesPattern(entry.name, pattern)) {
                            const stats = await fs.stat(entryPath);
                            results.push({
                                name: entry.name,
                                path: entryPath,
                                directory: dirPath,
                                size: stats.size,
                                lastModified: stats.mtime,
                                extension: path.extname(entry.name),
                                mimeType: mime.lookup(entry.name) || 'unknown'
                            });
                        }
                    } else if (entry.isDirectory() && recursive) {
                        await searchInDirectory(entryPath, depth + 1);
                    }
                }
            };

            await searchInDirectory(validatedPath);

            return {
                success: true,
                data: {
                    searchPath: validatedPath,
                    pattern: pattern,
                    recursive: recursive,
                    results: results,
                    count: results.length
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Check if filename matches pattern (supports basic wildcards)
     */
    matchesPattern(filename, pattern) {
        const regex = new RegExp(
            pattern
                .replace(/\*/g, '.*')
                .replace(/\?/g, '.')
                .replace(/\./g, '\\.')
        );
        return regex.test(filename);
    }

    /**
     * Format file size in human readable format
     */
    formatFileSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let size = bytes;
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }
}

// Export for LM Studio
const fileExaminer = new FileExaminer();

module.exports = {
    name: 'File Examiner',
    version: '1.0.0',
    description: 'Examine and read files from the local file system',
    
    // API endpoints
    endpoints: {
        read_file: async (params) => {
            return await fileExaminer.readFile(params.file_path, params.encoding);
        },
        
        list_directory: async (params) => {
            return await fileExaminer.listDirectory(params.dir_path, params.include_hidden);
        },
        
        get_file_info: async (params) => {
            return await fileExaminer.getFileInfo(params.file_path);
        },
        
        search_files: async (params) => {
            return await fileExaminer.searchFiles(params.search_path, params.pattern, params.recursive);
        }
    },
    
    // Initialization
    init: () => {
        console.log('File Examiner add-on initialized');
        return true;
    },
    
    // Cleanup
    cleanup: () => {
        console.log('File Examiner add-on cleaned up');
        return true;
    }
};