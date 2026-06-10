import { loadCascadingEnvs, getSourceDir } from './env-utils';

// Immediately execute cascading env loading as a side-effect.
// By importing this module FIRST in api/index.ts, we ensure
// process.env is fully populated BEFORE any downstream
// services (like Supabase) initialize their clients.
loadCascadingEnvs(process.cwd(), getSourceDir('/api'));
