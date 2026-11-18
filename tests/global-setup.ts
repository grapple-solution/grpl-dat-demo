/**
 * The search tabs are gruim modules pulled over module federation, so the
 * suite needs a remote to load them from and a live API behind it. Without
 * either, the pages render a module-load error and every test fails on a
 * selector, which reads like a broken test rather than a missing environment.
 * Check it up front and say what is missing.
 */
const setup = async () => {
  const remote = process.env.SVELTE_APP_CACHE_REMOTE_URL;
  const container = process.env.CACHE_CONTAINER_NAME;

  if (!remote || !container) {
    throw new Error(
      'The suite needs a gruim remote: set SVELTE_APP_CACHE_REMOTE_URL and ' +
        'CACHE_CONTAINER_NAME. See "Validation" in the README.',
    );
  }

  const reachable = async (url: string) => {
    try {
      return (await fetch(url)).ok;
    } catch {
      return false;
    }
  };

  if (!(await reachable(`${remote}/remoteEntry.js`))) {
    throw new Error(
      `No gruim remote at ${remote} — serve one with MF_NAME=${container}.`,
    );
  }

  // the modules reach the API through the remote's own /api proxy
  if (!(await reachable(`${remote}/api/openapi.json`))) {
    throw new Error(
      `The remote at ${remote} cannot reach an API. Start the DAT layers with ` +
        '"docker compose up" and point the remote at the cache layer.',
    );
  }
};

export default setup;
