// Shared semver-tag validation for the deploy/promote/release flows.
// Accepts an optional leading `v` plus an optional `-pre` / `+build` suffix.
export const SEMVER_RE = /^v?\d+\.\d+\.\d+(?:[-+].+)?$/
