/**
 * Konverterer Title Case til dansk sentence case
 * Eksempel: "Jordbær Klassisk" → "Jordbær klassisk"
 */
export const toSentenceCase = (text) => {
  if (!text) return text;
  
  // Split i ord
  const words = text.split(' ');
  
  // Første ord beholder sin formatering (første bogstav stor)
  // Alle andre ord får kun små bogstaver, medmindre det er akronymer eller særlige navne
  return words.map((word, index) => {
    if (index === 0) {
      // Første ord - behold som det er eller sørg for første bogstav er stor
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    } else {
      // Tjek om det er et akronym (alle bogstaver store)
      if (word === word.toUpperCase() && word.length <= 3) {
        return word; // Behold akronymer som USB, API, osv.
      }
      // Ellers gør små bogstaver
      return word.toLowerCase();
    }
  }).join(' ');
};
