# igc-to-fit

![95% Vibe_Coded](https://img.shields.io/badge/95%25-Vibe_Coded-blue?logo=openai&logoColor=white)

Convert IGC paragliding flight logs to Garmin FIT files via a simple Node.js CLI.

This tool parses an `.igc` flight, computes a normalized track using `igc-xc-score`, and encodes a FIT activity with
`@garmin/fitsdk`. It is intended for advanced Node.js users and pilots who want to import IGC tracks into
Garmin-compatible ecosystems.

A primary motivation for this tool is to enable using IGC files in DJI Studio for showing flight data on videos made
with the DJI Osmo 360 camera.

[![Sample Video](https://markdown-videos-api.jorgenkh.no/url?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3D9ioaG6pJlLw)](https://www.youtube.com/watch?v=9ioaG6pJlLw)

## Overview

- Input: IGC (International Gliding Commission) flight log files.
- Processing:
    - Parses IGC with `igc-parser` (lenient by default).
    - Runs `igc-xc-score` solver (rule XContest) and uses result as the normalized track.
    - Preserves timezone (if present in the IGC) and adjusts FIT timestamps accordingly.
    - Optionally analyzes the flight with [utils/igc-analyzer.js](utils/igc-analyzer.js) (computed before encoding; not
      all metrics are currently
      written into FIT).
- Output: FIT activity containing FILE_ID, ACTIVITY, SESSION, LAP, and per-fix RECORD messages.

Notes:

- Timestamps: FIT expects seconds since `1989-12-31T00:00:00Z` (offset `631065600` from Unix epoch). The CLI applies the
  IGC
  timezone offset (in hours; supports fractional offsets) exactly once while encoding.
- Coordinates: Written as FIT semicircles (`degrees × 2^31 / 180`).
- Per-fix fields: `altitude` uses `gpsAltitude`, `speed` uses `hspeed`, `verticalSpeed` uses `vspeed`, and `distance` is
  propagated if
  present.

## Requirements

- Node.js 18+ (native ES modules and stable fetch/URL). Node 20+ recommended.
- npm (project uses npm scripts).
- macOS/Linux/Windows supported (no native binaries required).

## Installation and Setup

- Clone the repository, then install dependencies:

  ```bash
  npm ci
  ```

- Optional: install globally to use the igc-to-fit binary directly:

  ```bash
  npm i -g .
  ```

## Usage

Run with Node directly:

```bash
node index.js -s <src.igc> -d <dst.fit>
```

Examples:

```shell
node index.js -s test/input1.igc -d test/tmp.fit
node index.js -s test/input2.igc -d test/output2.fit
```

If installed globally (`npm i -g .`):

```shell
igc-to-fit -s path/to/track.igc -d out/track.fit
```

Show help:

```shell
npm run run
# or
node index.js -h
```

Behavior specifics:

- Timezone handling: If `igcData.timezone` is present (hours offset, e.g., +2, -3.5), timestamps in the FIT stream are
  adjusted by that offset. The CLI logs the detected timezone.
- Distance: If the IGC contains cumulative distance per fix, it is carried into FIT session/lap and record messages.

## Scripts

Defined in package.json:

- `npm run run` — Show CLI help (node index.js -h)
- `npm run run-test1` — Convert sample 1 (overwrites test/output1.fit)
- `npm run run-test2` — Convert sample 2 (creates test/output2.fit)

## Testing

There is no formal test runner. Validate via the CLI with known inputs:

```shell
# Quick helps and smoke checks
npm run run

# Sample conversions (verify exit code 0 and non-empty outputs)
npm run run-test1
npm run run-test2

# Ad-hoc: convert another file
node index.js -s test/input1.igc -d /tmp/flight.fit
```

## Project Structure

Top-level files and directories:

- `index.js `— CLI entry and conversion pipeline.
- `utils/igc-analyzer.js` — Computes thermals, glides, and related metrics (invoked before encoding).
- `test/` — Sample IGC inputs (input1.igc, input2.igc) and a sample FIT output (output1.fit).

## Dependencies

- [@garmin/fitsdk](https://www.npmjs.com/package/@garmin/fitsdk) — FIT encoder (Encoder, Profile) used to write messages
  and produce the FIT byte array.
- [igc-parser](https://www.npmjs.com/package/igc-parser) — Parses .igc files.
- [igc-xc-score](https://www.npmjs.com/package/igc-xc-score) — Computes optimal task/track.

## Contributing

- Issues and PRs are welcome. Please keep repository hygiene: avoid committing ad-hoc .fit files; only test/output1.fit
  is versioned.
