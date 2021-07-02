import { $ } from '../modules/utilities.js';

const xhr = new XMLHttpRequest();

xhr.onreadystatechange = function () {
  console.log('readyState:', xhr.readyState);
  console.log('xhr:', xhr);

  if (xhr.readyState == 4) {
    // Request is finished
    if (xhr.status == 200) {
      $('sandbox').innerHTML = 'Retrieved from server ...<hr/>';
      $('sandbox').innerHTML += xhr.responseText;
    } else {
      alert('Message returned, but with error status.');
    }
  }
};

xhr.onerror = function() {
  
}

xhr.open('GET', 'message.html', true);
xhr.send(null);
