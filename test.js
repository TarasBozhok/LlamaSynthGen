import { fileURLToPath } from 'node:url';
import { styleText } from 'node:util';


console.log( styleText('green', 'asdfkjhgfdskkjtrerjkjhgfdfghjhgf\n\n') );

process.stdout.write( styleText('red', 'wjkjhgfdsafghfds\n\n\n') );

process.stdout.write('some normal text');

console.log('console log')