import { Options } from "tsup";
import { promises } from "fs";
import { join } from "path";
import { exec } from "child_process";
import { promisify } from "util";

type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType extends readonly (infer ElementType)[]
	? ElementType
	: never;

type Plugin = ArrayElement<Exclude<Options["plugins"], undefined>>;

const TEMP_DIR = ".temp";
const SOURCE_FILE = "src/workers/SegmentWorker.ts";
const COMPILE_COMAND = `tsc ${SOURCE_FILE} --outDir ${TEMP_DIR} --module es2015 --target es5 --moduleResolution node`;
const COMPILED_FILE = ".temp/workers/SegmentWorker.js";
const TARGET_FILE = "src/generated/InlineSegmentWorker.ts";

const createInlineSegmentWorker = (workerCode: string): string => {
	return `// File generated at build time (plugins/SetupInlineWorker.ts)
const workerScript = ${JSON.stringify(workerCode)};
const blob = new Blob([workerScript], { type: 'application/javascript' });
const workerUrl = URL.createObjectURL(blob);
export const getWorkerUrl = () => workerUrl;
`;
};

export const generateInlineWorker = (): Plugin => ({
	name: "generate-inline-compiled-worker",
	buildStart: async () => {
		const { mkdir, readFile, writeFile, rm } = promises;
		const execAsync = promisify(exec);
		try {
			// Ensure temp directory exists
			await mkdir(TEMP_DIR, { recursive: true });

			// Compile the source file to temp directory
			await execAsync(COMPILE_COMAND);

			// Read the compiled content
			const compiledContent = await readFile(join(__dirname, "../", COMPILED_FILE), "utf-8");
			// replace uninjected tsup env var
			// Use regex to find and replace the expression with 'false'
			const modifiedCode = compiledContent.replace(/process\.env\.RUNTIME === ["']node["']/g, "false");

			// Create new inline content
			const inlineContent = createInlineSegmentWorker(modifiedCode);

			// Write the content to the target file
			writeFile(join(__dirname, "../", TARGET_FILE), inlineContent);

			// Clean up temp directory
			await rm(TEMP_DIR, { recursive: true, force: true });
		} catch (error) {
			console.error("Error in generate-inline-compiled-worker plugin:", error);
			throw error;
		}
	},
});
