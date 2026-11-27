import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";
import { resolveGlobalNpmPiPackageRoot } from "../../src/runs/shared/pi-spawn.ts";

describe("resolveGlobalNpmPiPackageRoot", () => {
	let tmp: string;
	let npmPrefix: string;

	beforeEach(() => {
		tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pi-global-npm-"));
		npmPrefix = path.join(tmp, "lib", "node_modules");
		fs.mkdirSync(npmPrefix, { recursive: true });
	});

	afterEach(() => {
		fs.rmSync(tmp, { recursive: true, force: true });
	});

	const npmRootProbe = (root: string) => () => `${root}\n`;

	it("resolves the package inside the global npm root", () => {
		const pkg = path.join(npmPrefix, "@earendil-works", "pi-coding-agent");
		fs.mkdirSync(pkg, { recursive: true });
		fs.writeFileSync(path.join(pkg, "package.json"), JSON.stringify({ name: "@earendil-works/pi-coding-agent" }));
		assert.equal(
			resolveGlobalNpmPiPackageRoot({ execFileSync: npmRootProbe(npmPrefix) as never }),
			fs.realpathSync(pkg),
		);
	});

	it("returns undefined when the global install has no pi package", () => {
		assert.equal(
			resolveGlobalNpmPiPackageRoot({ execFileSync: npmRootProbe(npmPrefix) as never }),
			undefined,
		);
	});

	it("returns undefined when npm itself is unavailable", () => {
		assert.equal(
			resolveGlobalNpmPiPackageRoot({
				execFileSync: (() => {
					throw new Error("ENOENT");
				}) as never,
			}),
			undefined,
		);
	});

	it("rejects a package directory whose manifest names another package", () => {
		const pkg = path.join(npmPrefix, "@earendil-works", "pi-coding-agent");
		fs.mkdirSync(pkg, { recursive: true });
		fs.writeFileSync(path.join(pkg, "package.json"), JSON.stringify({ name: "some-impostor" }));
		assert.equal(
			resolveGlobalNpmPiPackageRoot({ execFileSync: npmRootProbe(npmPrefix) as never }),
			undefined,
		);
	});
});
