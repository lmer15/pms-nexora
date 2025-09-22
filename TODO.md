# Task: Fix UI for Editing Task Details

## Steps to Complete

1. **Add getFacilityMembers to facilityService.ts**
   - Add method to fetch facility members from API

2. **Update TaskDetailCoreDetails.tsx**
   - Add facilityId prop
   - Fetch facility members when editing assignee
   - Replace assignee select with dynamic list and plus button for no assignee
   - Replace due date input with react-datepicker
   - Fix input styling to remove black borders and add proper focus states
   - Improve priority select dropdown styling

3. **Update TaskDetailModal.tsx**
   - Pass facilityId prop to TaskDetailCoreDetails component

4. **Test all editing functionalities**
   - Verify assignee selection works
   - Verify date picker works
   - Verify priority dropdown works
   - Verify description editing works
   - Verify input styling is correct

## Current Status
- [x] Installed react-datepicker
- [x] Added getFacilityMembers to facilityService.ts
- [x] Updated TaskDetailCoreDetails.tsx
- [ ] Updated TaskDetailModal.tsx
- [ ] Tested functionalities
