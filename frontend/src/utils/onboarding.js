import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

/**
 * Onboarding Tour Configuration using driver.js
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

// Create driver instance with custom styling
const createDriver = () => {
  return driver({
    showProgress: true,
    progressText: '{{current}} af {{total}}',
    nextBtnText: 'Næste →',
    prevBtnText: '← Forrige',
    doneBtnText: 'Færdig ✓',
    popoverClass: 'driverjs-theme',
    animate: true,
    smoothScroll: true,
    allowClose: true,
    overlayClickNext: false,
    stagePadding: 5,
    stageRadius: 8,
    showButtons: ['next', 'previous'],  // Control which buttons show
    onDestroyed: () => {
      console.log('[Tour] Tour destroyed');
    },
  });
};

// HomePage Tour
export const startHomeTour = (onComplete) => {
  if (isTourCompleted(TOUR_KEYS.HOME)) {
    console.log('[Tour] Home tour already completed');
    return;
  }

  const driverObj = createDriver();
  
  driverObj.setSteps([
    {
      element: '[data-tour="settings-menu"]',
      popover: {
        title: '👤 Brugerindstillinger',
        description: 'Klik her for at åbne menuen med Indstillinger, Favoritter og Log ud. Du kan også genstarte denne guide under Indstillinger senere.',
        side: 'bottom',
        align: 'start',
        showButtons: ['close']  // Only show close button for single-step tour
      }
    }
  ]);

  driverObj.drive();

  // Mark as completed when tour is done
  const originalDestroy = driverObj.destroy.bind(driverObj);
  driverObj.destroy = () => {
    markTourCompleted(TOUR_KEYS.HOME);
    if (onComplete) onComplete();
    originalDestroy();
  };

  return driverObj;
};

// Recipes Page Tour
export const startRecipesTour = (onComplete) => {
  if (isTourCompleted(TOUR_KEYS.RECIPES)) {
    console.log('[Tour] Recipes tour already completed');
    return;
  }

  const driverObj = createDriver();
  
  driverObj.setSteps([
    {
      element: '[data-tour="search-bar"]',
      popover: {
        title: '🔍 Søg efter opskrifter',
        description: 'Brug søgefeltet til hurtigt at finde den opskrift du leder efter.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '[data-tour="type-filter"]',
      popover: {
        title: '🎨 Filtrer efter type',
        description: 'Vælg mellem forskellige typer som Klassisk, Tropisk, Cremet osv. for at finde præcis hvad du har lyst til.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '[data-tour="add-recipe-card"]',
      popover: {
        title: '➕ Opret din egen opskrift',
        description: 'Klik her for at oprette og dele dine egne slushice opskrifter med andre brugere!',
        side: 'top',
        align: 'start'
      }
    }
  ]);

  driverObj.drive();

  const originalDestroy = driverObj.destroy.bind(driverObj);
  driverObj.destroy = () => {
    markTourCompleted(TOUR_KEYS.RECIPES);
    if (onComplete) onComplete();
    originalDestroy();
  };

  return driverObj;
};

// Add Recipe Page Tour
export const startAddRecipeTour = (onComplete) => {
  if (isTourCompleted(TOUR_KEYS.ADD_RECIPE)) {
    console.log('[Tour] Add recipe tour already completed');
    return;
  }

  const driverObj = createDriver();
  
  driverObj.setSteps([
    {
      element: '[data-tour="recipe-name"]',
      popover: {
        title: '📝 Opskriftens navn',
        description: 'Start med at give din opskrift et catchy navn!',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '[data-tour="recipe-type"]',
      popover: {
        title: '🎨 Type og farve',
        description: 'Vælg hvilken type opskrift det er, og hvilken farve din slushice har.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '[data-tour="recipe-ingredients"]',
      popover: {
        title: '🥤 Tilføj ingredienser',
        description: 'Her tilføjer du alle ingredienserne til din opskrift. Søg efter eksisterende ingredienser eller opret nye.',
        side: 'top',
        align: 'start'
      }
    },
    {
      element: '[data-tour="recipe-public-toggle"]',
      popover: {
        title: '🌍 VIGTIGT: Gør din opskrift offentlig',
        description: 'Aktivér dette for at dele din opskrift med andre! Den skal godkendes af admin, før den bliver synlig for alle.',
        side: 'top',
        align: 'start'
      }
    },
    {
      element: '[data-tour="recipe-submit"]',
      popover: {
        title: '✅ Gem opskriften',
        description: 'Når du er tilfreds med din opskrift, klik her for at gemme den.',
        side: 'top',
        align: 'start'
      }
    }
  ]);

  driverObj.drive();

  const originalDestroy = driverObj.destroy.bind(driverObj);
  driverObj.destroy = () => {
    markTourCompleted(TOUR_KEYS.ADD_RECIPE);
    if (onComplete) onComplete();
    originalDestroy();
  };

  return driverObj;
};

export { TOUR_KEYS };
