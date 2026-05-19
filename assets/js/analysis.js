const deck = document.getElementById('analysisDeck');

const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
};

const getPaperSlug = () => new URLSearchParams(window.location.search).get('paper');

function renderAnalysis(paper) {
    document.title = `${paper.title} | Vue Tech SG AI Research`;
    deck.innerHTML = `
        <article class="analysis-hero">
            <div class="analysis-eyebrow">${escapeHtml(paper.venue)} ${escapeHtml(paper.year)}</div>
            <h1>${escapeHtml(paper.title)}</h1>
            <p>${escapeHtml(paper.subtitle)}</p>
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
            <a class="paper-link" href="./#essential-papers"><i class="fa-solid fa-arrow-left"></i> Back to Essential Papers</a>
        </div>
    `;
}

fetch('data/paper-analyses.json')
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
                <a class="paper-link" href="./#essential-papers">Back to Essential Papers</a>
            </div>
        `;
        console.error(error);
    });
