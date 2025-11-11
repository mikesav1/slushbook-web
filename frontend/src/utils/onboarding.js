/**
 * Onboarding Tour Configuration
 * Simple approach - no complex positioning
 */

const TOUR_KEYS = {
  HOME: 'tour_home_completed',
  RECIPES: 'tour_recipes_completed',
  ADD_RECIPE: 'tour_add_recipe_completed',
  MATCH: 'tour_match_completed',
  SHOPPING_LIST: 'tour_shopping_list_completed',
  SETTINGS: 'tour_settings_completed'
};

// Check if tour has been completed
export const isTourCompleted = (tourKey) => {
  return localStorage.getItem(tourKey) === 'true';
};

// Mark tour as completed
export const markTourCompleted = (tourKey) => {
  localStorage.setItem(tourKey, 'true');
};

// Reset all tours (for testing)
export const resetAllTours = () => {
  Object.values(TOUR_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
};

// HomePage Tour Steps
export const homePageSteps = [
  {
    // Step 1: Welcome message (no target to highlight)
    content: '🎉 Velkommen til Slush Book!\n\nHer kan du udforske opskrifter, finde inspiration og tilføje dine egne slushice-kreationer.\n\nFør vi går i gang, får du et par hurtige tips til, hvordan du bruger appen bedst.\n\nTryk Næste for at se, hvor du finder indstillinger og dine favoritter.'
  },
  {
    // Step 2: Point to settings menu
    target: '[data-tour="settings-menu"]',
    content: '👤 Her finder du profil-ikonet (eller tandhjulet på mobil).\n\nHer kan du åbne menuen med Indstillinger, Favoritter og Log ud.\n\nDu kan også genstarte denne guide under Indstillinger senere.'
  }
];

// Recipes Page Tour Steps  
export const recipesPageSteps = [
  {
    // Welcome to recipes page
    content: '📚 Velkommen til Opskrifter!\n\nHer finder du alle slushice-opskrifter. Lad os se på de vigtigste funktioner.'
  },
  {
    target: '[data-tour="search-bar"]',
    content: '🔍 Søg efter opskrifter\n\nBrug søgefeltet til at finde specifikke opskrifter hurtigt. Skriv f.eks. "jordbær" eller "klassisk".'
  },
  {
    target: '[data-tour="type-filter"]',
    content: '🎨 Filtrer efter type\n\nHer kan du filtrere opskrifter efter kategori.\n\nVælg mellem Klassisk, Tropisk, Cremet, Cocktail og flere andre.'
  },
  {
    target: '[data-tour="recipe-favorite"]',
    content: '❤️ Tilføj til favoritter\n\nKlik på hjertet på et opskriftskort for at gemme den som favorit.\n\nDine favoritter kan du finde under profil-menuen.'
  },
  {
    content: '🛒 Tip: Åbn en opskrift for mere!\n\nNår du klikker på en opskrift, kan du:\n• Se detaljerede ingredienser og instruktioner\n• Tilføje ingredienser til din indkøbsliste\n• Skalere opskriften til din maskinvolumen\n• Vurdere og dele opskriften'
  },
  {
    target: '[data-tour="add-recipe-card"]',
    content: '➕ Opret din egen opskrift\n\nDet første kort er "Tilføj Opskrift"-knappen.\n\nHer kan du oprette og dele dine egne slushice-kreationer!\n\nLad os gå derind og se hvordan det virker.'
  }
];

// Add Recipe Page Tour Steps
export const addRecipePageSteps = [
  {
    // Welcome to add recipe page
    content: '✨ Velkommen til Opret Opskrift!\n\nHer kan du skabe og dele dine egne slushice-kreationer.\n\nLad os gennemgå hvordan du opretter en opskrift trin for trin.'
  },
  {
    target: '[data-tour="recipe-name"]',
    content: '📝 Opskriftens navn\n\nGiv din opskrift et catchy og beskrivende navn!\n\nF.eks. "Sommer Jordbær", "Tropisk Paradise" eller "Cremet Blåbær".'
  },
  {
    target: '[data-tour="recipe-type"]',
    content: '🎨 Type og kategori\n\nVælg hvilken type opskrift det er (Klassisk, Juice, Smoothie, Cocktail osv.).\n\nDu kan også vælge farve, sukkergrad og om den indeholder alkohol.'
  },
  {
    target: '[data-tour="recipe-ingredients"]',
    content: '🥤 Ingredienser\n\nHer tilføjer du alle ingredienserne til din opskrift.\n\n• Søg efter eksisterende ingredienser\n• Eller opret nye ingredienser\n• Angiv mængde og enhed\n• Du kan tilføje flere ingredienser med "Tilføj" knappen'
  },
  {
    target: '[data-tour="recipe-public-toggle"]',
    content: '🌍 VIGTIGT: Offentlig opskrift\n\nHvis du vil DELE din opskrift med andre brugere, skal du aktivere "Offentlig opskrift".\n\n⚠️ OBS: Offentlige opskrifter skal godkendes af admin før de bliver synlige.\n\nPrivate opskrifter er kun synlige for dig.'
  },
  {
    target: '[data-tour="recipe-submit"]',
    content: '✅ Gem din opskrift\n\nNår du er tilfreds med din opskrift, klik "Opret Opskrift".\n\nDin opskrift bliver:\n• Tilføjet til din samling med det samme\n• Sendt til godkendelse hvis den er offentlig\n• Klar til at dele hvis den er offentlig og godkendt!'
  },
  {
    content: '🎉 Du er nu klar!\n\nDu ved nu hvordan du:\n• Søger og filtrerer opskrifter\n• Tilføjer favoritter\n• Opretter egne opskrifter\n\nGod fornøjelse med at udforske og skabe slushice-opskrifter! 🍹'
  }
];

export { TOUR_KEYS };
