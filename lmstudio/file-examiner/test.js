const fileExaminer = require('./index.js');

/**
 * Test suite for File Examiner add-on
 */
async function runTests() {
    console.log('Running File Examiner tests...\n');
    
    // Test 1: Read current directory
    console.log('Test 1: List current directory');
    try {
        const result = await fileExaminer.endpoints.list_directory({
            dir_path: __dirname,
            include_hidden: false
        });
        console.log('✓ Success:', result.success);
        if (result.success) {
            console.log(`  Found ${result.data.count} items`);
        }
    } catch (error) {
        console.log('✗ Error:', error.message);
    }
    
    // Test 2: Get file info for manifest
    console.log('\nTest 2: Get file info for manifest.json');
    try {
        const manifestPath = require('path').join(__dirname, 'manifest.json');
        const result = await fileExaminer.endpoints.get_file_info({
            file_path: manifestPath
        });
        console.log('✓ Success:', result.success);
        if (result.success) {
            console.log(`  File size: ${result.data.sizeFormatted}`);
            console.log(`  MIME type: ${result.data.mimeType}`);
        }
    } catch (error) {
        console.log('✗ Error:', error.message);
    }
    
    // Test 3: Read package.json content
    console.log('\nTest 3: Read package.json content');
    try {
        const packagePath = require('path').join(__dirname, 'package.json');
        const result = await fileExaminer.endpoints.read_file({
            file_path: packagePath,
            encoding: 'utf8'
        });
        console.log('✓ Success:', result.success);
        if (result.success) {
            console.log(`  Content length: ${result.data.content.length} characters`);
            console.log(`  File size: ${result.data.size} bytes`);
        }
    } catch (error) {
        console.log('✗ Error:', error.message);
    }
    
    // Test 4: Search for JSON files
    console.log('\nTest 4: Search for .json files');
    try {
        const result = await fileExaminer.endpoints.search_files({
            search_path: __dirname,
            pattern: '*.json',
            recursive: false
        });
        console.log('✓ Success:', result.success);
        if (result.success) {
            console.log(`  Found ${result.data.count} JSON files`);
            result.data.results.forEach(file => {
                console.log(`    - ${file.name}`);
            });
        }
    } catch (error) {
        console.log('✗ Error:', error.message);
    }
    
    // Test 5: Test security - try to access restricted path
    console.log('\nTest 5: Security test - accessing restricted path');
    try {
        const result = await fileExaminer.endpoints.list_directory({
            dir_path: 'C:\\Windows\\System32',
            include_hidden: false
        });
        console.log('✗ Security test failed - should have been blocked');
    } catch (error) {
        console.log('✓ Security test passed - access correctly blocked');
    }
    
    // Test 6: Test file extension validation
    console.log('\nTest 6: File extension validation test');
    try {
        // Create a temporary test file with disallowed extension
        const testPath = require('path').join(__dirname, 'test.exe');
        require('fs').writeFileSync(testPath, 'test content');
        
        const result = await fileExaminer.endpoints.read_file({
            file_path: testPath,
            encoding: 'utf8'
        });
        
        // Clean up
        require('fs').unlinkSync(testPath);
        
        if (result.success) {
            console.log('✗ Extension validation failed - should have been blocked');
        } else {
            console.log('✓ Extension validation passed - .exe file correctly blocked');
        }
    } catch (error) {
        console.log('✓ Extension validation test completed');
    }
    
    console.log('\nAll tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests();
}

module.exports = { runTests };