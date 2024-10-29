import { createReadStream, createWriteStream, mkdirSync, existsSync, accessSync, constants } from 'fs';
import { parse } from "csv-parse";
import { stringify } from 'csv-stringify/sync';

// es6 function to clean csv
export const flattenCsv = (csvFileLocation) => {
  // Ensure a CSV file location was provided
  if (csvFileLocation === '') {
    console.log('Please provide a csv file location');
    process.exit(1);
  }
  console.log(`Parsing through the csv file: ${csvFileLocation}`);

  // see if the csv file exists
  if (!existsSync(csvFileLocation)) {
    console.log('The csv file does not exist');
    process.exit(1);
  }

  // see if we have permissions for the file
  if(!hasPermission(csvFileLocation, constants.R_OK)){
    console.log('No read access to the csv file');
    process.exit(1);
  }

  // extract the file name from csvFileLocation
  let fileName = csvFileLocation.split('/').pop();
  console.log(`File name: ${fileName}`);

  // mkdir outputs if it doesn't exist
  if (!existsSync('outputs')) {
    console.log('Creating outputs directory');
    mkdirSync('outputs');
  }

  // Create a writable stream for output
  let writeStream = createWriteStream('outputs/flattened-'+fileName);
  console.log(`Writing to outputs/flattened-${fileName}`);

  // Initialize variables for handling rows
  let lastHandle = '';
  let mainRow = null;
  let images = [];
  let headersWritten = false;
  let rows = 0;

  // Start reading and processing the CSV file
  createReadStream(csvFileLocation)
    .pipe(parse({ columns: true }))
    .on('ready', function () {
      console.log('Ready to open the csv file...');
    })
    .on('open', function () {
      console.log('Reading the csv file...');
    })
    .on('error', function (err) {
      console.log(`Error reading the csv file: ${err}`);
      process.exit(1);
    })
    .on("data", function (row) {
      rows++;
      if (!headersWritten) {
        writeStream.write(stringify([Object.keys(row)], { header: false })); // Write the headers row to the file
        headersWritten = true;
      }  
      
      let currentHandle = row['Handle'];
      if (currentHandle === lastHandle) {
        // Accumulate images for the current product
        // if Image Src column is not null or empty
        if (row['Image Src'] !== null && row['Image Src'].trim() !== ''){
          images.push(row['Image Src']);
        }
      } else {
        if (mainRow !== null) {
          // Append images to mainRow
          mainRow['Image Src'] = images.join(", ");
          writeStream.write(
            stringify([mainRow], { header: false })
          ); // Write the row via stringifier
        }
        // Reset for the new main row
        mainRow = row;
        lastHandle = currentHandle;
        images = [row['Image Src']]; // Start a new image list
      }
    })
    .on("end", function () {
      // Write the last row to the file
      if (mainRow !== null) {
        mainRow['Image Src'] = images.join(", ");
        writeStream.write(
          stringify([mainRow], { header: false })
        ); // Write the row via stringifier
      }
      writeStream.end(); // Close the write stream
      console.log("CSV file parsing and writing complete.");
      console.log(`Rows ${rows}`)
    });

    // log the file location of the flattened csv
    console.log(`Flattened CSV file location: outputs/flattened-${fileName}`);
};


async function hasPermission(filePath, permission) {
  try {
    accessSync(filePath, permission);
    return true; // Permission is granted
  } catch (err) {
    return false; // Permission is denied
  }
}
