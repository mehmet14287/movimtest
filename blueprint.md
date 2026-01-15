
# Movim Landing Page Blueprint

## Overview

This document outlines the plan, features, and design for the "Movim" landing page. Initially a single-page site, it has evolved into a dynamic, multi-page content hub for a Korean and Asian drama streaming application. The goal is to maximize user acquisition, provide a rich user experience, and foster community engagement through a flexible, easily maintainable system.

## Implemented Features & Design

### Version 5.0 (Dizi Detay Sayfası)

*   **Dedicated Detail Pages:** Created a new `dizi-detay.html` page to provide a unique, in-depth view for each series.
*   **URL-Driven Content:** The page is fully dynamic, fetching data based on a unique `id` passed in the URL (e.g., `dizi-detay.html?id=squid-game`). The logic is handled by a new `dizi-detay.js` file.
*   **Enhanced Data Structure:** Updated `series.json` to include a unique `id` and `genre` for every series, enabling the new detail page functionality and future filtering capabilities.
*   **Modern Two-Column Layout:** The detail page features a visually appealing layout with the series poster on the left and the title, genre tags, and a detailed summary on the right.
*   **Seamless Navigation:** Updated `main.js` and `archive.js` to wrap all series cards (on the homepage and archive page) in links, directing users to the correct detail page.
*   **Recommendation Engine:** The detail page includes a "Bunları da Sevebilirsiniz" section that dynamically displays a random selection of other series, encouraging user exploration.

### Version 4.5 (Dynamic Marquee Effect)

*   **Continuous Scrolling Preview:** The "Öne Çıkanlar" (Highlights) section on the homepage has been transformed into an auto-scrolling marquee.
*   **Seamless Loop:** The series list is duplicated using JavaScript (`main.js`) to create an infinite, seamless scrolling loop, preventing any visual jumps.
*   **Interactive Pausing:** The animation is built with pure CSS (`style.css`) and automatically pauses when the user hovers their mouse over the series cards, allowing for easy interaction and clicking.
*   **Polished Visuals:** Gradient overlays were added to the left and right edges of the marquee to create a smooth, fading effect as series scroll in and out of view.
*   **Dynamic Speed Calculation:** The marquee animation speed is now dynamically calculated in `main.js` based on the number of items, ensuring a consistent and smooth scroll regardless of content length.

### Version 4.0 (Full Archive Page & Homepage Preview)

*   **Multi-Page Architecture:** Evolved into a multi-page application with a dedicated archive page (`archive.html`).
*   **Homepage Series Preview:** The homepage now features a scrollable preview of the first 6 series.
*   **Dedicated Archive Page:** The `archive.html` page displays the entire series library with real-time search functionality powered by `archive.js`.

### Version 3.0 (Dynamic FAQ Section)

*   **Data-Driven FAQs (`faq.json`):** Created `faq.json` to manage all FAQ content dynamically.

### Version 2.6 (Fully Centralized Links)

*   **Centralized Configuration (`config.json`):** Consolidated all key external links into `config.json`.

### Version 2.0 (Dynamic Content Architecture)

*   **Data-Driven Content (`series.json`):** Introduced `series.json` to manage the series library.

### Version 1.0 (Initial Release)

*   **Single-Page Architecture:** The initial static version.

## Current Plan: Dizi Detay Sayfası Implementation

**Objective:** To significantly enhance user experience by creating a dedicated, content-rich detail page for each series in the library.

**Steps:**

1.  **[DONE]** Enhance `series.json` by adding a unique `id` and a `genre` to each series object.
2.  **[DONE]** Create the new `dizi-detay.html` file, defining the structural layout for the page.
3.  **[DONE]** Create the corresponding `dizi-detay.js` file to handle the logic: fetching the correct series data based on the URL `id` and dynamically populating the page.
4.  **[DONE]** Implement the "Bunları da Sevebilirsiniz" recommendation section within `dizi-detay.js`.
5.  **[DONE]** Update `main.js` to link the homepage marquee items to their respective detail pages.
6.  **[DONE]** Update `archive.js` to link the archive grid items to their respective detail pages.
7.  **[DONE]** Update this `blueprint.md` to document the new Dizi Detay Sayfası feature.
