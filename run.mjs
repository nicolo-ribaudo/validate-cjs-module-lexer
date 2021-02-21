import { fileURLToPath } from "url";
import assert from "assert/strict";
import * as cjs from "cjs-module-lexer";
import { parse } from "@babel/parser";
import t from "@babel/types";
import fixturesHelper from "@babel/helper-fixtures";
const { default: loadFixtures } = fixturesHelper;

await cjs.init();

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
		const cjsResult = cjs.parse(fixture.expect.code);
		const actual = {
			exports: normalize(cjsResult.exports),
			reexports: normalize(cjsResult.reexports),
		};
		const expected = babelAnalyze(fixture.actual.code);

		assert.deepEqual(actual, expected);

		console.log("OK", name);
	} catch (e) {
		console.log("FAIL", name);
		console.log(e.message.replace(/^(?!$)/gm, "\t"));
	}
}

function normalize(exports) {
	return exports.filter((name) => name !== "__esModule").sort();
}

function babelAnalyze(source) {
	const exports = [];
	const reexports = [];

	const ast = parse(source, {
		sourceType: "module",
		plugins: [
			"moduleStringNames",
			"classProperties",
			"classPrivateProperties",
			"classPrivateMethods",
			"classStaticBlock",
		],
	});
	for (const node of ast.program.body) {
		if (t.isExportAllDeclaration(node)) {
			reexports.push(node.source.value);
		}
		if (t.isExportDefaultDeclaration(node)) {
			exports.push("default");
		}
		if (t.isExportNamedDeclaration(node)) {
			for (const specifier of node.specifiers) {
				exports.push(
					specifier.exported.name || specifier.exported.value
				);
			}
			if (node.declaration) {
				exports.push(
					...Object.keys(t.getOuterBindingIdentifiers(node.declaration))
				);
			}
		}
	}
	return {
		exports: normalize(exports),
		reexports: normalize(reexports),
	};
}
