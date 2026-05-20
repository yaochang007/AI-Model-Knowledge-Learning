const readingDeck = document.getElementById('readingDeck');
const ASSET_VERSION = '20260520-8';

const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
};

const getPaperSlug = () => new URLSearchParams(window.location.search).get('paper');

function getBackTarget(isEssential) {
    return isEssential
        ? { href: './#essential-papers', label: 'Back to Essential Papers' }
        : { href: './#paperList', label: 'Back to Papers' };
}

function updateHeaderBackLink(backTarget) {
    const headerBackLink = document.querySelector('.analysis-header .section-link');
    if(!headerBackLink) return;

    headerBackLink.href = backTarget.href;
    headerBackLink.innerHTML = `<i class="fa-solid fa-arrow-left"></i> ${backTarget.label}`;
}

function fetchJson(path) {
    return fetch(`${path}?v=${ASSET_VERSION}`).then(response => {
        if(!response.ok) throw new Error(`Failed to load ${path}`);
        return response.json();
    });
}

function renderList(items) {
    return items.map(item => `<li>${escapeHtml(item)}</li>`).join('');
}

function renderRoadmap(items) {
    return items.map((item, index) => `
        <li class="reading-step">
            <span class="reading-step-number">${String(index + 1).padStart(2, '0')}</span>
            <div>
                <strong>${escapeHtml(item.step)}</strong>
                <p>${escapeHtml(item.comment)}</p>
            </div>
        </li>
    `).join('');
}

function renderTermCards(items) {
    return items.map(item => `
        <li class="reading-term-card">
            <strong>${escapeHtml(item.term)}</strong>
            <p>${escapeHtml(item.note)}</p>
        </li>
    `).join('');
}

function renderMarginNotes(items) {
    return items.map(item => `
        <li class="reading-comment">
            <span>${escapeHtml(item.label)}</span>
            <p>${escapeHtml(item.note)}</p>
        </li>
    `).join('');
}

function renderTags(tags) {
    return tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('');
}

function renderAnnotatedMap(sections) {
    return sections.map(section => `
        <li class="reading-comment">
            <span>${escapeHtml(section.heading)}</span>
            <p>${escapeHtml(section.points.join(' '))}</p>
        </li>
    `).join('');
}

function renderFigureCards(figures, slideNumber) {
    if(!figures.length) return '';

    return `
        <section class="analysis-slide reading-note-card reading-wide">
            <div class="slide-number">${String(slideNumber).padStart(2, '0')}</div>
            <h2>Key Paper Figures</h2>
            <div class="paper-figure-list">
                ${figures.map((figure, index) => `
                    <article class="paper-figure-card">
                        <figure>
                            <button class="paper-figure-zoom" type="button" data-figure-index="${index}" aria-label="Open ${escapeHtml(figure.title)} larger">
                                <img src="${escapeHtml(figure.imagePath)}?v=${ASSET_VERSION}" alt="${escapeHtml(figure.title)}" loading="lazy">
                            </button>
                            <figcaption>
                                <strong>${escapeHtml(figure.title)}</strong>
                                <span>${escapeHtml(figure.sourceLabel)} - ${escapeHtml(figure.caption)}</span>
                            </figcaption>
                        </figure>
                        <div class="paper-figure-notes">
                            <h3>How to Read This Diagram</h3>
                            <ul>
                                ${renderList(figure.explanation)}
                            </ul>
                        </div>
                    </article>
                `).join('')}
            </div>
        </section>
    `;
}

function ensureFigureLightbox() {
    let lightbox = document.getElementById('figureLightbox');
    if(lightbox) return lightbox;

    document.body.insertAdjacentHTML('beforeend', `
        <div class="figure-lightbox hidden" id="figureLightbox" role="dialog" aria-modal="true" aria-label="Expanded paper figure">
            <div class="figure-lightbox-panel">
                <button class="figure-lightbox-close" type="button" aria-label="Close expanded figure">
                    <i class="fa-solid fa-xmark"></i>
                </button>
                <div class="figure-lightbox-image-wrap">
                    <img class="figure-lightbox-image" alt="">
                </div>
                <div class="figure-lightbox-caption"></div>
            </div>
        </div>
    `);

    lightbox = document.getElementById('figureLightbox');
    const closeButton = lightbox.querySelector('.figure-lightbox-close');
    const image = lightbox.querySelector('.figure-lightbox-image');

    const closeLightbox = () => {
        lightbox.classList.add('hidden');
        document.body.classList.remove('lightbox-open');
        image.removeAttribute('src');
    };

    closeButton.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', event => {
        if(event.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', event => {
        if(event.key === 'Escape' && !lightbox.classList.contains('hidden')) closeLightbox();
    });

    return lightbox;
}

