const deck = document.getElementById('analysisDeck');
const DATA_VERSION = '20260520-7';

const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
};

const getPaperSlug = () => new URLSearchParams(window.location.search).get('paper');

function renderAnalysis(paper) {
    document.title = `${paper.title} | Vue Tech SG AI Research`;
    const sourceUrl = paper.sourceUrl || '';
    deck.innerHTML = `
        <article class="analysis-hero">
            <div class="analysis-eyebrow">${escapeHtml(paper.venue)} ${escapeHtml(paper.year)}</div>
            <h1>${escapeHtml(paper.title)}</h1>
            <p>${escapeHtml(paper.subtitle)}</p>
            <div class="reading-actions">
                <a class="paper-link" href="reading.html?paper=${encodeURIComponent(paper.slug)}"><i class="fa-solid fa-book-open-reader"></i> Intensive Reading</a>
                ${sourceUrl ? `<a class="paper-link" href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-arrow-up-right-from-square"></i> Source</a>` : ''}
            </div>
        </article>
        <div class="analysis-slides">
            ${paper.sections.map((section, index) => `
                <section class="analysis-slide">
                    <div class="slide-number">${String(index + 1).padStart(2, '0')}</div>
                    <h2>${escapeHtml(section.heading)}</h2>
                    <ul>
                        ${section.points.map(point => `<li>${escapeHtml(point)}</li>`).join('')}
                    </ul>
                </section>
            `).join('')}
        </div>
        <div class="analysis-bottom-nav">
            <a class="paper-link" href="./#paperList"><i class="fa-solid fa-arrow-left"></i> Back to Papers</a>
        </div>
    `;
}

fetch(`data/paper-analyses.json?v=${DATA_VERSION}`)
    .then(response => {
        if(!response.ok) throw new Error('Failed to load paper analyses');
        return response.json();
    })
    .then(papers => {
        const slug = getPaperSlug();
        const paper = papers.find(item => item.slug === slug) || papers[0];
        if(!paper) throw new Error('No analysis data available');
        renderAnalysis(paper);
    })
    .catch(error => {
        deck.innerHTML = `
            <div class="empty-state">
                <p>Failed to load this analysis.</p>
                <a class="paper-link" href="./#paperList">Back to Papers</a>
            </div>
        `;
        console.error(error);
    });
