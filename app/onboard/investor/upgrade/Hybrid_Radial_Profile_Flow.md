# 🌸 Hybrid Radial Profile Selection Flow — Implementation Summary

## 🎯 Goal
Allow users to select a Contributor Profile (e.g. Creative Producer, Proprietor) via the animated radial layout.  
Clicking a petal opens a modal with deeper profile insight and a CTA that leads to a dedicated upgrade route.

---

## 🧬 Architecture Overview

### 1. Component: `ProfilesRadial.tsx`
- Radial cards with `onClick={() => selectProfile(profileSlug)}`
- Each card represents one Contributor Profile with a unique slug (e.g., `"investor"`, `"producer"`)

### 2. Zustand Store or useState Hook
```ts
const useProfileStore = create((set) => ({
  selectedProfile: null,
  setSelectedProfile: (profile) => set({ selectedProfile: profile }),
}));
```
Used to store:
- Current selected profile
- Profile metadata (name, description, etc.)

### 3. Component: `ProfileModal.tsx`
- Shows modal UI centered in viewport
- Includes:
  - Profile name and poetic description
  - Optional imagery or glyphs
  - CTA: **“Proceed as [ProfileName]”**

### 4. Routing CTA Behavior
- Button inside modal triggers `router.push(\`/upgrade/${profileSlug}\`)`
- This navigates to a dedicated page for that profile (see below)

---

## 🗂️ Directory + File Structure
```bash
app/
├── upgrade/
│   ├── investor/
│   │   └── page.tsx
│   ├── producer/
│   │   └── page.tsx
│   └── ...
├── components/
│   ├── ProfilesRadial.tsx
│   ├── ProfileModal.tsx
│   └── ...
├── lib/
│   └── store/profileStore.ts (if Zustand)
```

---

## 🌀 User Flow Summary
1. User lands on `/onboard/investor/dashboard`
2. Sees radial bloom of Contributor Profiles
3. Clicks a profile petal
4. `ProfileModal` opens with animated entrance
5. User reads and confirms role choice
6. Clicks CTA → routed to `/upgrade/creative-producer` (or similar)

---

## 💡 Future Enhancements
- Animate petal zoom when clicked
- Allow hover previews
- Preload route data behind modal
- Use `localStorage` or cookies to persist last selected role
