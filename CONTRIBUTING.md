# Contributing Guidelines

## Rendering personalized greetings

All greeting and daily-message strings must be generated on the server and passed to client components as fully formatted values. Client-side components must never concatenate prefixes such as "Bom dia" or append the mother’s name.

A lint guard (`no-restricted-syntax`) enforces this rule for files under `components/`. If ESLint reports a violation referencing greeting prefixes, move the formatting logic to a server module and pass the final string down via props.
