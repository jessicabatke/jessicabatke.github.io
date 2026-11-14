import * as yaml from "js-yaml";
import * as sass from "sass";
import markdownIt from "markdown-it";
import markdownItAnchor from "markdown-it-anchor";
import markdownItAttrs from "markdown-it-attrs";

// Same rules Jekyll used for tag anchors and heading ids:
// lowercase, and collapse anything that isn't a letter or number into "-".
const slug = (s) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

// kramdown (GFM mode) heading ids: lowercase, drop anything that isn't a
// word character, hyphen or space, then spaces become hyphens. Matching it
// keeps old deep links like /gramophonic/#videos working.
const headingId = (s) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\p{Pc}\- ]/gu, "")
    .replace(/ /g, "-");

const escapeHtml = (s) =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export default function (eleventyConfig) {
  // ---- Markdown (closely matches the old kramdown settings) ----
  const md = markdownIt({ html: true, typographer: true })
    .use(markdownItAnchor, { slugify: headingId, tabIndex: false })
    .use(markdownItAttrs);
  // markdown-it only curls quotes it can pair up; kramdown curled every quote
  // by looking at the character before it. Do the same for any leftovers.
  md.core.ruler.after("smartquotes", "leftover_quotes", (state) => {
    for (const block of state.tokens) {
      if (block.type !== "inline" || !block.children) continue;
      let prev = ""; // last visible character, carried across emphasis/link tokens
      for (const t of block.children) {
        if (t.type === "softbreak" || t.type === "hardbreak") prev = " ";
        if (t.type === "code_inline") prev = "x";
        if (t.type !== "text") continue;
        let out = "";
        for (const ch of t.content) {
          if (ch === '"' || ch === "'") {
            const opening = prev === "" || /[\s([{—–/“‘-]/.test(prev);
            out += ch === '"' ? (opening ? "“" : "”") : opening ? "‘" : "’";
          } else out += ch;
          prev = out.slice(-1);
        }
        t.content = out;
      }
    }
  });
  eleventyConfig.setLibrary("md", md);
  eleventyConfig.setLiquidOptions({ timezoneOffset: 0 }); // show dates exactly as written in front matter
  // Posts use the .markdown extension; treat them like .md files.
  eleventyConfig.addExtension("markdown", { key: "md" });

  // ---- Data files ----
  eleventyConfig.addDataExtension("yml,yaml", (contents) => yaml.load(contents));

  // ---- Static files copied as-is ----
  eleventyConfig.addPassthroughCopy("media");
  eleventyConfig.addPassthroughCopy("assets/js");
  eleventyConfig.addPassthroughCopy("CNAME");

  eleventyConfig.ignores.add("README.md");
  eleventyConfig.ignores.add("LICENSE");
  eleventyConfig.ignores.add("_sass/**"); // partials, pulled in by assets/css/main.scss
  eleventyConfig.ignores.add("media/**"); // copied as-is above, never processed

  // ---- Stylesheet: compile the Minimal Mistakes SCSS in _sass ----
  eleventyConfig.addTemplateFormats("scss");
  eleventyConfig.addExtension("scss", {
    outputFileExtension: "css",
    compile(inputContent) {
      const result = sass.compileString(inputContent, {
        loadPaths: ["_sass"],
        style: "compressed",
        quietDeps: true,
        // The theme's SCSS predates modern Sass; it compiles fine, these are just warnings.
        silenceDeprecations: ["import", "global-builtin", "slash-div", "color-functions", "abs-percent"],
      });
      return () => result.css;
    },
  });
  eleventyConfig.addWatchTarget("_sass/");

  // ---- Collections ----
  eleventyConfig.addCollection("posts", (api) => api.getFilteredByGlob("_posts/*.markdown"));

  // [{ name, slug, posts (newest first) }], most-used tags first
  eleventyConfig.addCollection("tagList", (api) => {
    const map = new Map();
    for (const post of api.getFilteredByGlob("_posts/*.markdown")) {
      for (const tag of post.data.tags || []) {
        if (!map.has(tag)) map.set(tag, []);
        map.get(tag).push(post);
      }
    }
    return [...map.entries()]
      .map(([name, posts]) => ({ name, slug: slug(name), posts: posts.reverse() }))
      .sort((a, b) => b.posts.length - a.posts.length);
  });

  // ---- Filters ----
  eleventyConfig.addFilter("slug", slug);
  // Tag order on posts, as Jekyll/Minimal Mistakes listed them
  eleventyConfig.addFilter("sortTags", (tags) =>
    [...(tags || [])].sort((a, b) => ((a.toLowerCase() + "#") < (b.toLowerCase() + "#") ? -1 : 1))
  );
  eleventyConfig.addFilter("markdownify", (s) => md.render(String(s ?? "")));
  eleventyConfig.addFilter("markdownifyInline", (s) => md.renderInline(String(s ?? "")));
  eleventyConfig.addFilter("absolute_url", function (path) {
    const base = this.ctx?.site?.url || this.context?.environments?.site?.url || "";
    if (!path) return base + "/";
    return /^[a-z]+:\/\//i.test(path) ? path : base + path;
  });
  eleventyConfig.addFilter("isoDate", (d) => new Date(d).toISOString());

  // Small built-in icons (replace the old Font Awesome kit, which no longer works).
  // Usage: {{ "github" | icon }}. Old Font Awesome names like "fab fa-fw fa-github" also work.
  const ICONS = {
    "map-pin": "M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z",
    github: "M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3",
    linkedin: "M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z",
    tag: "M21.4 11.6l-9-9A2 2 0 0 0 11 2H4a2 2 0 0 0-2 2v7c0 .6.2 1.1.6 1.4l9 9c.4.4.9.6 1.4.6s1-.2 1.4-.6l7-7c.4-.4.6-.9.6-1.4s-.2-1-.6-1.4zM5.5 7A1.5 1.5 0 1 1 5.5 4a1.5 1.5 0 0 1 0 3z",
    link: "M3.9 12a3.1 3.1 0 0 1 3.1-3.1h4V7H7a5 5 0 0 0 0 10h4v-1.9H7A3.1 3.1 0 0 1 3.9 12zM8 13h8v-2H8v2zm9-6h-4v1.9h4a3.1 3.1 0 0 1 0 6.2h-4V17h4a5 5 0 0 0 0-10z",
  };
  Object.assign(ICONS, {
    article: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z",
    talk: "M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z",
    podcast: "M12 1a9 9 0 0 0-9 9v7a3 3 0 0 0 3 3h3v-8H5v-2a7 7 0 0 1 14 0v2h-4v8h3a3 3 0 0 0 3-3v-7a9 9 0 0 0-9-9z",
    data: "M10 10h5v11h-5zM17 21h3a2 2 0 0 0 2-2v-9h-5v11zm3-18H5a2 2 0 0 0-2 2v3h19V5a2 2 0 0 0-2-2zM3 19a2 2 0 0 0 2 2h3V10H3v9z",
  });
  const ICON_ALIASES = { "map-marker-alt": "map-pin", tags: "tag" };
  eleventyConfig.addFilter("icon", (name) => {
    let key = String(name ?? "").trim();
    const fa = key.match(/fa-(?!fw\b)([a-z-]+)/g);
    if (fa) key = fa[fa.length - 1].slice(3);
    key = ICON_ALIASES[key] || key;
    const d = ICONS[key] || ICONS.link;
    return `<svg class="site-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${d}"/></svg>`;
  });

  // What kind of item a post is: Article, Talk, Podcast or Data.
  // A post can set it directly with work_type: in its front matter; otherwise it's worked out
  // from the title/file name ("podcast"), the "public remarks" tag (talks, panels, testimony).
  eleventyConfig.addFilter("workType", (post) => {
    const d = post?.data || {};
    if (d.work_type) return d.work_type;
    const name = `${post?.page?.fileSlug || ""} ${d.title || ""}`;
    if (/podcast/i.test(name)) return "Podcast";
    if ((d.tags || []).some((t) => /public remarks/i.test(t))) return "Talk";
    if (/Policy_Documents_Database/.test(post?.page?.fileSlug || "")) return "Data";
    return "Article";
  });

  // Sub-parts of a multi-part piece (posts with part_of: <main piece URL>), in part_order
  eleventyConfig.addFilter("partsOf", (posts, url) =>
    (posts || [])
      .filter((p) => p.data.part_of === url)
      .sort((a, b) => (a.data.part_order ?? 99) - (b.data.part_order ?? 99))
  );

  // Where a piece appeared, taken from the post's excerpt ("ChinaFile / 2025-06-30" -> "ChinaFile").
  // Date-only parts are dropped; an excerpt that is just a date gives no outlet.
  eleventyConfig.addFilter("outlet", (excerpt) =>
    String(excerpt ?? "")
      .split("/")
      .map((p) => p.trim())
      .filter((p) => p && !/^\d{4}-\d{2}-\d{2}$/.test(p))
      .join(" / ")
  );

  // ---- Shortcodes used inside page content ----

  // {% feature_row feature_row1 "right" %}  — grid of image cards
  eleventyConfig.addShortcode("feature_row", (rows, type) => {
    const items = (rows || [])
      .map((f) => {
        const teaser = f.image_path
          ? `<div class="archive__item-teaser"><img src="${escapeHtml(f.image_path)}" alt="${escapeHtml(f.alt || "")}"></div>`
          : "";
        const title = f.title ? `<h2 class="archive__item-title">${f.title}</h2>` : "";
        const excerpt = f.excerpt ? `<div class="archive__item-excerpt">${md.render(String(f.excerpt))}</div>` : "";
        // The theme's buttons were blank (label " "), which screen readers announce as just "link".
        // Keep them looking the same, but give them hidden text naming where they go.
        const label = f.btn_label || ` <span class="screen-reader-text">${f.title ? "Go to " + f.title : "Learn more"}</span>`;
        const btn = f.url ? `<p><a href="${escapeHtml(f.url)}" class="btn ${f.btn_class || ""}">${label}</a></p>` : "";
        return `<div class="feature__item${type ? "--" + type : ""}"><div class="archive__item">${teaser}<div class="archive__item-body">${title}${excerpt}${btn}</div></div></div>`;
      })
      .join("");
    return `\n<div class="feature__wrapper">${items}</div>\n`;
  });

  // {% gallery gallery1 %}  — photo grid that opens in a lightbox
  eleventyConfig.addShortcode("gallery", (images, layout) => {
    images = images || [];
    const cls = layout || (images.length === 2 ? "half" : images.length >= 3 ? "third" : "");
    const imgs = images
      .map((img) => {
        const tag = `<img src="${escapeHtml(img.image_path)}" alt="${escapeHtml(img.alt || "")}">`;
        return img.url ? `<a href="${escapeHtml(img.url)}"${img.title ? ` title="${escapeHtml(img.title)}"` : ""}>${tag}</a>` : tag;
      })
      .join("");
    return `\n<figure class="${cls}">${imgs}</figure>\n`;
  });

  // {% drawer "network-level censorship" %}Definition…{% enddrawer %}
  // An inline term whose definition pops up on hover/tap.
  eleventyConfig.addPairedShortcode("drawer", (content, title) => {
    return `<span class="drawer" tabindex="0"><span class="drawer__term">${escapeHtml(title)}</span><span class="drawer__body" role="note">${md.renderInline(content.trim())}</span></span>`;
  });

  eleventyConfig.addShortcode("year", () => String(new Date().getFullYear()));

  // ---- Accessibility: give embedded players/charts a title ----
  // Screen readers announce an untitled <iframe> as just "frame". Any iframe that
  // already has a title="…" in the post is left alone, so specific titles can be
  // added by hand later.
  const iframeTitle = (src, inner) => {
    const linkText = ((inner.match(/<a[^>]*>([^<]+)<\/a>/) || [])[1] || "")
      .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n))
      .replace(/&amp;/g, "&");
    if (/bandcamp\.com/.test(src)) return linkText ? `Bandcamp player: ${linkText}` : "Bandcamp player";
    if (/youtube\.com|youtu\.be/.test(src)) return "YouTube video";
    if (/vimeo\.com/.test(src)) return "Vimeo video";
    if (/livestream\.com/.test(src)) return "Livestream video";
    if (/libsyn\.com/.test(src)) return "Podcast player";
    if (/google\.com\/maps/.test(src)) return "Map";
    if (/docs\.google\.com\/spreadsheets/.test(src)) return "Spreadsheet";
    if (/surge\.sh/.test(src)) return "Interactive satellite imagery";
    if (/jessicachinafile\.github\.io/.test(src)) return "Interactive chart";
    return "Embedded content";
  };
  eleventyConfig.addTransform("iframe-titles", function (content) {
    if (!(this.page.outputPath || "").endsWith(".html")) return content;
    return content.replace(/<iframe\b([^>]*)>([\s\S]*?)<\/iframe>/gi, (whole, attrs, inner) => {
      if (/\btitle\s*=/.test(attrs)) return whole;
      const src = (attrs.match(/\bsrc\s*=\s*"([^"]*)"/) || [])[1] || "";
      return `<iframe title="${escapeHtml(iframeTitle(src, inner))}"${attrs}>${inner}</iframe>`;
    });
  });

  return {
    dir: {
      input: ".",
      output: "_site",
      includes: "_includes",
      layouts: "_layouts",
      data: "_data",
    },
    markdownTemplateEngine: "liquid",
    htmlTemplateEngine: "liquid",
    templateFormats: ["md", "markdown", "html", "liquid"],
  };
}
