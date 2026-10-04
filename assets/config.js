/* Settings the founder fills in when each service exists. Empty means "not yet", and the pages say so honestly.
   LW_CHATGPT_URL:   the Link World plugin's page in ChatGPT, once it's published. Until then the home page offers the prompt.
   LW_API:           the stats service's base address (stats/README.md), e.g. https://linkworld-stats.<you>.workers.dev
                     It counts page views and clicks, and takes "own this page" requests.
   LW_CONTACT_EMAIL: where support and privacy requests go. Until set, pages point to GitHub. */
window.LW_CHATGPT_URL = '';
window.LW_API = '';
window.LW_CONTACT_EMAIL = '';
window.LW_STATS_URL = window.LW_API ? window.LW_API + '/e' : '';
