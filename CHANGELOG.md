
# Changelog

## [UNRELEASED]

### Added
- Feature: Allow registering component schemas/entities for OpenAPI schemas with `addEntity`/`addEntities`.
- Feature: Allow inline definition of component schemas/entities in route schemas

## [0.1.3] - 2026-01-18

OpenAPI schema fixes

### Changed
- Made schema request body expressed as z.null() behave as if undefined

### Fixed
- Fixed path-parameter syntax in emitted openapi.json

## [0.1.2] - Better type-inference - 2025-11-19

### Added
- Test suites for type inference

### Changed
- Better type-inference for koa context

### Fixed
- Properly handle parameter enums and arrays

## [0.1.1] - Type-safe Koa context - 2025-11-18

### Added
- Infer types from declared route schemas
- Parameterize route handling middleware

## [0.1.0] - Initial Release - 2025-11-12

### Added
- Basic Router abstraction
- Schema declaration in router methods
- `openapi.json` generation
