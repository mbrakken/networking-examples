import { $ } from '../modules/utilities.js';

$('findAnagrams').addEventListener('click', submitWord);

function submitWord() {
  const word = $('word').value;

  window
    .fetch(`anagrams.csv?word=${encodeURIComponent(word)}`, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    .then((res) => {
      if (!res.ok) {
        throw res;
      }

      return res.text();
    })
    .then(updateAnagramsDisplay)
    .catch((err) => {
      console.error(err);
      window.alert('An error occurred.');
    });
}

function updateAnagramsDisplay(anagramsCSV) {
  $('results').innerHTML = anagramsCSV.split(',').join('<br />');
}
