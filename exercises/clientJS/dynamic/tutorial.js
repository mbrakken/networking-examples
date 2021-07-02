import { $ } from '../modules/utilities.js';

const sandbox = $('sandbox');

sandbox.innerHTML = 'Click Here!<br/>';
sandbox.addEventListener('click', logEvent);
sandbox.addEventListener('mouseenter', logEvent);
sandbox.addEventListener('mouseleave', logEvent);

function logEvent(evt) {
  sandbox.innerHTML = `${evt.type} at ${new Date()}. Event: ${evt}<hr />`;

  for (const property in evt) {
    const message = `Property ${property}: ${evt[property]}<br />`;
    sandbox.innerHTML += message;
  }
}

