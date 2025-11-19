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
    content: '🎯 Velkommen til Match-Finder!\n\nHer kan du finde opskrifter baseret på de ingredienser du allerede har.\n\nLad os se hvordan det virker.'
  },
  {
    target: '[data-tour="add-pantry-button"]',
    content: '📦 Tilføj ingredienser til dit "skab"\n\nKlik her for at tilføje ingredienser du har derhjemme.\n\nJo flere ingredienser du tilføjer, desto bedre matches får du!'
  },
  {
    target: '[data-tour="find-matches-button"]',
    content: '🔍 Find matches\n\nNår du har tilføjet dine ingredienser, klik her for at finde opskrifter du kan lave.\n\nSystemet viser opskrifter du kan lave med det du har!'
  },
  {
    content: '💡 Tips til Match-Finder\n\n• Start med at tilføje de basale ingredienser (sukker, citron, vand)\n• Tilføj frugter og smagsvarianter du har\n• Systemet viser hvor mange % match der er\n• Du kan købe manglende ingredienser direkte fra listen!'
  }
];

// Shopping List Page Tour Steps
export const shoppingListPageSteps = [
  {
    content: '🛒 Velkommen til din Indkøbsliste!\n\nHer finder du alle ingredienser du har tilføjet fra opskrifter.\n\nLad os se hvad du kan gøre.'
  },
  {
    target: '[data-tour="shopping-item"]',
    content: '✅ Afkryds købte varer\n\nKlik på checkbox for at markere en ingrediens som købt.\n\nKøbte varer forsvinder fra listen.'
  },
  {
    target: '[data-tour="buy-button"]',
    content: '🏪 Køb online\n\nKlik på "Indkøb hos..." for at købe ingrediensen direkte hos en leverandør.\n\nVi viser automatisk den bedste pris for dit land!'
  },
  {
    content: '💡 Tips til Indkøbsliste\n\n• Tilføj ingredienser ved at åbne en opskrift og klikke "Tilføj til Liste"\n• Ingredienserne grupperes automatisk\n• Køb online og spar tid!\n• Listen huskes så du kan handle når du vil'
  }
];

// Settings Page Tour Steps (Machine setup)
export const settingsPageSteps = [
  {
    content: '⚙️ Velkommen til Indstillinger!\n\nHer kan du tilpasse appen til dine behov.\n\nLad os især se på maskin-indstillingerne.'
  },
  {
    target: '[data-tour="machine-section"]',
    content: '🧊 Dine slush-maskiner\n\nHer kan du tilføje og administrere dine slush-maskiner.\n\nNår du har indstillet din maskine, skaleres opskrifter automatisk til den rigtige størrelse!'
  },
  {
    target: '[data-tour="add-machine-button"]',
    content: '➕ Tilføj maskine\n\nKlik her for at tilføje en ny maskine.\n\nIndtast navn og tank-volumen (f.eks. 12000 ml).\n\nDette gør opskrifter perfekte til din maskine!'
  },
  {
    target: '[data-tour="restart-tours-button"]',
    content: '🔄 Genstart guider\n\nHar du brug for at se guiderne igen?\n\nKlik her for at nulstille alle onboarding-tours og se dem forfra.'
  },
  {
    target: '[data-tour="guide-link"]',
    content: '📖 Fuld vejledning\n\nKlik på dette link for at læse den komplette vejledning til SLUSHBOOK.\n\nHer finder du detaljerede instruktioner, tips og tricks til alle funktioner!'
  },
  {
    content: '💡 Andre indstillinger\n\n• Administrer dine enheder og log ud fra specifikke enheder\n• Vælg dit land for relevante produktlinks\n• Se dine gratis-limits (hvor mange opskrifter du kan oprette)\n• Alle dine indstillinger gemmes automatisk'
  }
];


export { TOUR_KEYS };
