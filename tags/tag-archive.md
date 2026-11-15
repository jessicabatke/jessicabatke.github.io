---
title: "Posts by Tag"
permalink: /tags/
layout: archive
author_profile: true
classes: wide
---


<ul class="tag-index" id="tag-index">
  <li><a href="#" data-all aria-current="true">All tags</a></li>
  {%- for tag in collections.tagList %}
  <li><a href="#{{ tag.slug }}">{{ tag.name }} <span class="tag-count">{{ tag.posts.size }}</span></a></li>
  {%- endfor %}
</ul>

{%- for tag in collections.tagList %}
<section id="{{ tag.slug }}" class="tag-section">
  <div class="work-heading">
    <h2 class="work-heading__title">{{ tag.name }} <span class="work-heading__count">· {{ tag.posts.size }}</span></h2>
    <a class="tag-top" href="#page-title">Back to top ↑</a>
  </div>
  <ul class="work-list">
    {%- for post in tag.posts %}
    {%- assign wtype = post | workType %}
    <li class="work-row">
      <a href="{{ post.url }}">{{ post.data.title | markdownifyInline }} <span class="work-row__year">{{ post.date | date: "%Y" }}</span></a>
      <span class="work-row__outlet">{{ post.data.excerpt | outlet }}<span class="work-row__type" title="{{ wtype }}">{{ wtype | downcase | icon }}<span class="screen-reader-text">{{ wtype }}</span></span></span>
    </li>
    {%- endfor %}
  </ul>
</section>
{%- endfor %}

<script>
  // Click a tag to show only its posts; "All tags" shows everything.
  // The address updates (/tags/#religion) so filtered views can be shared, and links from
  // article pages land on the right tag. Without JavaScript, the chips just jump to each section.
  (function () {
    var body = document.body;
    var chips = document.querySelectorAll("#tag-index a");
    var sections = document.querySelectorAll(".tag-section");
    function show(slug) {
      var target = slug && document.getElementById(slug);
      var valid = target && target.classList.contains("tag-section");
      body.classList.toggle("tags-filtered", !!valid);
      sections.forEach(function (s) { s.classList.toggle("is-selected", valid && s === target); });
      chips.forEach(function (c) {
        var on = valid ? c.getAttribute("href") === "#" + slug : c.hasAttribute("data-all");
        if (on) c.setAttribute("aria-current", "true"); else c.removeAttribute("aria-current");
      });
    }
    chips.forEach(function (c) {
      c.addEventListener("click", function (e) {
        e.preventDefault();
        var slug = c.hasAttribute("data-all") ? "" : c.getAttribute("href").slice(1);
        history.pushState(null, "", slug ? "#" + slug : location.pathname);
        show(slug);
      });
    });
    window.addEventListener("popstate", function () { show(location.hash.slice(1)); });
    window.addEventListener("hashchange", function () { show(location.hash.slice(1)); });
    show(decodeURIComponent(location.hash.slice(1)));
    if (body.classList.contains("tags-filtered")) window.scrollTo(0, 0);
  })();
</script>
