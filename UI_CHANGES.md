# UI Changes Log - October 2025

## Pro Upgrade Modal Updates
**Date:** 2025-10-19

### Changes:
- Removed email signup functionality
- Replaced with direct "Køb Pro-adgang" call-to-action button
- Updated feature list to focus on benefits:
  - ✔ Ubegrænset adgang til alle opskrifter
  - ✔ Opret og udgiv dine egne opskrifter
  - ✔ Prioriteret support
  - ✔ Eksklusive Pro-funktioner
- Button opens upgrade page: `https://slushbook.dk/upgrade`
- Removed references to specific recipe counts (e.g., "78+ opskrifter")

**Files modified:**
- `/app/frontend/src/components/UpgradeModal.js`

---

## Login Page Redesign
**Date:** 2025-10-19

### Changes:
- **Video Background:** Added looping video background (`/assets/slush-loop.mp4`)
  - Autoplay, loop, muted for optimal UX
  - Fixed positioning behind login form
  - Full viewport coverage with `object-cover`

- **New Logo:** Updated to simplified smile logo (`/assets/slushbook.png`)
  - Reduced size by ~50% for better mobile fit
  - Width: 160px (40 Tailwind units)

- **Semi-Transparent Login Box:**
  - Background: `rgba(255, 255, 255, 0.8)`
  - Backdrop blur effect: `blur(10px)`
  - Improved readability over video

- **Mobile Optimization:**
  - Tested on 375px width (iPhone SE / 13 mini)
  - All elements visible without scrolling
  - Reduced padding: `p-6` on mobile, `sm:p-8` on larger screens
  - Smaller logo margin: `mb-6` instead of `mb-8`

- **Layout:**
  - Vertically centered using flexbox
  - Consistent design across Login, Signup, and Forgot Password pages

**Files modified:**
- `/app/frontend/src/pages/LoginPage.js`
- `/app/frontend/src/pages/SignupPage.js`
- `/app/frontend/src/pages/ForgotPasswordPage.js`

**New Assets:**
- `/app/frontend/public/assets/slushbook.png` (logo - placeholder)
- `/app/frontend/public/assets/slush-loop.mp4` (video background)

**Note:** Asset files are placeholders - replace with final branded assets before production.

---

## Testing
- ✅ Desktop view (1920x1080): Confirmed video background and centered layout
- ✅ Mobile view (375x667): Confirmed no scrolling needed, all elements visible
- ✅ Login functionality: Preserved (email/password, Google OAuth placeholder, guest mode)
- ✅ Signup flow: Consistent design with video background
- ✅ Password reset: Consistent design with video background

---

## Redirect Service Fix
**Date:** 2025-10-19

### Issue:
Redirect service was not running persistently, causing shopping list and supplier links to fail.

### Solution:
- Created supervisor configuration: `/etc/supervisor/conf.d/redirect-service.conf`
- Service now runs automatically and restarts on failure
- Status: `supervisorctl status redirect-service` → RUNNING

**Files modified:**
- Added `/etc/supervisor/conf.d/redirect-service.conf`

---

## Supplier Links Visibility
**Date:** 2025-10-19

### Change:
Supplier "🛒 Køb her" links now visible to ALL users (previously guest-only).

**Reasoning:** Better for affiliate revenue - Pro users can also click and purchase.

**Files modified:**
- `/app/frontend/src/pages/RecipeDetailPage.js` (line 574)
- Changed from `{!user && mappingId && (` to `{mappingId && (`

---

## Technical Stack Reference

### Frontend:
- **Framework:** React 18.x
- **Routing:** React Router v6
- **Styling:** Tailwind CSS + Shadcn UI components
- **Icons:** React Icons (Font Awesome)
- **HTTP:** Axios
- **Notifications:** Sonner (toast)

### Backend:
- **Framework:** FastAPI (Python)
- **Database:** MongoDB (Motor driver)
- **Auth:** JWT sessions with httpOnly cookies

### Microservice:
- **Redirect Service:** Node.js + Express + TypeScript
- **Database:** SQLite
- **Purpose:** Affiliate link management and redirects

---

## Design Guidelines

When requesting design changes, use Tailwind utility classes:

**Colors:**
```jsx
bg-blue-500        // Background
text-white         // Text color
border-gray-200    // Border
hover:bg-blue-600  // Hover state
```

**Layout:**
```jsx
flex items-center gap-4     // Flexbox
grid grid-cols-3 gap-2      // Grid
p-4 m-2                     // Padding/margin
px-6 py-3                   // Specific sides
```

**Responsive:**
```jsx
hidden md:block             // Hidden on mobile, show on desktop
text-sm md:text-lg          // Responsive text size
w-full sm:w-auto            // Responsive width
```

**Semi-transparent elements:**
```jsx
style={{backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)'}}
```

---

## Notes
- Video backgrounds should always be optimized (<5MB)
- Test on mobile (375px) and desktop (1920px)
- Maintain semi-transparent overlays for readability
- Keep consistent spacing: `mb-6` for sections, `p-6 sm:p-8` for cards
