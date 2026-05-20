# Vue Tech SG AI Research

Vue Tech SG AI Research is a static research repository for learning important AI, LLM, and AI-for-education papers. It turns a curated paper list into a browsable website with essential-paper highlights, downloadable references, PPT-style analysis pages, and intensive reading notes for learners.

Live site: [https://research.vue.sg/](https://research.vue.sg/)

## What This Project Provides

- A searchable and filterable paper repository for AI, LLM, and education research.
- An Essential Papers section for foundational AI/LLM papers and important AI education papers.
- Local PDF downloads for Essential Papers where public redistribution is practical.
- PPT-style `Analysis` pages that explain each paper's overview, importance, method, results, limitations, and takeaways.
- `Intensive Reading` pages with study setup, concepts, reading roadmap, detailed comments, pitfalls, practice tasks, and learner-friendly explanations.
- Extracted paper figures for selected important papers, with click-to-enlarge viewing.
- A Vue Tech SG branded static site deployable on Cloudflare Pages.

## Upstream Credit

This project is based on and gives credit to the upstream repository:

[GeminiLight/awesome-ai-llm4education](https://github.com/GeminiLight/awesome-ai-llm4education)

The upstream project provides the original curated paper collection and taxonomy for AI and LLM research in education. This fork adapts that work into a Vue Tech SG research website and adds additional essential-paper content, analysis pages, intensive reading notes, local references, branding, and Cloudflare Pages deployment support.

If you reuse the paper list or taxonomy, please also credit the upstream project and its maintainers.

## Repository Structure

```text
.
├── index.html
├── analysis.html
├── reading.html
├── assets/
│   ├── css/
│   ├── images/
│   └── js/
├── data/
│   ├── papers.csv
│   ├── essential-papers.json
│   ├── paper-analyses.json
│   ├── paper-study-notes.json
│   ├── paper-figures.json
│   └── paper-index.json
├── papers/
│   └── essential/
├── LLM4EDU.md
└── README.md
```

## Key Data Files

- `data/papers.csv`: canonical paper list used by the homepage.
- `data/essential-papers.json`: ordered Essential Papers list, including source links and local PDF paths.
- `data/paper-analyses.json`: analysis-page content for all papers.
- `data/paper-study-notes.json`: intensive-reading content for all papers.
- `data/paper-figures.json`: extracted figure metadata for selected papers.
- `data/paper-index.json`: slug and route index used to connect paper cards to analysis and reading pages.

## Running Locally

This is a static site. No build step is required.

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

## Deployment

The site is deployed with Cloudflare Pages as a static site.

Recommended Cloudflare Pages settings:

- Production branch: `main`
- Build command: empty
- Output directory: `/`
- Root directory: `/`

After a commit is pushed to GitHub, Cloudflare Pages deploys the updated static site automatically.

## Updating Content

Typical content updates:

1. Add or update papers in `data/papers.csv`.
2. Add Essential Papers in `data/essential-papers.json` when they should appear in the featured section.
3. Add or update analysis content in `data/paper-analyses.json`.
4. Add or update intensive-reading notes in `data/paper-study-notes.json`.
5. Add figure metadata in `data/paper-figures.json` when extracted diagrams are available.
6. Keep `data/paper-index.json` aligned with the paper slugs used by the site.

## Notes on PDFs and Figures

PDFs and extracted figures are included only as learning references for selected Essential Papers. Copyright remains with the original authors and publishers. If a publisher does not allow redistribution, use the source link instead of hosting a local copy.

## Acknowledgements

Thanks to the maintainers of [GeminiLight/awesome-ai-llm4education](https://github.com/GeminiLight/awesome-ai-llm4education) for the original paper collection and categorization work that made this fork possible.
