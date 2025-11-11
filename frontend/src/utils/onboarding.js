/**
 * Onboarding Tour Configuration
 * Simple approach - no complex positioning
 */

const TOUR_KEYS = {
  HOME: 'tour_home_completed',
  RECIPES: 'tour_recipes_completed',
  ADD_RECIPE: 'tour_add_recipe_completed'
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
    target: '[data-tour="search-bar"]',
    content: '🔍 Brug søgefeltet til at finde specifikke opskrifter hurtigt.'
  },
  {
    target: '[data-tour="type-filter"]',
    content: '🎨 Filtrer opskrifter efter type (Klassisk, Tropisk, Cremet osv.) for at finde præcis hvad du har lyst til.'
  },
  {
    target: '[data-tour="add-recipe-card"]',
    content: '➕ Klik på "Tilføj Opskrift"-kortet (det første kort) for at oprette og dele dine egne slushice opskrifter!'
  }
];

// Add Recipe Page Tour Steps
export const addRecipePageSteps = [
  {
    target: '[data-tour="recipe-name"]',
    content: '📝 Start med at give din opskrift et catchy navn!'
  },
  {
    target: '[data-tour="recipe-type"]',
    content: '🎨 Vælg hvilken type opskrift det er, og hvilken farve din slushice har.'
  },
  {
    target: '[data-tour="recipe-ingredients"]',
    content: '🥤 Tilføj alle ingredienserne til din opskrift. Søg efter eksisterende ingredienser eller opret nye.'
  },
  {
    target: '[data-tour="recipe-public-toggle"]',
    content: '🌍 VIGTIGT: Aktiver "Offentlig opskrift" for at dele din opskrift med andre! Den skal godkendes af admin, før den bliver synlig for alle.'
  },
  {
    target: '[data-tour="recipe-submit"]',
    content: '✅ Når du er tilfreds med din opskrift, klik "Gem" for at gemme den.'
  }
];

export { TOUR_KEYS };
