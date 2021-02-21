import { fileURLToPath } from "url";
import assert from "assert/strict";
import * as cjs from "cjs-module-lexer";
import * as esm from "es-module-lexer";
import fixturesHelper from "@babel/helper-fixtures";
const { default: loadFixtures } = fixturesHelper;

await Promise.all([cjs.init(), esm.init]);

const fixturesURL = new URL(
	"./babel/packages/babel-plugin-transform-modules-commonjs/test/fixtures",
	import.meta.url
);
const fixtures = loadFixtures(fileURLToPath(fixturesURL));

for (const suite of fixtures) {
	for (const test of suite.tests) {
		compare(test, suite);
	}
}

function compare(fixture, suite) {
	const name = `${suite.title} / ${fixture.title}`;

	try {
		const esmExports = normalize(esm.parse(fixture.actual.code)[1]);
		const cjsExports = normalize(cjs.parse(fixture.expect.code).exports);

		assert.deepEqual(cjsExports, esmExports);

		console.log("OK", name);
	} catch (e) {
		console.log("FAIL", name);
		console.log(e.message.replace(/^(?!$)/gm, "\t"));
	}
}

function normalize(exports) {
	return exports.filter((name) => name !== "__esModule").sort();
}
