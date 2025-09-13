Project: igc-to-fit — Developer Guidelines

Audience: Advanced Node.js developers working on the IGC-to-FIT conversion CLI.

1) Build and Configuration
- Runtime: Node.js 18+ (required for native ES modules and fetch/URL stability). Node 20+ is recommended.
- Package manager: npm. First-time setup: npm ci
- Module system: ES Modules. index.js uses import syntax. You will see a MODULE_TYPELESS_PACKAGE_JSON warning when running node unless package.json includes "type": "module".
  - If you intend to evolve the codebase, consider adding "type": "module" to package.json to avoid runtime warnings and improve startup perf. Current CLI works without it.
- Entry point / binary: index.js exposed via the bin field as igc-to-fit. You can install this repo globally with npm i -g . and invoke igc-to-fit directly.
- Build: No compile step required. package.json currently defines "build": "npx tsc" but there is no TS config or sources; this is a no-op and not required. Keep JS only unless you plan a TS migration.
- Dependencies of note:
  - @garmin/fitsdk: FIT encoder (Encoder, Profile). We only use the encoder and write bytes directly.
  - igc-parser: Parses .igc, returns { fixes, date, timezone, ... }.
  - igc-xc-score: Used to process the flight and compute the optimal task/track; we pull result.opt.flight to feed the encoder and preserve timezone.
  - commander, figlet: CLI and banner only.

2) Running and Testing
A. Quick run
- Show help: npm run run
- Convert sample 1 (overwrites test/output1.fit): npm run run-test1
- Convert sample 2 (creates test/output2.fit): npm run run-test2

CLI usage
- node index.js -s <src.igc> -d <dst.fit>
- Examples:
  - node index.js -s test/input1.igc -d test/tmp.fit
  - igc-to-fit -s path/to/track.igc -d out/track.fit

Behavior specifics
- Timezone handling: If igcData.timezone is present (hours offset, e.g., +2, -3.5), timestamps in the FIT stream are adjusted by that offset. The CLI logs the detected timezone.
- FIT timestamps: The encoder expects seconds since 1989-12-31T00:00:00Z (offset 631065600 from Unix epoch). See toFitTimestamp() in index.js.
- Coordinates: positionLat/positionLong are written in FIT semicircles (degrees × 2^31 / 180).
- Per-fix fields: altitude uses gpsAltitude, speed uses hspeed, verticalSpeed uses vspeed, and distance is propagated if present.

B. How to run tests locally
- There is no formal test runner in this repo. Use the CLI with known inputs and verify outputs.
- Sanity checks you can script:
  1) Exit code is 0.
  2) Destination .fit file exists and is non-empty.
  3) (Optional) Use @garmin/fitsdk Decoder externally to validate the FIT file structure if you add that dependency for dev-only verification.

C. Adding a new test case
- Put your .igc file under test/ (e.g., test/myflight.igc).
- Run the CLI: node index.js -s test/myflight.igc -d test/myflight.fit
- Verify:
  - The tool logs a timezone message if the IGC contains one, otherwise it logs that UTC is used.
  - The resulting FIT is present and > 0 bytes: ls -l test/myflight.fit
- Clean up any .fit outputs you do not want to commit, especially if they are not intended to be versioned.

D. Minimal reproducible test (verified)
The following sequence was executed successfully during guideline preparation:
- npm run run-test1  → produced/overwrote test/output1.fit
- npm run run-test2  → produced test/output2.fit (then removed to keep the repo clean)
Both runs logged timezone detection and completed without errors.

3) Code Structure and Development Notes
- index.js: CLI entry and conversion pipeline.
  - Parses args with commander; requires both --src and --dst.
  - Uses igc-parser to read IGC; passes data to igc-xc-score solver (rule XContest) and takes result.opt.flight as the normalized flight payload.
  - Preserves igcData.timezone by copying it onto result.opt.flight before encoding.
  - convertIgcToFit(): encapsulates FIT encoding; writes FILE_ID, ACTIVITY, SESSION, LAP, then RECORD per fix.
- utils/igc-analyzer.js: A large analysis utility (compute()) that calculates thermals, glides, etc. The CLI constructs IGCAnalyzer and invokes compute(igcData.fixes) before encoding. If you want to enrich FIT with derived metrics, this is where to extract them.
- test/: Contains two sample IGC inputs and a sample FIT output (output1.fit). Only output1.fit is versioned at the moment; avoid committing ad-hoc FIT outputs.

Notes, pitfalls, and extension points
- ES Modules warning: You may see "MODULE_TYPELESS_PACKAGE_JSON" warnings. Adding "type": "module" to package.json will remove this. Do this only if you confirm all tooling (including any downstream scripts) expect ESM.
- Missing formal tests: If you add a test runner, prefer a lightweight approach (e.g., a Node script under scripts/ that runs known conversions and validates existence/size, optionally decoding with fitsdk if added as a devDependency).
- FIT message choices: We currently write a single SESSION and LAP covering the entire file. If you plan laps or pauses, you will need to segment by timestamps and adjust totalTimerTime appropriately.
- Units and fields: Ensure any added fields are in FIT’s expected units and formats (e.g., speed m/s, altitude meters). The encoder does not auto-convert.
- Time arithmetic: Keep toFitTimestamp consistent; apply timezone offset exactly once.
- Performance: Encoding iterates over every fix; for large flights ensure you stream/process if memory becomes a concern. Current approach is fine for typical IGC sizes.
- Determinism: Input parsing with { lenient: true } tolerates some IGC quirks; if you need stricter behavior, document and gate via a flag.

4) Suggested Developer Workflows
- Local conversion: node index.js -s test/input1.igc -d /tmp/flight.fit
- Add a throwaway test: cp test/input1.igc test/tmp.igc && node index.js -s test/tmp.igc -d test/tmp.fit && rm test/tmp.igc test/tmp.fit
- Validate encoder upgrade: bump @garmin/fitsdk, run both sample conversions, and (optionally) validate with a FIT decoder.

5) Repository Hygiene
- Only commit intentional .fit artifacts (currently test/output1.fit is tracked). Delete any temporary .fit results after manual tests.
- Keep .editorconfig style settings; code currently uses 4 spaces indentation in JS files inside utils/.

6) Troubleshooting
- Error: Source file does not exist → check paths, ensure --src is correct.
- IGC parse issues → try removing { lenient: true } to locate the offending records, then decide if leniency is desired.
- Empty/zero-length FIT → check that igcData.fixes is non-empty and that encoder.close() result is written unaltered.
- Incorrect timestamps in FIT → verify timezone in IGC; remember the offset is hours (can be fractional). Ensure conversion is applied once via toFitTimestamp().
