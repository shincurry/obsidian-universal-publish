import esbuild from "esbuild";
import process from "process";
import builtins from "builtin-modules";
import { copy } from 'esbuild-plugin-copy';
import fs from 'fs';
import path from "path";
import url from 'url';

const banner =
`/*
THIS IS A GENERATED/BUNDLED FILE BY ESBUILD
if you want to view the source, please visit the github repository of this plugin
*/
`;

const prod = (process.argv[2] === "production");

const context = await esbuild.context({
	banner: {
		js: banner,
	},
	entryPoints: ["src/main.ts"],
	bundle: true,
	external: [
		"obsidian",
		"electron",
		"@codemirror/autocomplete",
		"@codemirror/collab",
		"@codemirror/commands",
		"@codemirror/language",
		"@codemirror/lint",
		"@codemirror/search",
		"@codemirror/state",
		"@codemirror/view",
		"@lezer/common",
		"@lezer/highlight",
		"@lezer/lr",
		...builtins],
	format: "cjs",
	target: "es2018",
	logLevel: "info",
	sourcemap: prod ? false : "inline",
	treeShaking: true,
	outdir: prod ? "dist/obsidian-universal-publish" : "build",
	plugins: [
		copy({
			assets: [
				{ from: ['./manifest.json'], to: ['./manifest.json'] },
				{ from: ['./src/styles/styles.css'], to: ['./styles.css'] },
			]
		}),
		...(prod ? [
			{
				name: 'create-hotreload-file',
				setup: (build) => {
					if (prod) return;
					build.onEnd(() => {
						const cwd = path.dirname(url.fileURLToPath(import.meta.url))
						const fd = fs.openSync(path.join(cwd, 'build', '.hotreload'), 'w');
						fs.closeSync(fd);
					})
				}
			}
		] : []),
	]
});

if (prod) {
	await context.rebuild();
	process.exit(0);
} else {
	await context.watch();
}