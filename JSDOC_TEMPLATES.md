# JSDoc Templates for AIDE Project

This file provides templates for JSDoc comments to be used across the AIDE project. Following these templates ensures consistent documentation across the codebase.

## Function Documentation

```typescript
/**
 * Brief description of what the function does
 *
 * @param {ParamType} paramName - Description of the parameter
 * @returns {ReturnType} Description of the return value
 * @throws {ErrorType} Description of when this error is thrown
 * @example
 * // Example usage
 * const result = functionName('param');
 */
```

## Class Documentation

```typescript
/**
 * Brief description of the class and its purpose
 *
 * @example
 * // Example instantiation and usage
 * const instance = new ClassName(param);
 * instance.methodName();
 */
```

## Interface Documentation

```typescript
/**
 * Brief description of what the interface represents
 *
 * @interface
 */
```

## Property Documentation

```typescript
/**
 * Description of the property
 * @type {PropertyType}
 */
```

## Method Documentation

```typescript
/**
 * Brief description of what the method does
 *
 * @param {ParamType} paramName - Description of the parameter
 * @returns {ReturnType} Description of the return value
 * @throws {ErrorType} Description of when this error is thrown
 * @example
 * // Example usage
 * instance.methodName('param');
 */
```

## Type Documentation

```typescript
/**
 * Brief description of what this type represents
 *
 * @typedef {BaseType} TypeName
 */
```

## Enum Documentation

```typescript
/**
 * Brief description of what this enum represents
 *
 * @enum {EnumType}
 */
```

## React Component Documentation

```typescript
/**
 * Brief description of the component's purpose and functionality
 *
 * @component
 * @example
 * // Basic usage
 * <ComponentName prop="value" />
 */
interface ComponentNameProps {
  /** Description of this prop */
  propName: PropType;
  /** Description of this optional prop */
  optionalProp?: OptionalPropType;
}
```

## Custom Hook Documentation

```typescript
/**
 * Brief description of what the hook does and when to use it
 *
 * @param {ParamType} paramName - Description of the parameter
 * @returns {ReturnType} Description of the return value
 * @example
 * // Example usage
 * const result = useHookName('param');
 */
```

## Event Handler Documentation

```typescript
/**
 * Handler for the specific event
 *
 * @param {EventType} event - The event object
 */
```

## Async Function Documentation

```typescript
/**
 * Brief description of what the async function does
 *
 * @param {ParamType} paramName - Description of the parameter
 * @returns {Promise<ReturnType>} Description of the resolved value
 * @throws {ErrorType} Description of when this error is thrown
 * @async
 * @example
 * // Example usage
 * const result = await asyncFunctionName('param');
 */
```

## Generic Function Documentation

```typescript
/**
 * Brief description of what the function does
 *
 * @template T - Description of the type parameter
 * @param {T} paramName - Description of the parameter
 * @returns {T} Description of the return value
 * @example
 * // Example usage
 * const result = genericFunction<string>('param');
 */
```

## Usage Guidelines

1. All exported functions, classes, interfaces, and types must have JSDoc comments.
2. Internal functions with complex logic should have JSDoc comments.
3. Include examples for public APIs.
4. Document all parameters, return values, and thrown exceptions.
5. Use markdown in JSDoc comments for better readability.

Following these templates will help maintain consistent documentation throughout the AIDE project.
