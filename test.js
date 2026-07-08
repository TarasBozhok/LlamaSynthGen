import { fileURLToPath } from 'node:url';


var thePath = fileURLToPath(import.meta.url)
console.log(typeof thePath, thePath);