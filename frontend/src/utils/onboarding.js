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
    target: '[data-tour="settings-menu"]',
    content: '👤 Velkommen! Klik på profil-ikonet øverst til højre (eller tandhjulet på mobil) for at åbne menuen med Indstillinger, Favoritter og Log ud. Du kan også genstarte denne guide under Indstillinger senere.'
  }
];

// Recipes Page Tour Steps  
export const recipesPageSteps = [
  {
    content: '🔍 Brug søgefeltet til at finde specifikke opskrifter hurtigt.'
  },
  {
    content: '🎨 Filtrer opskrifter efter type (Klassisk, Tropisk, Cremet osv.) for at finde præcis hvad du har lyst til.'
  },
  {
    content: '➕ Klik på "Tilføj Opskrift"-kortet (det første kort) for at oprette og dele dine egne slushice opskrifter!'
  }
];

// Add Recipe Page Tour Steps
export const addRecipePageSteps = [
  {
    content: '📝 Start med at give din opskrift et catchy navn!'
  },
  {
    content: '🎨 Vælg hvilken type opskrift det er, og hvilken farve din slushice har.'
  },
  {
    content: '🥤 Tilføj alle ingredienserne til din opskrift. Søg efter eksisterende ingredienser eller opret nye.'
  },
  {
    content: '🌍 VIGTIGT: Aktiver "Offentlig opskrift" for at dele din opskrift med andre! Den skal godkendes af admin, før den bliver synlig for alle.'
  },
  {
    content: '✅ Når du er tilfreds med din opskrift, klik "Gem" for at gemme den.'
  }
];

export { TOUR_KEYS };
