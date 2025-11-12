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

// Reset individual tour
export const resetTour = (tourKey) => {
  localStorage.removeItem(tourKey);
};

// HomePage Tour Steps - Function to include user's first name
export const getHomePageSteps = (userName) => {
  // Extract first name from full name
  const firstName = userName ? userName.split(' ')[0] : '';
  const greeting = firstName ? `🎉 Velkommen til Slush Book, ${firstName}!` : '🎉 Velkommen til Slush Book!';
  
  return [
    {
      // Step 1: Welcome message (no target to highlight)
      content: `${greeting}\n\nHer kan du udforske opskrifter, finde inspiration og tilføje dine egne slushice-kreationer.\n\nFør vi går i gang, får du et par hurtige tips til, hvordan du bruger appen bedst.\n\nTryk Næste for at se, hvor du finder indstillinger og dine favoritter.`
    },
    {
      // Step 2: Point to settings menu
      target: '[data-tour="settings-menu"]',
      content: '👤 Her finder du profil-ikonet (eller tandhjulet på mobil).\n\nHer kan du åbne menuen med Indstillinger, Favoritter og Log ud.\n\nDu kan også genstarte denne guide under Indstillinger senere.'
    }
  ];
};

// Keep the old export for backwards compatibility (without name)
export const homePageSteps = getHomePageSteps();

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
