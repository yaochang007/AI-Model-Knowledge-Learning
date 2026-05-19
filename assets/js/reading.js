const readingDeck = document.getElementById('readingDeck');

const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
};

const getPaperSlug = () => new URLSearchParams(window.location.search).get('paper');

const glossary = {
    "Transformer": "A neural architecture that mixes token information with attention instead of recurrence.",
    "Self-Attention": "A mechanism where each token chooses which other tokens to use as context.",
    "LLM Foundations": "Core ideas that explain how modern large language models are built or trained.",
    "Efficient Attention": "Methods that reduce the memory or compute cost of attention.",
    "Long Context": "Model behavior when processing many tokens at once.",
    "Pretraining": "Training on broad data before adapting to specific tasks.",
    "Scaling": "How model quality changes as data, parameters, or compute increase.",
    "Alignment": "Methods for making model behavior better match human intent and safety needs.",
    "RLHF": "Reinforcement learning from human feedback; a way to tune models using human preferences.",
    "Reasoning": "The model's ability to solve multi-step tasks instead of only pattern matching.",
    "Prompting": "Writing inputs that steer a model toward a desired behavior.",
    "RAG": "Retrieval-augmented generation; retrieve source text first, then generate from it.",
    "Fine-Tuning": "Training a pretrained model further on task or preference data.",
    "Agents": "Systems where a model plans, uses tools, and acts over multiple steps.",
    "Tool Use": "Letting a model call external functions, APIs, search, calculators, or databases.",
    "Study Planning": "Turning learning goals into ordered tasks, schedules, and feedback loops.",
    "Tutoring": "Guided help that diagnoses understanding and supports learner progress."
};

function meaningForTag(tag) {
    return glossary[tag] || `A theme to connect with the paper's problem, method, and practical impact.`;
}

function sectionByHeading(paper, heading) {
    return paper.sections.find(section => section.heading === heading);
}

function renderReading(paper, essential) {
    document.title = `${paper.title} Intensive Reading | Vue Tech SG AI Research`;
    const tags = essential?.tags || [];
    const overview = sectionByHeading(paper, 'Overview')?.points || [];
    const method = sectionByHeading(paper, 'Method')?.points || [];
    const limitations = sectionByHeading(paper, 'Limitations')?.points || [];
    const takeaways = sectionByHeading(paper, 'Practical Takeaways')?.points || [];

    readingDeck.innerHTML = `
        <article class="analysis-hero">
            <div class="analysis-eyebrow">Intensive Reading - ${escapeHtml(paper.venue)} ${escapeHtml(paper.year)}</div>
            <h1>${escapeHtml(paper.title)}</h1>
            <p>${escapeHtml(paper.subtitle)}</p>
        </article>
        <div class="reading-layout">
            <section class="analysis-slide reading-wide">
                <div class="slide-number">01</div>
                <h2>Before You Read</h2>
                <ul>
                    <li>Goal: explain the paper's problem, core method, evidence, and limitation in your own words.</li>
                    <li>Skim the abstract, introduction, method diagram, results table, and conclusion before reading line by line.</li>
                    <li>Write one question you want the paper to answer before opening the PDF.</li>
                </ul>
            </section>
            <section class="analysis-slide">
                <div class="slide-number">02</div>
                <h2>Plain-English Anchor</h2>
                <ul>
                    ${overview.map(point => `<li>${escapeHtml(point)}</li>`).join('')}
                    <li>In one sentence: this paper matters because it changes how researchers build, train, use, or evaluate AI systems.</li>
                </ul>
            </section>
            <section class="analysis-slide">
                <div class="slide-number">03</div>
                <h2>Key Terms</h2>
                <ul>
                    ${tags.slice(0, 5).map(tag => `<li><strong>${escapeHtml(tag)}:</strong> ${escapeHtml(meaningForTag(tag))}</li>`).join('')}
                </ul>
            </section>
            <section class="analysis-slide reading-wide">
                <div class="slide-number">04</div>
                <h2>Guided Walkthrough</h2>
                <ul>
                    <li><strong>Problem:</strong> Identify what was hard, expensive, unreliable, or missing before this paper.</li>
                    <li><strong>Method:</strong> ${escapeHtml(method[0] || 'Find the main algorithm or system design and redraw it as a simple box diagram.')}</li>
                    <li><strong>Evidence:</strong> Locate the main benchmark, comparison, ablation, or human evaluation supporting the claim.</li>
                    <li><strong>Boundary:</strong> ${escapeHtml(limitations[0] || 'Name one setting where the method may fail or need more evidence.')}</li>
                </ul>
            </section>
            <section class="analysis-slide">
                <div class="slide-number">05</div>
                <h2>Check Understanding</h2>
                <ul>
                    <li>What is the paper's one-line contribution?</li>
                    <li>Which assumption would break the method if it were false?</li>
                    <li>What experiment would convince you the idea works in your own domain?</li>
                </ul>
            </section>
            <section class="analysis-slide">
                <div class="slide-number">06</div>
                <h2>Study Exercise</h2>
                <ul>
                    <li>Draw the model or workflow in 5 boxes or fewer.</li>
                    <li>Teach the idea to a friend without using equations first, then add the key equation or objective.</li>
                    <li>${escapeHtml(takeaways[0] || 'Write one practical lesson you would apply in a project.')}</li>
                </ul>
            </section>
        </div>
        <div class="analysis-bottom-nav">
            <a class="paper-link" href="analysis.html?paper=${encodeURIComponent(paper.slug)}"><i class="fa-solid fa-chart-simple"></i> Analysis</a>
            <a class="paper-link" href="./#essential-papers"><i class="fa-solid fa-arrow-left"></i> Back to Essential Papers</a>
        </div>
    `;
}

Promise.all([
    fetch('data/paper-analyses.json').then(response => {
        if(!response.ok) throw new Error('Failed to load paper analyses');
        return response.json();
    }),
    fetch('data/essential-papers.json').then(response => {
        if(!response.ok) throw new Error('Failed to load essential papers');
        return response.json();
    })
])
    .then(([analyses, essentials]) => {
        const slug = getPaperSlug();
        const paper = analyses.find(item => item.slug === slug) || analyses[0];
        const essential = essentials.find(item => item.slug === paper.slug);
        if(!paper) throw new Error('No reading data available');
        renderReading(paper, essential);
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
