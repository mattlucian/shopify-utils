import { argv } from 'node:process';
import { flattenCsv } from './csv/flatten.js';

// validate args passed at least 2
if (argv.length < 3) {
  console.log('Please provide a command');
  console.log('Usage: npm run <command> <args>');
  console.log('Commands: ');
  console.log('  flatten <csvFileLocation>');
  process.exit(1);
}

// extract index 2 value
const command = argv[2];

switch (command) {
  case 'flatten':
    // verify 3 args for csv file location
    if (argv.length < 4) {
      console.log('The flatten command requires a csv file location as the next arg');
      process.exit(1);
      break;
    }
    flattenCsv(argv[3]);
    break;
  default:
    console.log('Invalid command provided');
    process.exit(1);
}
