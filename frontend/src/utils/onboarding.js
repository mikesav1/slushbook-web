/**
 * Onboarding Tour Configuration
 * Simple approach - no complex positioning
 */

import i18n from '../i18n/config';

const TOUR_KEYS = {
  HOME: 'tour_home_completed',
  RECIPES: 'tour_recipes_completed',
  ADD_RECIPE: 'tour_add_recipe_completed',
  MATCH: 'tour_match_completed',
  SHOPPING_LIST: 'tour_shopping_list_completed',
  SETTINGS: 'tour_settings_completed'
};

// Check if tour has been completed
export const isTourCompleted = (tourKey, user) => {
  // If user is logged in, check from user profile
  if (user && user.completed_tours) {
    return user.completed_tours.includes(tourKey);
  }
  // Fallback to localStorage for guests
  return localStorage.getItem(tourKey) === 'true';
};

// Mark tour as completed
export const markTourCompleted = async (tourKey, API, updateCompletedTours) => {
  // Save to localStorage as backup
  localStorage.setItem(tourKey, 'true');
  
  // Save to database if API URL is provided
  if (API) {
    try {
      const response = await fetch(`${API}/users/complete-tour`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ tour_id: tourKey })
      });
      
      if (response.ok && updateCompletedTours) {
        // Update user context immediately so tour doesn't show again
        updateCompletedTours(tourKey);
        console.log('[Onboarding] Tour completed and user context updated:', tourKey);
      }
    } catch (error) {
      console.error('Failed to save tour completion to database:', error);
      // Don't throw - localStorage fallback already saved
    }
  }
};

// Reset all tours (for testing)
export const resetAllTours = () => {
  Object.values(TOUR_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
};

// Reset individual tour
export const resetTour = (tourKey) => {
  localStorage.removeItem(tourKey);
};

// HomePage Tour Steps - Function to include user's first name
export const getHomePageSteps = (userName) => {
  // Extract first name from full name
  const firstName = userName ? userName.split(' ')[0] : '';
  const greeting = firstName 
    ? i18n.t('tour.home.welcomeWithName', { name: firstName })
    : i18n.t('tour.home.welcome');
  
  return [
    {
      // Step 1: Welcome message (no target to highlight)
      content: `${greeting}\n\n${i18n.t('tour.home.step1')}`
    },
    {
      // Step 2: Point to settings menu
      target: '[data-tour="settings-menu"]',
      content: i18n.t('tour.home.step2')
    }
  ];
};

// Keep the old export for backwards compatibility (without name)
export const homePageSteps = getHomePageSteps();

// Recipes Page Tour Steps  
export const recipesPageSteps = [
  {
    // Welcome to recipes page
    content: i18n.t('tour.recipes.welcome')
  },
  {
    target: '[data-tour="search-bar"]',
    content: i18n.t('tour.recipes.step1')
  },
  {
    target: '[data-tour="type-filter"]',
    content: i18n.t('tour.recipes.step2')
  },
  {
    target: '[data-tour="recipe-favorite"]',
    content: i18n.t('tour.recipes.step3')
  },
  {
    content: i18n.t('tour.recipes.step4')
  },
  {
    target: '[data-tour="add-recipe-card"]',
    content: i18n.t('tour.recipes.step5')
  }
];

// Add Recipe Page Tour Steps
export const addRecipePageSteps = [
  {
    // Welcome to add recipe page
    content: i18n.t('tour.addRecipe.welcome')
  },
  {
    target: '[data-tour="recipe-name"]',
    content: i18n.t('tour.addRecipe.step1')
  },
  {
    target: '[data-tour="recipe-type"]',
    content: i18n.t('tour.addRecipe.step2')
  },
  {
    target: '[data-tour="recipe-ingredients"]',
    content: i18n.t('tour.addRecipe.step3')
  },
  {
    target: '[data-tour="recipe-public-toggle"]',
    content: i18n.t('tour.addRecipe.step4')
  },
  {
    target: '[data-tour="recipe-submit"]',
    content: i18n.t('tour.addRecipe.step5')
  },
  {
    content: i18n.t('tour.addRecipe.complete')
  }
];


// Match Finder Page Tour Steps
export const matchPageSteps = [
  {
    content: i18n.t('tour.match.welcome')
  },
  {
    target: '[data-tour="add-pantry-button"]',
    content: i18n.t('tour.match.step1')
  },
  {
    target: '[data-tour="find-matches-button"]',
    content: i18n.t('tour.match.step2')
  },
  {
    content: i18n.t('tour.match.tips')
  }
];

// Shopping List Page Tour Steps
export const shoppingListPageSteps = [
  {
    content: i18n.t('tour.shopping.welcome')
  },
  {
    target: '[data-tour="shopping-item"]',
    content: i18n.t('tour.shopping.step1')
  },
  {
    target: '[data-tour="buy-button"]',
    content: i18n.t('tour.shopping.step2')
  },
  {
    content: i18n.t('tour.shopping.tips')
  }
];

// Settings Page Tour Steps (Machine setup)
export const settingsPageSteps = [
  {
    content: i18n.t('tour.settings.welcome')
  },
  {
    target: '[data-tour="machine-section"]',
    content: i18n.t('tour.settings.step1')
  },
  {
    target: '[data-tour="add-machine-button"]',
    content: i18n.t('tour.settings.step2')
  },
  {
    target: '[data-tour="restart-tours-button"]',
    content: i18n.t('tour.settings.step3')
  },
  {
    target: '[data-tour="guide-link"]',
    content: i18n.t('tour.settings.step4')
  },
  {
    content: i18n.t('tour.settings.tips')
  }
];


export { TOUR_KEYS };
