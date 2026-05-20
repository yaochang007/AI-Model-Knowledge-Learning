const SEO_VERSION = '20260520-9';

(function initSeo() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const paperSlug = new URLSearchParams(window.location.search).get('paper');

    function setMeta(selector, attributes) {
        let element = document.head.querySelector(selector);
        if(!element) {
            element = document.createElement('meta');
            document.head.appendChild(element);
        }

        Object.entries(attributes).forEach(([key, value]) => {
            if(value) element.setAttribute(key, value);
        });
    }

    function setLink(selector, attributes) {
        let element = document.head.querySelector(selector);
        if(!element) {
            element = document.createElement('link');
            document.head.appendChild(element);
        }

        Object.entries(attributes).forEach(([key, value]) => {
            if(value) element.setAttribute(key, value);
        });
    }

    function applyEntry(entry, site) {
        if(!entry) return;

        const imageUrl = new URL(entry.image || site.defaultImage, site.baseUrl).href;
        const canonicalUrl = entry.canonicalUrl || new URL(entry.path || './', site.baseUrl).href;
        const keywords = (entry.focusKeywords || []).slice(0, 5).join(', ');

        document.title = entry.title;
        setMeta('meta[name="description"]', {name: 'description', content: entry.description});
        setMeta('meta[name="keywords"]', {name: 'keywords', content: keywords});
        setMeta('meta[name="author"]', {name: 'author', content: site.author});
        setMeta('meta[name="robots"]', {name: 'robots', content: 'index, follow'});
        setLink('link[rel="canonical"]', {rel: 'canonical', href: canonicalUrl});

        setMeta('meta[property="og:site_name"]', {property: 'og:site_name', content: site.name});
        setMeta('meta[property="og:type"]', {property: 'og:type', content: 'website'});
        setMeta('meta[property="og:title"]', {property: 'og:title', content: entry.title});
        setMeta('meta[property="og:description"]', {property: 'og:description', content: entry.description});
        setMeta('meta[property="og:url"]', {property: 'og:url', content: canonicalUrl});
        setMeta('meta[property="og:image"]', {property: 'og:image', content: imageUrl});

        setMeta('meta[name="twitter:card"]', {name: 'twitter:card', content: 'summary_large_image'});
        setMeta('meta[name="twitter:title"]', {name: 'twitter:title', content: entry.title});
        setMeta('meta[name="twitter:description"]', {name: 'twitter:description', content: entry.description});
        setMeta('meta[name="twitter:image"]', {name: 'twitter:image', content: imageUrl});
    }

    function pickEntry(metadata) {
        if(currentPath === 'analysis.html') {
            return metadata.analysis?.[paperSlug] || metadata.home;
        }

        if(currentPath === 'reading.html') {
            return metadata.reading?.[paperSlug] || metadata.home;
        }

        return metadata.home;
    }

    const api = {
        metadata: null,
        applyForCurrentPage() {
            if(!api.metadata) return;
            applyEntry(pickEntry(api.metadata), api.metadata.site);
        }
    };

    window.vueTechSeo = api;

    fetch(`data/seo-metadata.json?v=${SEO_VERSION}`)
        .then(response => {
            if(!response.ok) throw new Error('Failed to load SEO metadata');
            return response.json();
        })
        .then(metadata => {
            api.metadata = metadata;
            api.applyForCurrentPage();
        })
        .catch(error => console.warn(error));
}());
