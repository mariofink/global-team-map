# JSDoc Setup Guide

## What's Configured

Your project now has JSDoc with TypeScript checking enabled via `jsconfig.json`. This gives you:

✅ **Type checking** in VS Code  
✅ **IntelliSense** autocomplete  
✅ **Type hints** on hover  
✅ **Error detection** before runtime

## Configuration

The `jsconfig.json` file enables:

- `checkJs: true` - Type checking for all `.js` files
- `strictFunctionTypes: true` - Strict function type checking
- `noImplicitThis: true` - Errors on `this` with implicit `any` type
- ES2020 + DOM support
- Relaxed settings for easier adoption (`strict: false`, no unused warnings)

## JSDoc Syntax Examples

### Basic Types

```javascript
/** @type {string} */
let name = "John";

/** @type {number} */
let age = 25;

/** @type {boolean} */
let isActive = true;

/** @type {string[]} */
let tags = ["developer", "designer"];
```

### Function Parameters & Returns

```javascript
/**
 * Calculate sum of two numbers
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} Sum of a and b
 */
function add(a, b) {
  return a + b;
}

/**
 * Async function example
 * @param {string} url - API endpoint
 * @returns {Promise<Object>} Response data
 */
async function fetchData(url) {
  const res = await fetch(url);
  return res.json();
}
```

### Object Types (typedef)

```javascript
/**
 * @typedef {Object} User
 * @property {string} id - Unique identifier
 * @property {string} name - User's name
 * @property {number} age - User's age
 * @property {string} [email] - Optional email (note the brackets)
 */

/**
 * Create a new user
 * @param {User} userData - User information
 * @returns {User}
 */
function createUser(userData) {
  return { ...userData };
}
```

### Arrays & Complex Types

```javascript
/** @type {Array<string>} */
let names = ["Alice", "Bob"];

/** @type {User[]} */
let users = [];

/** @type {Object.<string, number>} */
let scores = { alice: 100, bob: 85 }; // Dictionary/map type
```

### Optional & Nullable

```javascript
/**
 * @param {string} name - Required
 * @param {number} [age] - Optional (can be undefined)
 * @param {string|null} email - Can be string or null
 */
function register(name, age, email) {}
```

### Union Types

```javascript
/**
 * @param {string|number} id - Can be either type
 * @returns {boolean}
 */
function deleteItem(id) {
  return true;
}

/** @type {('success'|'error'|'pending')} */
let status = "success";
```

### Class Properties

```javascript
class TodoList {
  constructor() {
    /** @type {string[]} */
    this.items = [];

    /** @type {number} */
    this.maxItems = 100;
  }

  /**
   * Add a todo item
   * @param {string} item
   * @returns {void}
   */
  add(item) {
    this.items.push(item);
  }
}
```

### Callbacks

```javascript
/**
 * @callback OnSuccess
 * @param {Object} data
 * @returns {void}
 */

/**
 * Fetch user data
 * @param {string} userId
 * @param {OnSuccess} onSuccess - Success callback
 */
function getUser(userId, onSuccess) {
  // ...
}
```

### Importing Types from Other Files

```javascript
/** @typedef {import('./TeamMemberManager.js').TeamMember} TeamMember */

/**
 * @param {TeamMember} member
 */
function processMember(member) {
  console.log(member.name);
}
```

### Generic Types

```javascript
/**
 * @template T
 * @param {T[]} array
 * @param {(item: T) => boolean} predicate
 * @returns {T|undefined}
 */
function find(array, predicate) {
  return array.find(predicate);
}
```

## Real Examples in Your Project

Check these files for working examples:

- `src/TeamMemberManager.js` - Class with typedef, property types, and method annotations
- `src/helpers.js` - Function parameter and return types with async functions
- `src/stores/teamStore.js` - Complex return type with function documentation
- `src/components/locationSearch.js` - typedef for objects and event handling
- `src/concerns/` - Module exports with typed functions

## VS Code Features

With JSDoc enabled, you get:

1. **Hover Info** - Hover over any function/variable to see types
2. **Go to Definition** - Ctrl+Click on any symbol
3. **IntelliSense** - Autocomplete with type info
4. **Error Squiggles** - Red underlines for type errors
5. **Refactoring** - Better rename/extract support

## Tips

- Start by adding types to function parameters and returns
- Use `@typedef` for complex objects you reuse
- The `@type` comment goes right before a variable/property
- Use `/** */` (double star) for JSDoc, not `/* */`
- You can ignore errors with `// @ts-ignore` on the line before

## Gradually Adopt

You don't need to annotate everything at once:

1. Start with public API functions
2. Add types when you get confusing bugs
3. Type new code as you write it
4. Slowly fill in existing code

## More Resources

- [JSDoc Official](https://jsdoc.app/)
- [TypeScript JSDoc Reference](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)
- [VS Code JSDoc Guide](https://code.visualstudio.com/docs/languages/javascript#_jsdoc-support)
