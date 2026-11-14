// Defaults for every post in this folder (replaces the Jekyll "defaults" block).
export default {
  layout: "single",
  author_profile: true,
  is_post: true,
  // Keep the old Jekyll URLs: /research&writing/<file name without the date>/
  permalink: "/research&writing/{{ page.fileSlug }}/",
};
