# Changelog
## [1.1.0] - 2025-09-14
Inferred release type: MINOR (new features present).

### Added
- Enhance CLI as an installable binary and helpful defaults:
  - Expose `igc-to-fit` via `bin` for global/local CLI use ([875c918](https://github.com/SergejT34/igc-to-fit/commit/875c918)).
  - Show help when no args are provided ([875c918](https://github.com/SergejT34/igc-to-fit/commit/875c918)).
  - Validate `--src` and `--dst` arguments; create destination directory if needed ([875c918](https://github.com/SergejT34/igc-to-fit/commit/875c918)).
- IGC analysis utility to compute thermals/glides and derived metrics (foundation for future FIT enrichment) ([8a3d746](https://github.com/SergejT34/igc-to-fit/commit/8a3d746)).
- Project documentation:
  - README with overview, usage, and contribution notes ([0328f2a](https://github.com/SergejT34/igc-to-fit/commit/0328f2a)).

### Changed
- Improve error handling and user feedback during conversion ([875c918](https://github.com/SergejT34/igc-to-fit/commit/875c918)).
- Update project description in package metadata ([875c918](https://github.com/SergejT34/igc-to-fit/commit/875c918)).

### Chore
- Remove IDE-specific `.gitignore` ([0c73d8c](https://github.com/SergejT34/igc-to-fit/commit/0c73d8c)).

## [1.0.0] - 2025-09-13
Initial public version (inferred from repository history).

### Added
- Initialize project structure with `package.json`, dependencies, and scripts ([20b4023](https://github.com/SergejT34/igc-to-fit/commit/20b4023)).
- Add `.editorconfig` for code style consistency ([20b4023](https://github.com/SergejT34/igc-to-fit/commit/20b4023)).
- Include first sample IGC input `test/input1.igc` ([20b4023](https://github.com/SergejT34/igc-to-fit/commit/20b4023)).

[1.1.0]: https://github.com/SergejT34/igc-to-fit/compare/1.0.0...1.1.0
[1.0.0]: https://github.com/SergejT34/igc-to-fit/releases/tag/1.0.0