function bindFigureLightbox(figures) {
    const buttons = readingDeck.querySelectorAll('.paper-figure-zoom');
    if(!buttons.length) return;

    const lightbox = ensureFigureLightbox();
    const image = lightbox.querySelector('.figure-lightbox-image');
    const caption = lightbox.querySelector('.figure-lightbox-caption');
    const closeButton = lightbox.querySelector('.figure-lightbox-close');

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const figure = figures[Number(button.dataset.figureIndex)];
            if(!figure) return;

            image.src = `${figure.imagePath}?v=${ASSET_VERSION}`;
            image.alt = figure.title;
            caption.innerHTML = `
                <strong>${escapeHtml(figure.title)}</strong>
                <span>${escapeHtml(figure.sourceLabel)} - ${escapeHtml(figure.caption)}</span>
            `;
            lightbox.classList.remove('hidden');
            document.body.classList.add('lightbox-open');
            closeButton.focus();
        });
    });
}

function findMarginNote(notes, label) {
    return notes.marginNotes.find(item => item.label.toLowerCase().includes(label));
}

function renderConceptGraph(analysis, notes, slideNumber) {
    const flowNodes = [
        { label: 'Problem', note: findMarginNote(notes, 'problem')?.note },
        { label: 'Method', note: findMarginNote(notes, 'method')?.note },
        { label: 'Evidence', note: findMarginNote(notes, 'evidence')?.note },
        { label: 'Use Carefully', note: notes.pitfalls[0] }
    ].filter(item => item.note);

    const conceptNodes = notes.concepts.slice(0, 3);
    if(flowNodes.length < 3 && conceptNodes.length < 2) return '';

    return `
        <section class="analysis-slide reading-note-card reading-wide">
            <div class="slide-number">${String(slideNumber).padStart(2, '0')}</div>
            <h2>Learning Graph</h2>
            <div class="reading-graph" aria-label="Visual concept graph">
                <div class="reading-graph-center">
                    <span>Paper</span>
                    <strong>${escapeHtml(analysis.title)}</strong>
                </div>
                <div class="reading-graph-branch reading-graph-concepts">
                    ${conceptNodes.map(item => `
                        <div class="reading-graph-node">
                            <span>Concept</span>
                            <strong>${escapeHtml(item.term)}</strong>
                            <p>${escapeHtml(item.note)}</p>
                        </div>
                    `).join('')}
                </div>
                <div class="reading-graph-flow">
                    ${flowNodes.map((item, index) => `
                        <div class="reading-flow-step">
                            <span>${String(index + 1).padStart(2, '0')}</span>
                            <strong>${escapeHtml(item.label)}</strong>
                            <p>${escapeHtml(item.note)}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        </section>
    `;
}

function renderReading(analysis, essential, notes, figureData) {
    document.title = `${analysis.title} Intensive Reading | Vue Tech SG AI Research`;
    const tags = essential?.tags || [];
    const pdfPath = essential?.pdfPath;
    const sourceUrl = essential?.sourceUrl || analysis.sourceUrl;
    const figures = figureData?.figures || [];
    const graphSlide = figures.length ? 5 : 4;
    const detailSlide = graphSlide + 1;
    const annotatedSlide = graphSlide + 2;
    const pitfallsSlide = graphSlide + 3;
    const practiceSlide = graphSlide + 4;
    const routineSlide = graphSlide + 5;
    const backTarget = getBackTarget(Boolean(essential));
    updateHeaderBackLink(backTarget);

    readingDeck.innerHTML = `
        <article class="analysis-hero">
            <div class="analysis-eyebrow">Intensive Reading - ${escapeHtml(analysis.venue)} ${escapeHtml(analysis.year)}</div>
            <h1>${escapeHtml(analysis.title)}</h1>
            <p>${escapeHtml(analysis.subtitle)}</p>
            <div class="reading-actions">
                <a class="paper-link" href="analysis.html?paper=${encodeURIComponent(analysis.slug)}"><i class="fa-solid fa-chart-simple"></i> Analysis</a>
                ${pdfPath ? `<a class="paper-link" href="${escapeHtml(pdfPath)}" download><i class="fa-solid fa-file-arrow-down"></i> Download PDF</a>` : ''}
                ${sourceUrl ? `<a class="paper-link" href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener"><i class="fa-solid fa-arrow-up-right-from-square"></i> Source</a>` : ''}
            </div>
            ${tags.length ? `<div class="paper-tags reading-tags">${renderTags(tags)}</div>` : ''}
        </article>
        <div class="reading-study-grid">
            <section class="analysis-slide reading-note-card">
                <div class="slide-number">01</div>
                <h2>Study Setup</h2>
                <ul>
                    ${renderList(notes.before)}
                </ul>
            </section>
            <section class="analysis-slide reading-note-card">
                <div class="slide-number">02</div>
                <h2>Core Concepts</h2>
                <ul class="reading-term-list">
                    ${renderTermCards(notes.concepts)}
                </ul>
            </section>
            <section class="analysis-slide reading-note-card reading-wide">
                <div class="slide-number">03</div>
                <h2>Reading Roadmap</h2>
                <ol class="reading-roadmap">
                    ${renderRoadmap(notes.roadmap)}
                </ol>
            </section>
            ${renderFigureCards(figures, 4)}
            ${renderConceptGraph(analysis, notes, graphSlide)}
            <section class="analysis-slide reading-note-card reading-wide">
                <div class="slide-number">${String(detailSlide).padStart(2, '0')}</div>
                <h2>Detailed Comments</h2>
                <ul class="reading-comment-list">
                    ${renderMarginNotes(notes.marginNotes)}
                </ul>
            </section>
            <section class="analysis-slide reading-note-card reading-wide">
                <div class="slide-number">${String(annotatedSlide).padStart(2, '0')}</div>
                <h2>Annotated Paper Map</h2>
                <ul class="reading-comment-list">
                    ${renderAnnotatedMap(analysis.sections)}
                </ul>
            </section>
            <section class="analysis-slide reading-note-card">
                <div class="slide-number">${String(pitfallsSlide).padStart(2, '0')}</div>
                <h2>Common Pitfalls</h2>
                <ul>
                    ${renderList(notes.pitfalls)}
                </ul>
            </section>
            <section class="analysis-slide reading-note-card">
                <div class="slide-number">${String(practiceSlide).padStart(2, '0')}</div>
                <h2>Practice Tasks</h2>
                <ul>
                    ${renderList(notes.practice)}
                </ul>
            </section>
            <section class="analysis-slide reading-wide">
                <div class="slide-number">${String(routineSlide).padStart(2, '0')}</div>
                <h2>Undergraduate Reading Routine</h2>
                <ul>
                    <li>First pass: read the abstract, figures, and conclusion, then write a three-sentence summary without looking back.</li>
                    <li>Second pass: annotate each method step with what data enters, what computation happens, and what output leaves.</li>
                    <li>Third pass: check the evidence. Identify the strongest result, the weakest result, and one missing experiment.</li>
                    <li>Final pass: connect the paper to a small project, classroom activity, or research question you could test.</li>
                </ul>
            </section>
        </div>
        <div class="analysis-bottom-nav">
            <a class="paper-link" href="analysis.html?paper=${encodeURIComponent(analysis.slug)}"><i class="fa-solid fa-chart-simple"></i> Analysis</a>
            <a class="paper-link" href="${backTarget.href}"><i class="fa-solid fa-arrow-left"></i> ${backTarget.label}</a>
        </div>
    `;
    bindFigureLightbox(figures);
}

Promise.all([
    fetchJson('data/paper-analyses.json'),
    fetchJson('data/essential-papers.json'),
    fetchJson('data/paper-study-notes.json'),
    fetchJson('data/paper-figures.json')
])
    .then(([analyses, essentials, studyNotes, paperFigures]) => {
        const slug = getPaperSlug();
        const analysis = analyses.find(item => item.slug === slug) || analyses[0];
        const essential = essentials.find(item => item.slug === analysis.slug);
        const notes = studyNotes.find(item => item.slug === analysis.slug);
        const figureData = paperFigures.find(item => item.slug === analysis.slug);
        if(!analysis || !notes) throw new Error('No reading data available');
        renderReading(analysis, essential, notes, figureData);
    })
    .catch(error => {
        readingDeck.innerHTML = `
            <div class="empty-state">
                <p>Failed to load these reading notes.</p>
                <a class="paper-link" href="./#paperList">Back to Papers</a>
            </div>
        `;
        console.error(error);
    });
