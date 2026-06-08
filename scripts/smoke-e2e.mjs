import { runFullFlowSmoke } from './smoke-flow.mjs';

const summary = await runFullFlowSmoke();

console.log(JSON.stringify(summary, null, 2));
