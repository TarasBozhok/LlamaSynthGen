import { styleText } from 'node:util';

export default function logger(msg) {
    // Promise.resolve().then(() => {
        var message = msg?.message || msg || {};
        if (typeof message === 'object') message = JSON.stringify(message);
        console.log( styleText(['green', 'bold'], 'DEBUG') );
        console.log( styleText('green', message) );
    // });
}
