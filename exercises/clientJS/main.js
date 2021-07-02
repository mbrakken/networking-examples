import { $ } from './modules/utilities.js';

const sandbox = $('sandbox');

const greeting = document.createElement('span');
greeting.style.backgroundColor = 'yellow';
greeting.innerHTML = 'Hello World!';

sandbox.appendChild(greeting);
sandbox.appendChild(document.createElement('hr'));

const link = document.createElement('a');
link.href = 'https://www.propellerhealth.com';
link.appendChild(document.createTextNode('More Ajax Stuff ...'));

$('sandbox').appendChild(link);
