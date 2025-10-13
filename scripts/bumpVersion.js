const path = require("path");
const fs = require("fs");
const semver = require("semver");

// Get bump type from CLI argument, e.g. "major", "minor", or "patch"; default is "patch"
const bumpType = process.argv[2] || "patch";

// 1) Path to version.json
const versionJsonPath = path.join(__dirname, "../version.json");
// 2) Path to package.json
const packageJsonPath = path.join(__dirname, "../package.json");

// 3) Read version.json
const versionData = JSON.parse(fs.readFileSync(versionJsonPath, "utf8"));

// 4) Bump the semver version
const oldVersion = versionData.version || "1.0.0";
const newVersion = semver.inc(oldVersion, bumpType);

// 5) Update the in-memory object
versionData.version = newVersion;

// 6) Write back to version.json
fs.writeFileSync(versionJsonPath, JSON.stringify(versionData, null, 2), "utf8");

// 7) Update package.json version
const packageData = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
const oldPkgVersion = packageData.version || "1.0.0";
packageData.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageData, null, 2), "utf8");

// 8) Console log results
console.log("");
console.log(`✅ Bumped version from ${oldVersion} to ${newVersion}`);
console.log(`✅ Updated package.json version from ${oldPkgVersion} to ${newVersion}`);
console.log("");
