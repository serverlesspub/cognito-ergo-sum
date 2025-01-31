import path from 'node:path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
const baseDirectory = path.dirname(fileURLToPath(import.meta.url));
export default function init() {
	dotenv.config({ path: path.join(baseDirectory, '..', '.env')});
};
