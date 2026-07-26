```markdown
# shadowbroker-turbo Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches you the core development patterns and conventions used in the `shadowbroker-turbo` TypeScript codebase. You'll learn about file naming, import/export styles, commit message patterns, and how to write and organize tests. This guide ensures consistency and maintainability when contributing to the project.

## Coding Conventions

### File Naming
- **Pattern:** camelCase
- **Example:**  
  ```
  shadowBrokerTurbo.ts
  userProfileManager.ts
  ```

### Import Style
- **Pattern:** Relative imports
- **Example:**
  ```typescript
  import { fetchData } from './apiClient';
  import { UserProfile } from '../models/userProfile';
  ```

### Export Style
- **Pattern:** Named exports
- **Example:**
  ```typescript
  // In userProfileManager.ts
  export function createUserProfile() { ... }
  export const USER_PROFILE_DEFAULTS = { ... };
  ```

### Commit Messages
- **Pattern:** Conventional commits
- **Prefix:** `chore`
- **Average length:** ~29 characters
- **Example:**
  ```
  chore: update dependencies
  chore: fix typo in userProfileManager
  ```

## Workflows

### Commit Changes
**Trigger:** When making any change to the codebase  
**Command:** `/commit-changes`

1. Make your code changes following the coding conventions.
2. Stage your changes:  
   ```
   git add .
   ```
3. Write a conventional commit message prefixed with `chore:`  
   ```
   git commit -m "chore: update user profile logic"
   ```
4. Push your changes:  
   ```
   git push
   ```

## Testing Patterns

- **Test File Pattern:** `*.test.*`
- **Framework:** Unknown (ensure to use the same pattern)
- **Example:**
  ```
  userProfileManager.test.ts
  ```
- **Writing Tests:**  
  Place your test files alongside the modules they test, using the `.test.ts` suffix.

  ```typescript
  // userProfileManager.test.ts
  import { createUserProfile } from './userProfileManager';

  describe('createUserProfile', () => {
    it('should create a user profile with defaults', () => {
      const profile = createUserProfile();
      expect(profile).toHaveProperty('id');
    });
  });
  ```

## Commands
| Command           | Purpose                                 |
|-------------------|-----------------------------------------|
| /commit-changes   | Guide for committing code changes       |
```
