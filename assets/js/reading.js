const readingDeck = document.getElementById('readingDeck');
const ASSET_VERSION = '20260520-3';

const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
};

const getPaperSlug = () => new URLSearchParams(window.location.search).get('paper');

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

function renderReading(analysis, essential, notes) {
    document.title = `${analysis.title} Intensive Reading | Vue Tech SG AI Research`;
    const tags = essential?.tags || [];
    const pdfPath = essential?.pdfPath;
    const sourceUrl = essential?.sourceUrl || analysis.sourceUrl;

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
            <section class="analysis-slide reading-note-card reading-wide">
                <div class="slide-number">04</div>
                <h2>Detailed Comments</h2>
                <ul class="reading-comment-list">
                    ${renderMarginNotes(notes.marginNotes)}
                </ul>
            </section>
            <section class="analysis-slide reading-note-card reading-wide">
                <div class="slide-number">05</div>
                <h2>Annotated Paper Map</h2>
                <ul class="reading-comment-list">
                    ${renderAnnotatedMap(analysis.sections)}
                </ul>
            </section>
            <section class="analysis-slide reading-note-card">
                <div class="slide-number">06</div>
                <h2>Common Pitfalls</h2>
                <ul>
                    ${renderList(notes.pitfalls)}
                </ul>
            </section>
            <section class="analysis-slide reading-note-card">
                <div class="slide-number">07</div>
                <h2>Practice Tasks</h2>
                <ul>
                    ${renderList(notes.practice)}
                </ul>
            </section>
            <section class="analysis-slide reading-wide">
                <div class="slide-number">08</div>
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
            <a class="paper-link" href="./#essential-papers"><i class="fa-solid fa-arrow-left"></i> Back to Essential Papers</a>
        </div>
    `;
}

Promise.all([
    fetchJson('data/paper-analyses.json'),
    fetchJson('data/essential-papers.json'),
    fetchJson('data/paper-study-notes.json')
])
    .then(([analyses, essentials, studyNotes]) => {
        const slug = getPaperSlug();
        const analysis = analyses.find(item => item.slug === slug) || analyses[0];
        const essential = essentials.find(item => item.slug === analysis.slug);
        const notes = studyNotes.find(item => item.slug === analysis.slug);
        if(!analysis || !notes) throw new Error('No reading data available');
        renderReading(analysis, essential, notes);
    })
    .catch(error => {
        readingDeck.innerHTML = `
            <div class="empty-state">
                <p>Failed to load these reading notes.</p>
                <a class="paper-link" href="./#essential-papers">Back to Essential Papers</a>
            </div>
        `;
        console.error(error);
    });
