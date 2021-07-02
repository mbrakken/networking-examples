module.exports = function findAnagrams(word) {
  const sorted = word
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .split('')
    .sort()
    .join('');

  return findAnagramsRecursive(sorted);
};

/* Assumes word is sorted */
function findAnagramsRecursive(word) {
  const wordLength = word.length;

  if (wordLength === 0) {
    return [];
  }

  if (wordLength === 1) {
    return [word];
  }

  // For each character in the word, extract it and find all anagrams
  // where it's the first character.
  const anagrams = [];

  for (let idx = 0; idx < wordLength; idx++) {
    const extractedChar = word.slice(idx, idx + 1);

    // If same as previous, don't process any further as it will only
    // create duplicates (this is the only check against duplicates,
    // since the word is sorted).
    const sameAsPreviousChar =
      idx > 0 && extractedChar === word.slice(idx - 1, idx);

    if (!sameAsPreviousChar) {
      const otherCharacters = word.slice(0, idx) + word.slice(idx + 1);
      const anagramsOfRemaining = findAnagramsRecursive(otherCharacters);

      anagramsOfRemaining.forEach((remaining) => {
        anagrams.push(extractedChar + remaining);
      });
    }
  }

  return anagrams;
}
