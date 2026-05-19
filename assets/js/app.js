        // Utility: debounce
        const debounce = (fn, delay = 200) => {
            let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
        };
        // Field mapping: resolve headers case-insensitively
        let fieldMap = {};
        const F = (name) => fieldMap[name?.toLowerCase?.()] || name;
        const displayLabels = {
            'category': 'Category 🏷️',
            'is_llm_related': 'LLM-related 🤖',
            'type': 'Type 🧩',
            'group': 'Group 🗂️',
            'publisher': 'Publisher',
            'year': 'Year',
            'title': 'Title',
            'authors': 'Authors'
        };
        let essentialPapers = [];
        const DATA_VERSION = '20260520-4';
        // Normalize helpers for boolean-like fields
        const normalizeBool = (val) => {
            const s = (val ?? '').toString().trim().toLowerCase();
            if(['1','true','yes','y','t'].includes(s)) return 'true';
            if(['0','false','no','n','f'].includes(s)) return 'false';
            return s;
        };
        // HTML escape function to prevent XSS
        const escapeHtml = (text) => {
            if (!text) return text;
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        };
        const normalizeTitle = (text) => (text || '')
            .toString()
            .toLowerCase()
            .replace(/[’‘]/g, "'")
            .replace(/\s+/g, ' ')
            .trim();
        // Night/Day mode toggle
        const toggleBtn = document.getElementById('toggleModeBtn');
        if (!toggleBtn) {
            console.warn('Toggle button not found');
        } else {
            toggleBtn.onclick = () => {
                document.body.classList.toggle('dark');
                toggleBtn.innerHTML = document.body.classList.contains('dark') ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
                localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
            };
            if(localStorage.getItem('theme') === 'dark') {
                document.body.classList.add('dark');
                toggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
            }
        }

        // Fetch and parse the canonical CSV once.
        async function fetchCSV() {
            const loader = document.getElementById('loader');
            loader.classList.add('active');
            try {
                const response = await fetch(`data/papers.csv?v=${DATA_VERSION}`);
                if(!response.ok) throw new Error('Failed to load data/papers.csv');
                return parseCSV(await response.text());
            } finally {
                loader.classList.remove('active');
            }
        }
        async function fetchEssentialPapers() {
            const response = await fetch(`data/essential-papers.json?v=${DATA_VERSION}`);
            if(!response.ok) throw new Error('Failed to load data/essential-papers.json');
            return response.json();
        }
        function parseCSV(text) {
            const lines = [];
            let currentLine = '';
            let inQuotes = false;

            // First pass: handle multi-line fields
            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                const nextChar = text[i + 1];

                if (char === '"') {
                    if (inQuotes && nextChar === '"') {
                        // Escaped quote
                        currentLine += '""';
                        i++;
                    } else {
                        currentLine += char;
                        inQuotes = !inQuotes;
                    }
                } else if ((char === '\n' || char === '\r') && !inQuotes) {
                    // End of line (not inside quotes)
                    if (currentLine.trim()) {
                        lines.push(currentLine);
                    }
                    currentLine = '';
                    // Skip \r\n combination
                    if (char === '\r' && nextChar === '\n') {
                        i++;
                    }
                } else {
                    currentLine += char;
                }
            }

            // Add last line
            if (currentLine.trim()) {
                lines.push(currentLine);
            }

            if (lines.length === 0) return [];

            // Parse header
            const headers = parseCSVLine(lines[0]);

            // Parse data rows
            return lines.slice(1).map(line => {
                const values = parseCSVLine(line);
                const obj = {};
                headers.forEach((h, i) => {
                    obj[h] = values[i] || '';
                });
                return obj;
            });
        }

        function parseCSVLine(line) {
            const result = [];
            let current = '';
            let inQuotes = false;
            let fieldStarted = false;

            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                const nextChar = line[i + 1];

                if (char === '"' && !fieldStarted) {
                    // Starting quote - enter quoted mode
                    inQuotes = true;
                    fieldStarted = true;
                } else if (char === '"' && inQuotes) {
                    if (nextChar === '"') {
                        // Escaped quote - add single quote
                        current += '"';
                        i++; // Skip next quote
                    } else {
                        // Ending quote - exit quoted mode
                        inQuotes = false;
                    }
                } else if (char === ',' && !inQuotes) {
                    // Field separator
                    result.push(current);
                    current = '';
                    fieldStarted = false;
                } else if (char !== ' ' || fieldStarted || inQuotes) {
                    // Add character (skip leading spaces unless in quotes or field started)
                    current += char;
                    if (char !== ' ') fieldStarted = true;
                }
            }

            // Add last field
            result.push(current);

            return result;
        }
        // Helper: detect which fields are categorical (for dropdown)
        function isCategorical(header, papers) {
            // Always treat these specific fields as categorical
            if(['category', 'group', 'year', 'type', 'publisher', 'is_llm_related'].includes(header.toLowerCase())) {
                return true;
            }
            // For other fields, use the original logic
            const values = Array.from(new Set(papers.map(p => p[header]).filter(Boolean)));
            return values.length > 1 && values.length <= 20 && values.every(v => v.length < 32);
        }
        // Group is now a chip-based multi-select; group button bar removed
        
        // Create filter controls
        function createFilters(papers, headers) {
            const bar = document.getElementById('filterBar');
            bar.innerHTML = '';

            // Add search box first
            const searchSection = document.createElement('div');
            searchSection.className = 'search-box';
            const searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.name = 'title';
            searchInput.placeholder = 'Search papers by title, authors, or keywords...';
            searchInput.oninput = debounce(() => { renderPapers(); updateStats(); }, 250);
            const searchIcon = document.createElement('i');
            searchIcon.className = 'fa-solid fa-search';
            searchSection.appendChild(searchInput);
            searchSection.appendChild(searchIcon);
            bar.appendChild(searchSection);

            // Create filter sections for button-based filters
            const chipFilters = ['group', 'category', 'type', 'is_llm_related'];
            chipFilters.forEach(fieldName => {
                const key = F(fieldName);
                if(key && headers.includes(key)) {
                    let rawValues = papers.map(p => p[key]).filter(v => v !== undefined && v !== null && String(v).trim() !== '');
                    if(fieldName === 'is_llm_related') {
                        rawValues = rawValues.map(v => normalizeBool(v));
                        const hasTrue = rawValues.includes('true');
                        const hasFalse = rawValues.includes('false');
                        const values = [];
                        if(hasTrue) values.push('Yes');
                        if(hasFalse) values.push('No');
                        if(values.length) {
                            createChipFilterSection(bar, key, values, displayLabels[fieldName] || key);
                            return;
                        }
                    }
                    const values = Array.from(new Set(rawValues)).sort();
                    if(values.length > 0) {
                        createChipFilterSection(bar, key, values, displayLabels[fieldName] || key);
                    }
                }
            });

            // Add year and publisher dropdowns
            ['year', 'publisher'].forEach(fieldName => {
                const key = F(fieldName);
                if(key && headers.includes(key)) {
                    const values = Array.from(new Set(papers.map(p => p[key]).filter(Boolean))).sort((a,b) => {
                        if(fieldName === 'year') return parseInt(b) - parseInt(a);
                        return a.localeCompare(b);
                    });
                    if(values.length > 0) {
                        const section = document.createElement('div');
                        section.className = 'filter-group';

                        const label = document.createElement('label');
                        label.className = 'filter-label';
                        label.textContent = displayLabels[fieldName] || key;
                        section.appendChild(label);

                        // Create custom select
                        const customSelect = createCustomSelect(key, values, displayLabels[fieldName] || key);
                        section.appendChild(customSelect);
                        bar.appendChild(section);
                    }
                }
            });
        }

        // Create custom select dropdown
        function createCustomSelect(name, options, label) {
            const container = document.createElement('div');
            container.className = 'custom-select';
            container.dataset.name = name;

            const trigger = document.createElement('div');
            trigger.className = 'select-trigger';
            trigger.innerHTML = `
                <span class="select-value">All ${label}</span>
                <i class="fa-solid fa-chevron-down"></i>
            `;

            const dropdown = document.createElement('div');
            dropdown.className = 'select-dropdown';

            // Add "All" option
            const allOption = document.createElement('div');
            allOption.className = 'select-option selected';
            allOption.dataset.value = '';
            allOption.textContent = `All ${label}`;
            allOption.onclick = () => selectOption(container, '', `All ${label}`);
            dropdown.appendChild(allOption);

            // Add other options
            options.forEach(opt => {
                const option = document.createElement('div');
                option.className = 'select-option';
                option.dataset.value = opt;
                option.textContent = opt;
                option.onclick = () => selectOption(container, opt, opt);
                dropdown.appendChild(option);
            });

            trigger.onclick = (e) => {
                e.stopPropagation();
                const wasActive = trigger.classList.contains('active');

                // Close all other dropdowns
                document.querySelectorAll('.select-trigger.active').forEach(t => {
                    t.classList.remove('active');
                    t.nextElementSibling.classList.remove('active');
                });

                if(!wasActive) {
                    trigger.classList.add('active');
                    dropdown.classList.add('active');
                }
            };

            container.appendChild(trigger);
            container.appendChild(dropdown);

            return container;
        }

        function selectOption(container, value, text) {
            const trigger = container.querySelector('.select-trigger');
            const valueSpan = trigger.querySelector('.select-value');
            const dropdown = container.querySelector('.select-dropdown');

            valueSpan.textContent = text;
            container.dataset.value = value;

            // Update selected state
            dropdown.querySelectorAll('.select-option').forEach(opt => {
                opt.classList.toggle('selected', opt.dataset.value === value);
            });

            // Close dropdown
            trigger.classList.remove('active');
            dropdown.classList.remove('active');

            // Trigger filter update
            renderPapers();
            updateStats();
        }

        // Close dropdowns when clicking outside
        document.addEventListener('click', () => {
            document.querySelectorAll('.select-trigger.active').forEach(trigger => {
                trigger.classList.remove('active');
                trigger.nextElementSibling.classList.remove('active');
            });
        });

        // Create chip-based multi-select filter section
        function createChipFilterSection(container, actualFieldName, values, labelText) {
            const section = document.createElement('div');
            section.className = 'filter-group';

            const label = document.createElement('label');
            label.className = 'filter-label';
            label.textContent = labelText || actualFieldName;
            section.appendChild(label);

            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'filter-options';

            values.forEach(value => {
                const btn = document.createElement('button');
                btn.className = 'filter-btn';
                btn.dataset.field = actualFieldName;
                btn.dataset.value = value;
                btn.textContent = value;
                btn.onclick = () => {
                    btn.classList.toggle('active');
                    renderPapers();
                    updateStats();
                };
                buttonsContainer.appendChild(btn);
            });

            section.appendChild(buttonsContainer);
            container.appendChild(section);
        }
        
        // Update stats display
        function updateStats() {
            const filters = getFilters();
            const filtered = allPapers.filter(paper => matchesFilters(paper, filters));

            // Update visible count
            const statVisible = document.getElementById('statVisible');
            if(statVisible) statVisible.textContent = filtered.length;

            // Update active filters display
            const activeFiltersChips = document.getElementById('activeFiltersChips');
            const quickClearBtn = document.getElementById('quickClearBtn');

            if(activeFiltersChips) {
                const filterEntries = Object.entries(filters).filter(([k, v]) => k !== 'search' && v);

                if(filterEntries.length === 0 && !filters.search) {
                    activeFiltersChips.innerHTML = '<span class="active-filters-empty">No filters applied</span>';
                    if(quickClearBtn) quickClearBtn.classList.add('hidden');
                } else {
                    const chips = [];

                    if(filters.search) {
                        chips.push(`<span class="filter-chip">Search: "${escapeHtml(filters.search)}"</span>`);
                    }

                    filterEntries.forEach(([field, values]) => {
                        const label = displayLabels[field.toLowerCase()] || field;
                        if(Array.isArray(values)) {
                            values.forEach(v => {
                                chips.push(`<span class="filter-chip">${escapeHtml(label)}: ${escapeHtml(v)}</span>`);
                            });
                        } else {
                            chips.push(`<span class="filter-chip">${escapeHtml(label)}: ${escapeHtml(values)}</span>`);
                        }
                    });

                    activeFiltersChips.innerHTML = chips.join('');
                    if(quickClearBtn) quickClearBtn.classList.remove('hidden');
                }
            }
        }
        let allPapers = [], allHeaders = [];

        function getFilters() {
            const bar = document.getElementById('filterBar');
            const filters = {};

            // Get search input
            const searchInput = bar.querySelector('input[name="title"]');
            if(searchInput && searchInput.value) filters.search = searchInput.value;

            // Get custom select filters
            const customSelects = bar.querySelectorAll('.custom-select');
            customSelects.forEach(select => {
                const name = select.dataset.name;
                const value = select.dataset.value;
                if(value) filters[name] = value;
            });

            // Get active filter buttons (multi-select)
            const activeButtons = bar.querySelectorAll('.filter-btn.active');
            activeButtons.forEach(btn => {
                const field = btn.dataset.field;
                const value = btn.dataset.value;
                if(!filters[field]) filters[field] = [];
                filters[field].push(value);
            });

            return filters;
        }

        function matchesFilters(paper, filters) {
            return Object.entries(filters).every(([k, v]) => {
                if(k === 'search') {
                    const searchTerm = v.toLowerCase();
                    const title = (paper[F('title')] || '').toLowerCase();
                    const authors = (paper[F('authors')] || '').toLowerCase();
                    return title.includes(searchTerm) || authors.includes(searchTerm);
                }

                const key = F(k) || k;
                const kLower = k.toLowerCase();

                if(Array.isArray(v) && v.length) {
                    return v.some(val => {
                        if(kLower === 'is_llm_related') {
                            const paperVal = normalizeBool(paper[key]);
                            return (val === 'Yes' && paperVal === 'true') || (val === 'No' && paperVal === 'false');
                        }
                        return (paper[key] || '').toLowerCase() === val.toLowerCase();
                    });
                }

                if(kLower === 'is_llm_related') {
                    const paperVal = normalizeBool(paper[key]);
                    return (v === 'Yes' && paperVal === 'true') || (v === 'No' && paperVal === 'false');
                }

                return (paper[key] || '').toLowerCase().includes(v.toLowerCase());
            });
        }

        function renderPapers() {
            const filters = getFilters();
            let filtered = allPapers.filter(paper => matchesFilters(paper, filters));

            // Sort: year desc, then title asc
            filtered.sort((a,b) => {
                const ya = parseInt(a[F('year')]) || 0;
                const yb = parseInt(b[F('year')]) || 0;
                if(yb !== ya) return yb - ya;
                return (a[F('title')] || '').localeCompare(b[F('title')] || '');
            });

            const list = document.getElementById('paperList');
            if(filtered.length === 0) {
                list.innerHTML = '<div class="empty-state"><i class="fa-solid fa-search"></i><p>No papers found matching your filters</p></div>';
            } else {
                list.innerHTML = filtered.map(paper => {
                    const isLLM = normalizeBool(paper[F('is_llm_related')]) === 'true';
                    const link = paper[F('link')] || '';
                    const year = paper[F('year')] || 'N/A';
                    const publisher = paper[F('publisher')] || 'N/A';
                    const title = escapeHtml(paper[F('title')] || 'Untitled');
                    const authors = escapeHtml(paper[F('authors')] || 'Unknown');
                    const group = paper[F('group')] ? escapeHtml(paper[F('group')]) : '';
                    const category = paper[F('category')] ? escapeHtml(paper[F('category')]) : '';
                    const type = paper[F('type')] ? escapeHtml(paper[F('type')]) : '';

                    return `
                        <article class="paper-card">
                            <div class="paper-header">
                                <span class="paper-venue">${escapeHtml(publisher)} ${escapeHtml(year)}</span>
                                ${isLLM ? '<span class="llm-badge">🤖 LLM</span>' : ''}
                            </div>
                            <h3 class="paper-title">
                                ${link ? `<a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">${title}</a>` : title}
                            </h3>
                            <p class="paper-authors">${authors}</p>
                            <div class="paper-footer">
                                <div class="paper-tags">
                                    ${group ? `<span class="tag">${group}</span>` : ''}
                                    ${category ? `<span class="tag">${category}</span>` : ''}
                                    ${type ? `<span class="tag">${type}</span>` : ''}
                                </div>
                                ${link ? `<a href="${escapeHtml(link)}" target="_blank" class="paper-link">View Paper <i class="fa-solid fa-arrow-up-right-from-square"></i></a>` : ''}
                            </div>
                        </article>
                    `;
                }).join('');
            }

            updateStats();
        }
        function renderFeaturedPapers() {
            const grid = document.getElementById('featuredGrid');
            if(!grid) return;

            const byTitle = new Map();
            allPapers.forEach(paper => {
                const title = paper[F('title')];
                const key = normalizeTitle(title);
                if(key && !byTitle.has(key)) byTitle.set(key, paper);
            });

            const featured = essentialPapers.map(item => ({
                paper: byTitle.get(normalizeTitle(item.title)),
                essential: item
            }));

            if(featured.length === 0) {
                grid.innerHTML = '<div class="empty-state"><p>Featured papers will appear after the paper data loads.</p></div>';
                return;
            }

            grid.innerHTML = featured.map(({ paper, essential }, index) => {
                const rawTitle = paper?.[F('title')] || essential.title || 'Untitled';
                const link = essential.sourceUrl || paper?.[F('link')] || '';
                const year = paper?.[F('year')] || '';
                const publisher = paper?.[F('publisher')] || '';
                const meta = escapeHtml([publisher, year].filter(Boolean).join(' ') || 'Essential Paper');
                const title = escapeHtml(rawTitle);
                const authors = escapeHtml(paper?.[F('authors')] || 'Vue Tech SG study notes');
                const rawCategory = paper?.[F('category')] || '';
                const category = escapeHtml(rawCategory);
                const tags = (essential.tags || []).filter(tag => normalizeTitle(tag) !== normalizeTitle(rawCategory));
                const pdfPath = essential.pdfPath || '';
                const analysisPath = `analysis.html?paper=${encodeURIComponent(essential.slug)}`;
                const readingPath = `reading.html?paper=${encodeURIComponent(essential.slug)}`;

                return `
                    <article class="featured-card">
                        <div class="featured-meta">
                            <span class="featured-rank">${String(index + 1).padStart(2, '0')}</span>
                            <span>${meta}</span>
                        </div>
                        <h3>${link ? `<a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">${title}</a>` : title}</h3>
                        <p>${authors}</p>
                        <div class="paper-tags">
                            ${category ? `<span class="tag">${category}</span>` : ''}
                            ${tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                        </div>
                        <div class="featured-actions">
                            <a href="${escapeHtml(analysisPath)}" class="featured-link featured-link-primary"><i class="fa-solid fa-chart-simple"></i> Analysis</a>
                            <a href="${escapeHtml(readingPath)}" class="featured-link"><i class="fa-solid fa-book-open-reader"></i> Intensive Reading</a>
                            ${pdfPath ? `<a href="${escapeHtml(pdfPath)}" download class="featured-link"><i class="fa-solid fa-file-arrow-down"></i> Download PDF</a>` : '<span class="featured-link unavailable"><i class="fa-solid fa-file-circle-xmark"></i> PDF unavailable</span>'}
                            ${link ? `<a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer" class="featured-link">Source <i class="fa-solid fa-arrow-up-right-from-square"></i></a>` : ''}
                        </div>
                    </article>
                `;
            }).join('');
        }
        // Initialize
        Promise.all([fetchCSV(), fetchEssentialPapers()]).then(([papers, essentials]) => {
            if(!papers || !papers.length) throw new Error('No data');
            allPapers = papers;
            essentialPapers = essentials || [];

            // Build header map
            const headerSet = new Set();
            papers.forEach(p => Object.keys(p).forEach(k => headerSet.add(k)));
            allHeaders = Array.from(headerSet);
            fieldMap = {};
            allHeaders.forEach(h => { fieldMap[h.toLowerCase()] = h; });

            // Update total stats
            const statTotal = document.getElementById('statTotal');
            const statVisible = document.getElementById('statVisible');
            const statLLMShare = document.getElementById('statLLMShare');

            if(statTotal) statTotal.textContent = papers.length;
            if(statVisible) statVisible.textContent = papers.length;

            const llmCount = papers.filter(p => normalizeBool(p[F('is_llm_related')]) === 'true').length;
            const llmPercent = papers.length > 0 ? Math.round((llmCount / papers.length) * 100) : 0;
            if(statLLMShare) statLLMShare.textContent = `${llmPercent}%`;

            // Setup clear all button
            const quickClearBtn = document.getElementById('quickClearBtn');
            if(quickClearBtn) {
                quickClearBtn.onclick = () => {
                    const bar = document.getElementById('filterBar');

                    // Clear filter buttons
                    bar.querySelectorAll('.filter-btn.active').forEach(btn => btn.classList.remove('active'));

                    // Clear custom selects
                    bar.querySelectorAll('.custom-select').forEach(select => {
                        const trigger = select.querySelector('.select-trigger');
                        const valueSpan = trigger.querySelector('.select-value');
                        const label = select.dataset.name;
                        const displayLabel = displayLabels[label] || label;
                        valueSpan.textContent = `All ${displayLabel}`;
                        select.dataset.value = '';

                        // Update selected state
                        const dropdown = select.querySelector('.select-dropdown');
                        dropdown.querySelectorAll('.select-option').forEach(opt => {
                            opt.classList.toggle('selected', opt.dataset.value === '');
                        });
                    });

                    // Clear search input
                    bar.querySelectorAll('input').forEach(inp => inp.value = '');

                    renderPapers();
                };
            }

            createFilters(papers, allHeaders);
            renderFeaturedPapers();
            renderPapers();
        }).catch(err => {
            const list = document.getElementById('paperList');
            list.innerHTML = '<div class="empty-state"><p>Failed to load papers. Please check data files.</p></div>';
            console.error(err);
        });
