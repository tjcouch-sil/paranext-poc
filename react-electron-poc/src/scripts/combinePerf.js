const fs = require('fs');

// Courtesy of ChatGPT and TJ Couch

// Define the file paths
const inputFilePath = './assets/testScripture/CSB/19PSACSB.perf.json'; // Replace with your input JSON file path
const outputFilePath = './assets/testScripture/CSB/19PSACSB-combined.perf.json'; // Replace with your desired output JSON file path

/** Function to perform the desired transformation (e.g., convert values to uppercase). MODIFIES THE OBJECT IN PLACE */
function transformJson(dataObj) {
    const mainSequence = dataObj.sequences[dataObj.main_sequence_id];

    // First paragraph block in the main sequence
    let firstParagraphIndex = -1;
    // Other paragraph blocks in the main sequence
    const otherParagraphIndices = [];

    // Identify the first paragraph and add the contents of all the other paragraph blocks to it
    mainSequence.blocks.forEach((block, index) => {
        if (block.type === 'paragraph') {
            if (firstParagraphIndex < 0) firstParagraphIndex = index;
            else {
                otherParagraphIndices.push(index);
                mainSequence.blocks[firstParagraphIndex].content.push(
                    ...block.content,
                );
            }
        }
    });

    // Remove all the other paragraph blocks
    otherParagraphIndices.forEach((index, previouslyRemovedCount) =>
        mainSequence.blocks.splice(index - previouslyRemovedCount, 1),
    );
}

// Load the JSON data from the input file
fs.readFile(inputFilePath, 'utf8', (error, fileContents) => {
    if (error) {
        console.error(`Error reading ${inputFilePath}: ${error}`);
        return;
    }

    try {
        // Remove "PERF\n" from the start
        const data = fileContents.startsWith('PERF\n')
            ? fileContents.substring(5)
            : fileContents;

        // Parse the JSON data
        const dataObj = JSON.parse(data);

        // Transform the JSON data (for example, convert values to uppercase)
        transformJson(dataObj);

        // Convert the transformed data back to a JSON string
        const transformedJsonString = JSON.stringify(dataObj, null, 2);

        // Save the transformed data to the output file
        fs.writeFile(outputFilePath, transformedJsonString, 'utf8', (err) => {
            if (err) {
                console.error(`Error writing to ${outputFilePath}: ${err}`);
            } else {
                console.log(`Transformed JSON data saved to ${outputFilePath}`);
            }
        });
    } catch (parseError) {
        console.error(`Error parsing JSON data: ${parseError}`);
    }
});
