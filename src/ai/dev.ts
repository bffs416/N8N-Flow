import { config } from 'dotenv';
config();

import '@/ai/flows/extract-key-workflow-info.ts';
import '@/ai/flows/identify-similar-workflows.ts';
import '@/ai/flows/generate-use-case-examples.ts';
