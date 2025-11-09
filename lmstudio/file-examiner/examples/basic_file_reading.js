/**
 * Basic File Reading Example
 * Demonstrates how to read files using the File Examiner add-on
 */

const fileExaminer = require('../index.js');

async function basicFileReadingExample() {
    console.log('=== Basic File Reading Example ===\n');
    
    // Example 1: Read a text file
    console.log('1. Reading a text file:');
    try {
        // First, let's see what files are in the current directory
        const dirListing = await fileExaminer.endpoints.list_directory({
            dir_path: __dirname,
            include_hidden: false
        });
        
        if (dirListing.success && dirListing.data.items.length > 0) {
            // Find a text file to read
            const textFile = dirListing.data.items.find(item => 
                item.type === 'file' && 
                (item.extension === '.txt' || item.extension === '.md' || item.extension === '.js')
            );
            
            if (textFile) {
                console.log(`   Reading: ${textFile.name}`);
                
                const result = await fileExaminer.endpoints.read_file({
                    file_path: textFile.path,
                    encoding: 'utf8'
                });
                
                if (result.success) {
                    console.log(`   ✓ Successfully read ${result.data.size} bytes`);
                    console.log(`   ✓ File type: ${result.data.mimeType}`);
                    console.log(`   ✓ First 100 characters: "${result.data.content.substring(0, 100)}..."`);
                } else {
                    console.log(`   ✗ Error: ${result.error}`);
                }
            } else {
                console.log('   No suitable text files found in current directory');
            }
        }
    } catch (error) {
        console.log(`   ✗ Error: ${error.message}`);
    }
    
    // Example 2: Read package.json
    console.log('\n2. Reading package.json:');
    try {
        const packagePath = require('path').join(__dirname, '..', 'package.json');
        const result = await fileExaminer.endpoints.read_file({
            file_path: packagePath,
            encoding: 'utf8'
        });
        
        if (result.success) {
            const packageData = JSON.parse(result.data.content);
            console.log(`   ✓ Package name: ${packageData.name}`);
            console.log(`   ✓ Version: ${packageData.version}`);
            console.log(`   ✓ Description: ${packageData.description}`);
        } else {
            console.log(`   ✗ Error: ${result.error}`);
        }
    } catch (error) {
        console.log(`   ✗ Error: ${error.message}`);
    }
    
    // Example 3: Try to read a non-existent file
    console.log('\n3. Attempting to read non-existent file:');
    try {
        const result = await fileExaminer.endpoints.read_file({
            file_path: 'C:\\nonexistent\\file.txt',
            encoding: 'utf8'
        });
        
        if (result.success) {
            console.log('   ✗ Unexpected success');
        } else {
            console.log(`   ✓ Correctly handled error: ${result.error}`);
        }
    } catch (error) {
        console.log(`   ✓ Correctly handled error: ${error.message}`);
    }
    
    // Example 4: Read with different encoding
    console.log('\n4. Reading manifest.json with base64 encoding:');
    try {
        const manifestPath = require('path').join(__dirname, '..', 'manifest.json');
        const result = await fileExaminer.endpoints.read_file({
            file_path: manifestPath,
            encoding: 'base64'
        });
        
        if (result.success) {
            console.log(`   ✓ Base64 encoded content length: ${result.data.content.length} characters`);
            console.log(`   ✓ Original file size: ${result.data.size} bytes`);
            
            // Decode to verify
            const decoded = Buffer.from(result.data.content, 'base64').toString('utf8');
            console.log(`   ✓ Decoded content starts with: "${decoded.substring(0, 50)}..."`);
        } else {
            console.log(`   ✗ Error: ${result.error}`);
        }
    } catch (error) {
        console.log(`   ✗ Error: ${error.message}`);
    }
    
    console.log('\n=== Basic File Reading Example Complete ===');
}

// Run the example
if (require.main === module) {
    basicFileReadingExample();
}

module.exports = { basicFileReadingExample };