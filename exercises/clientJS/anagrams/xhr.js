import { $ } from '../modules/utilities.js';

$('findAnagrams').addEventListener('click', submitWord);

function submitWord() {
  const xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      // Request is finished
      if (xhr.status === 200) {
        const anagramsCSV = xhr.responseText;

        updateAnagramsDisplay(anagramsCSV);
      } else {
        window.alert('An error occurred.');
      }
    }
  };

  const word = $('word').value;

  xhr.open('GET', 'anagrams.csv?word=' + word, true);
  xhr.send(word);
}

function updateAnagramsDisplay(anagramsCSV) {
  $('results').innerHTML = anagramsCSV.split(',').join('<br />');
}
