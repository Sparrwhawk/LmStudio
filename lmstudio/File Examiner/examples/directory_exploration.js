/**
 * Directory Exploration Example
 * Demonstrates how to browse directories and get file information
 */

const fileExaminer = require('../index.js');
const path = require('path');

async function directoryExplorationExample() {
    console.log('=== Directory Exploration Example ===\n');
    
    // Example 1: List current directory contents
    console.log('1. Listing current directory contents:');
    try {
        const currentDir = path.dirname(__dirname); // Parent directory (project root)
        const result = await fileExaminer.endpoints.list_directory({
            dir_path: currentDir,
            include_hidden: false
        });
        
        if (result.success) {
            console.log(`   ✓ Found ${result.data.count} items in ${result.data.path}`);
            
            result.data.items.forEach(item => {
                const sizeStr = item.type === 'file' ? ` (${formatFileSize(item.size)})` : '';
                console.log(`   ${item.type === 'directory' ? '📁' : '📄'} ${item.name}${sizeStr}`);
            });
        } else {
            console.log(`   ✗ Error: ${result.error}`);
        }
    } catch (error) {
        console.log(`   ✗ Error: ${error.message}`);
    }
    
    // Example 2: Get detailed file information
    console.log('\n2. Getting detailed file information:');
    try {
        const manifestPath = path.join(__dirname, '..', 'manifest.json');
        const result = await fileExaminer.endpoints.get_file_info({
            file_path: manifestPath
        });
        
        if (result.success) {
            const info = result.data;
            console.log(`   ✓ File: ${info.name}`);
            console.log(`   ✓ Path: ${info.path}`);
            console.log(`   ✓ Directory: ${info.directory}`);
            console.log(`   ✓ Extension: ${info.extension}`);
            console.log(`   ✓ Type: ${info.type}`);
            console.log(`   ✓ Size: ${info.sizeFormatted} (${info.size} bytes)`);
            console.log(`   ✓ MIME Type: ${info.mimeType}`);
            console.log(`   ✓ Created: ${info.created.toLocaleString()}`);
            console.log(`   ✓ Last Modified: ${info.lastModified.toLocaleString()}`);
            console.log(`   ✓ Last Accessed: ${info.lastAccessed.toLocaleString()}`);
        } else {
            console.log(`   ✗ Error: ${result.error}`);
        }
    } catch (error) {
        console.log(`   ✗ Error: ${error.message}`);
    }
    
    // Example 3: Browse a system directory (should work if accessible)
    console.log('\n3. Browsing user Documents folder:');
    try {
        const documentsPath = path.join(require('os').homedir(), 'Documents');
        const result = await fileExaminer.endpoints.list_directory({
            dir_path: documentsPath,
            include_hidden: false
        });
        
        if (result.success) {
            console.log(`   ✓ Found ${result.data.count} items in Documents folder`);
            
            // Show first 5 items
            const itemsToShow = result.data.items.slice(0, 5);
            itemsToShow.forEach(item => {
                const sizeStr = item.type === 'file' ? ` (${formatFileSize(item.size)})` : '';
                const icon = item.type === 'directory' ? '📁' : getFileIcon(item.extension);
                console.log(`   ${icon} ${item.name}${sizeStr}`);
            });
            
            if (result.data.items.length > 5) {
                console.log(`   ... and ${result.data.items.length - 5} more items`);
            }
        } else {
            console.log(`   ✗ Error: ${result.error}`);
        }
    } catch (error) {
        console.log(`   ✗ Error: ${error.message}`);
    }
    
    // Example 4: Try to access a restricted directory
    console.log('\n4. Testing security - trying to access System32:');
    try {
        const result = await fileExaminer.endpoints.list_directory({
            dir_path: 'C:\\Windows\\System32',
            include_hidden: false
        });
        
        if (result.success) {
            console.log('   ✗ Security test failed - access should have been blocked');
        } else {
            console.log(`   ✓ Security working correctly: ${result.error}`);
        }
    } catch (error) {
        console.log(`   ✓ Security working correctly: ${error.message}`);
    }
    
    // Example 5: Include hidden files
    console.log('\n5. Listing directory with hidden files:');
    try {
        const currentDir = path.dirname(__dirname);
        const result = await fileExaminer.endpoints.list_directory({
            dir_path: currentDir,
            include_hidden: true
        });
        
        if (result.success) {
            const hiddenItems = result.data.items.filter(item => item.name.startsWith('.'));
            if (hiddenItems.length > 0) {
                console.log(`   ✓ Found ${hiddenItems.length} hidden items:`);
                hiddenItems.forEach(item => {
                    console.log(`   🔍 ${item.name} (${item.type})`);
                });
            } else {
                console.log('   ℹ No hidden files found in this directory');
            }
        } else {
            console.log(`   ✗ Error: ${result.error}`);
        }
    } catch (error) {
        console.log(`   ✗ Error: ${error.message}`);
    }
    
    console.log('\n=== Directory Exploration Example Complete ===');
}

// Helper function to format file sizes
function formatFileSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
}

// Helper function to get file icons based on extension
function getFileIcon(extension) {
    const icons = {
        '.txt': '📄',
        '.md': '📝',
        '.json': '⚙️',
        '.js': '🟨',
        '.ts': '🔷',
        '.py': '🐍',
        '.html': '🌐',
        '.css': '🎨',
        '.xml': '📋',
        '.csv': '📊',
        '.log': '📜',
        '.yml': '⚙️',
        '.yaml': '⚙️',
        '.ini': '⚙️',
        '.cfg': '⚙️',
        '.conf': '⚙️'
    };
    
    return icons[extension] || '📄';
}

// Run the example
if (require.main === module) {
    directoryExplorationExample();
}

module.exports = { directoryExplorationExample };