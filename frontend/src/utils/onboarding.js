/**
 * Onboarding Tour Configuration
 * Tracks which tours have been shown to users
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
    content: '👤 Klik her for at åbne menuen med Indstillinger, Favoritter og Log ud',
    disableBeacon: true,
    placement: 'bottom'
  }
];

// Recipes Page Tour Steps
export const recipesPageSteps = [
  {
    target: '[data-tour="search-bar"]',
    content: '🔍 Søg efter opskrifter her',
    disableBeacon: true,
    placement: 'bottom'
  },
  {
    target: '[data-tour="type-filter"]',
    content: '🎨 Filtrer opskrifter efter type (klassisk, tropisk, etc.)',
    placement: 'bottom'
  },
  {
    target: '[data-tour="add-recipe-card"]',
    content: '➕ Klik her for at oprette din egen opskrift!',
    placement: 'top'
  }
];

// Add Recipe Page Tour Steps
export const addRecipePageSteps = [
  {
    target: '[data-tour="recipe-name"]',
    content: '📝 Start med at give din opskrift et navn',
    disableBeacon: true,
    placement: 'bottom'
  },
  {
    target: '[data-tour="recipe-type"]',
    content: '🎨 Vælg type og farve for din opskrift',
    placement: 'bottom'
  },
  {
    target: '[data-tour="recipe-ingredients"]',
    content: '🥤 Tilføj ingredienser her. Du kan søge efter eksisterende eller oprette nye',
    placement: 'top'
  },
  {
    target: '[data-tour="recipe-public-toggle"]',
    content: '🌍 VIGTIGT: Gør opskriften offentlig her, så andre kan se den! Den skal godkendes af admin først.',
    placement: 'top',
    styles: {
      options: {
        primaryColor: '#f59e0b', // Orange for vigtigt
        zIndex: 10000
      }
    }
  },
  {
    target: '[data-tour="recipe-submit"]',
    content: '✅ Når du er færdig, gem din opskrift her',
    placement: 'top'
  }
];

export { TOUR_KEYS };
