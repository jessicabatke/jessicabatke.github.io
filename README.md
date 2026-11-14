# jessicabatke.com

Personal site, built with [Eleventy](https://www.11ty.dev/) (moved from Jekyll in November 2026).
The look is still the Minimal Mistakes theme; its styles live in `_sass/`.

## Before making changes: sync with the online repo

```sh
cd ~/Documents/website/jessicabatke.github.io
git checkout master
git pull origin master
git checkout -b name_of_branch      # e.g. the date
git status                          # confirm you're on the new branch
```

## See the site locally

You need [Node.js](https://nodejs.org/) (version 18 or newer). The first time only, run:

```sh
npm install
```

After that, every time:

```sh
npm start
```

Then open http://localhost:8080 in a browser. The page reloads by itself when you save a file.
Press `Ctrl+C` in the terminal to stop it.

(No more `rbenv` / `bundle exec jekyll serve`.)

## Upload changes

```sh
git add .
git commit -m "describe what you changed"
git push origin HEAD
```

Then go to the GitHub repo and merge the pull request. When it lands on `master`,
GitHub builds and publishes the site automatically (see the **Actions** tab; it takes a minute or two).

## Where things are

| What | Where |
|---|---|
| Research / Writing posts | `_posts/YYYY-MM-DD-Short_Name.markdown` → published at `/research&writing/Short_Name/` |
| Other pages (About, Music / Theater, EIG, …) | `_pages/` |
| Home page | `index.md` |
| Images and other files | `media/` (link as `/media/file.jpg`) |
| Site title, sidebar bio, links | `_data/site.yml` |
| Top menu | `_data/navigation.yml` |
| Sidebar for EIG / TaRE / Gramophonic pages | `_data/authors.yml` |
| Page templates | `_layouts/` and `_includes/` |
| Styles | `assets/css/main.scss` (theme partials in `_sass/`) |
| Build settings | `eleventy.config.js` |

### Writing a new post

Copy an existing file in `_posts/` and change the front matter:

```yaml
---
layout: single
title:  "Title of the piece"
date:   2026-11-14
categories: Research&Writing
tags: [ChinaFile, censorship]
classes: wide
excerpt: "ChinaFile / 2026-11-14"
---
```

## Markdown / syntax cheatsheet

- Markdown: https://www.markdownguide.org/cheat-sheet/
- Image: `![description](/media/comparison0.png)`
- Image with a class or style: `![description](/media/pic.png){.align-right}` or `{style="display:block; margin:auto"}`
- Big header image on a page/post (front matter):
  ```yaml
  header:
    image: /media/chair.jpg
    caption: "Image credit: …"
  ```
- Photo gallery: list the photos in the front matter (see `_pages/EIG.md` for an example), then put
  `{% gallery gallery1 %}` where it should appear.
- Row of cards with buttons: see `_pages/music-art.md` — `{% feature_row feature_row1 "right" %}`.
- Pop-up definition of a term: `{% drawer "term" %}What the term means.{% enddrawer %}`
- YouTube embed: paste the `<iframe …>` code from YouTube's Share → Embed directly into the post.
