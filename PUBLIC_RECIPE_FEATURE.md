# Public/Private Recipe Publishing Feature

**Date:** 2025-10-19

## Overview
Users can now publish their recipes publicly or keep them private.

## Features

### Backend (`/app/backend/server.py`)
1. **Recipe Model** - Added `is_published` field (boolean, default: False)
2. **RecipeCreate Model** - Added `is_published` field for create/update operations
3. **GET /recipes Endpoint** - Smart filtering:
   - **Guests**: Only see `is_published = true` recipes
   - **Logged in users**: See `is_published = true` + their own private recipes
   - **System recipes**: Always visible (author = "system")
4. **POST /recipes & PUT /recipes** - Accept `is_published` field

### Frontend
1. **AddRecipePage.js** - Publish toggle switch before submit button
2. **EditRecipePage.js** - Publish toggle for existing recipes
3. **RecipeCard.js** - Visual indicator: "🌍 Offentlig" badge for published user recipes

## UI Elements

### Toggle Switch Design:
```
OFF (Private):  🔒 Privat opskrift
                Kun du kan se denne opskrift
                [Gray toggle switch]

ON (Public):    🌍 Offentlig opskrift  
                Denne opskrift er synlig for alle brugere
                [Green toggle switch]
```

### Recipe Card Badge:
- Published user recipes show: **"🌍 Offentlig"** (green badge)
- System recipes don't show the badge (always public)
- Private recipes have no badge

## User Flow

### Creating New Recipe:
1. User fills in recipe details
2. Scrolls to bottom
3. Sees toggle (default: OFF/Private)
4. Toggles ON if they want to publish publicly
5. Clicks "Opret Opskrift"

### Editing Existing Recipe:
1. User opens recipe in edit mode
2. Toggle shows current state
3. Can toggle ON/OFF to publish or unpublish
4. Clicks "Gem Ændringer"

### Viewing Recipes:
- **Guest users**: Only see published recipes (system + user published)
- **Logged in users**: See published recipes + their own private ones
- Published recipes show "🌍 Offentlig" badge

## Testing Scenarios

### Test 1: Create Private Recipe (Default)
```
1. Login as user
2. Create recipe (leave toggle OFF)
3. Recipe only visible in your list
4. Logout / use guest account → recipe NOT visible
```

### Test 2: Publish Recipe
```
1. Login as user
2. Create recipe, toggle ON (public)
3. Recipe has "🌍 Offentlig" badge
4. Logout / use guest account → recipe IS visible
```

### Test 3: Unpublish Recipe
```
1. Login as user
2. Edit published recipe
3. Toggle OFF (private)
4. Save changes
5. Logout / use guest account → recipe NOT visible anymore
```

### Test 4: Guest Visibility
```
1. As guest, browse recipes
2. Only see:
   - System recipes (all)
   - User published recipes (is_published = true)
3. Should NOT see any private user recipes
```

## Database Schema

### Recipe Document:
```javascript
{
  id: "uuid",
  name: "Recipe Name",
  description: "...",
  author: "user_id or 'system'",
  is_published: true/false,  // NEW FIELD
  // ... other fields
}
```

## API Examples

### Create Private Recipe:
```javascript
POST /api/recipes
{
  "name": "My Secret Recipe",
  "description": "...",
  "is_published": false,  // Private
  // ... other fields
}
```

### Publish Recipe:
```javascript
PUT /api/recipes/{recipe_id}
{
  "name": "My Public Recipe",
  "description": "...",
  "is_published": true,  // Public
  // ... other fields
}
```

## Files Modified

### Backend:
- `/app/backend/server.py`
  - Line 72: Added `is_published: bool = False` to Recipe model
  - Line 87: Added `is_published: bool = False` to RecipeCreate model
  - Lines 1205-1274: Updated GET /recipes with smart filtering

### Frontend:
- `/app/frontend/src/pages/AddRecipePage.js`
  - Added `is_published: false` to initial state
  - Added publish toggle UI before submit buttons
  
- `/app/frontend/src/pages/EditRecipePage.js`
  - Added publish toggle UI before submit buttons
  
- `/app/frontend/src/components/RecipeCard.js`
  - Added "🌍 Offentlig" badge for published user recipes

## Notes
- Default is always **private** (`is_published = false`)
- System recipes (author = "system") are always visible to all
- Admins can see all recipes regardless of publish status
- Toggle switch uses green/gray colors for clear visual feedback
- Badge only shows on user-created published recipes, not system recipes

## Future Enhancements
- Analytics: Track views on published recipes
- Sharing: Direct share links for published recipes
- Featured: Highlight popular published recipes
- Moderation: Report inappropriate published recipes
