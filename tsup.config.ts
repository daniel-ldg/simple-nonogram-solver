import { generateInlineWorker } from "./plugins/SetupInlineWorker";
import { defineConfig } from "tsup";

export default defineConfig([
	{
		entry: ["src/index.ts", "src/workers/SegmentWorker.ts"],
		outDir: "dist/node",
		target: "node16",
		format: ["cjs", "esm"],
		platform: "node",
		splitting: true,
		sourcemap: true,
		dts: true,
		define: {
			"process.env.RUNTIME": '"node"',
		},
	},
	{
		entry: ["src/index.ts"],
		outDir: "dist/browser",
		target: "esnext",
		format: ["esm"],
		platform: "browser",
		splitting: true,
		sourcemap: true,
		dts: true,
		define: {
			"process.env.RUNTIME": '"browser"',
		},
		plugins: [generateInlineWorker()],
	},
]);
