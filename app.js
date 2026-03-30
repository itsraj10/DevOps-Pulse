// ===== DevOps Pulse AI — Application Logic v2 =====

(function () {
    'use strict';

    // ===== State =====
    let bookmarks = JSON.parse(localStorage.getItem('devops-pulse-bookmarks') || '[]');
    let topicHistory = JSON.parse(localStorage.getItem('devops-pulse-topics') || '[]');
    let activeCategory = 'all';
    let currentView = 'feed';

    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    // ===== Init =====
    document.addEventListener('DOMContentLoaded', () => {
        renderArticles();
        renderDiscoverArticles();
        renderDailyLearning();
        renderTrendingTools();
        renderWeeklyDigest();
        setupEventListeners();
        showNotificationBanner();
        updateBookmarkCount();
        setLearningDate();
        setDigestWeek();
        updateRecommendedTopics();
        updateSidebarTopics();
        observeCards();
    });

    // ===== Article Card HTML Generator =====
    function createArticleCardHTML(article, i, isDiscover) {
        const isBookmarked = bookmarks.includes(article.id);
        return `
            <div class="${isDiscover ? 'discover-card article-card' : 'article-card'}" data-id="${article.id}" style="animation-delay: ${i * 0.06}s" onclick="window.handleArticleClick(${article.id}, ${isDiscover})">
                <div class="card-image-wrapper">
                    <img class="card-image" src="${article.image}" alt="${article.title}" loading="lazy" onerror="this.style.display='none'">
                    <div class="card-image-overlay"></div>
                    <div class="card-reading-time">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        ${article.readingTime}
                    </div>
                    <div class="card-source-badge">${article.sourceIcon} ${article.source}</div>
                    ${article.type === 'showcase' ? '<div class="card-type-badge">Showcase</div>' : ''}
                </div>
                <div class="card-body">
                    <h3 class="card-title">${article.title}</h3>
                    <div class="card-meta">
                        <span>${article.publishedAt}</span>
                        <span class="card-meta-dot"></span>
                        <span>${article.readingTime} read</span>
                    </div>
                    <p class="card-summary">${article.summaryPreview}</p>
                    <div class="card-tags">
                        ${article.tags.map(t => `<span class="card-tag tag-${t}" onclick="event.stopPropagation(); window.filterByTag('${t}')">${getTagLabel(t)}</span>`).join('')}
                    </div>
                    <div class="card-footer">
                        <div class="card-ai-badge">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                            AI Analyzed
                        </div>
                        <button class="card-bookmark-btn ${isBookmarked ? 'bookmarked' : ''}" onclick="event.stopPropagation(); window.toggleBookmark(${article.id})" title="Bookmark">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="${isBookmarked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                        </button>
                    </div>
                </div>
            </div>`;
    }

    // ===== Render Articles =====
    function renderArticles(filter, searchQuery) {
        filter = filter || activeCategory;
        searchQuery = searchQuery || '';
        const grid = $('#articles-grid');
        let filtered = [...ARTICLES];

        if (filter !== 'all') {
            filtered = filtered.filter(a => a.category === filter || a.tags.includes(filter));
        }
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(a =>
                a.title.toLowerCase().includes(q) ||
                a.tags.some(t => t.includes(q)) ||
                a.summaryPreview.toLowerCase().includes(q) ||
                a.source.toLowerCase().includes(q)
            );
        }

        if (filtered.length === 0) {
            grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <p>No articles found. Try a different filter.</p></div>`;
            $('#article-count').textContent = '0 articles';
            return;
        }

        grid.innerHTML = filtered.map((a, i) => createArticleCardHTML(a, i, false)).join('');
        $('#article-count').textContent = `${filtered.length} articles`;
    }

    // ===== Render Discover Articles =====
    function renderDiscoverArticles(filter) {
        const grid = $('#discover-grid');
        let items = [...DISCOVER_ARTICLES];
        if (filter && filter !== 'all') {
            items = items.filter(a => a.category === filter || a.tags.includes(filter));
        }
        if (items.length === 0) {
            grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><p>No discover articles for this topic.</p></div>';
            return;
        }
        grid.innerHTML = items.map((a, i) => createArticleCardHTML(a, i, true)).join('');
    }

    // ===== Render Bookmarks =====
    function renderBookmarks() {
        const grid = $('#bookmarks-grid');
        const all = [...ARTICLES, ...DISCOVER_ARTICLES];
        const bookmarked = all.filter(a => bookmarks.includes(a.id));
        if (bookmarked.length === 0) {
            grid.innerHTML = `<div class="empty-state"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg><p>No bookmarks yet. Save articles to read later!</p></div>`;
            return;
        }
        grid.innerHTML = bookmarked.map((a, i) => createArticleCardHTML(a, i, false)).join('');
    }

    // ===== Render Daily Learning =====
    function renderDailyLearning() {
        $('#learning-grid').innerHTML = DAILY_LEARNING.map(item => `
            <div class="learning-card">
                <div class="learning-icon">${item.icon}</div>
                <div class="learning-label">${item.type}</div>
                <h4 class="learning-title">${item.title}</h4>
                <p class="learning-desc">${item.description}</p>
            </div>`).join('');
    }

    // ===== Render Trending Tools =====
    function renderTrendingTools() {
        $('#tools-grid').innerHTML = TRENDING_TOOLS.map(tool => `
            <div class="tool-card" onclick="window.filterByTag('${tool.category.toLowerCase().replace(/\s+/g, '')}')">
                <div class="tool-icon">${tool.icon}</div>
                <div class="tool-name">${tool.name}</div>
                <div class="tool-desc">${tool.desc}</div>
                <span class="tool-category">${tool.category}</span>
            </div>`).join('');
    }

    // ===== Render Weekly Digest =====
    function renderWeeklyDigest() {
        $('#digest-content').innerHTML = WEEKLY_DIGEST.map((item, i) => `
            <div class="digest-item">
                <div class="digest-item-header">
                    <span class="digest-item-number">${i + 1}</span>
                    <span class="digest-item-title">${item.title}</span>
                </div>
                <p class="digest-item-desc">${item.desc}</p>
            </div>`).join('');
    }

    // ===== Article Click Handler + Topic Memory =====
    window.handleArticleClick = function (id, isDiscover) {
        const allArticles = [...ARTICLES, ...DISCOVER_ARTICLES];
        const article = allArticles.find(a => a.id === id);
        if (!article) return;

        // Remember topics
        if (article.tags) {
            article.tags.forEach(tag => {
                if (!topicHistory.includes(tag)) {
                    topicHistory.unshift(tag);
                    if (topicHistory.length > 15) topicHistory.pop();
                }
            });
            localStorage.setItem('devops-pulse-topics', JSON.stringify(topicHistory));
            updateRecommendedTopics();
            updateSidebarTopics();
        }

        // If discover article (no AI summary), open the link directly
        if (isDiscover && !article.aiSummary) {
            window.open(article.url, '_blank', 'noopener,noreferrer');
            return;
        }

        openArticleModal(id);
    };

    // ===== Article Modal =====
    function openArticleModal(id) {
        const allArticles = [...ARTICLES, ...DISCOVER_ARTICLES];
        const article = allArticles.find(a => a.id === id);
        if (!article) return;

        const body = $('#modal-body');
        const isBookmarked = bookmarks.includes(article.id);

        body.innerHTML = `
            <h2 class="modal-title">${article.title}</h2>
            <div class="modal-source">
                <span>${article.sourceIcon} ${article.source}</span>
                <span>•</span>
                <span>${article.publishedAt}</span>
                <span>•</span>
                <span>${article.readingTime} read</span>
            </div>
            ${article.aiSummary ? `
            <div class="modal-section">
                <div class="modal-section-title">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                    AI Summary
                </div>
                <ul class="modal-summary-list">
                    ${article.aiSummary.map(s => `<li>${s}</li>`).join('')}
                </ul>
            </div>
            <div class="modal-section">
                <div class="modal-section-title">🎯 Why This Matters for DevOps Engineers</div>
                <div class="modal-insight-box"><p>${article.whyItMatters}</p></div>
            </div>
            <div class="modal-section">
                <div class="modal-section-title">🔍 Key Technical Insights</div>
                <div class="modal-insight-box"><p>${article.keyInsights}</p></div>
            </div>
            <div class="modal-section">
                <div class="modal-section-title">🛠️ Practical Takeaway</div>
                <div class="modal-insight-box" style="background: rgba(16,185,129,0.06); border-color: rgba(16,185,129,0.12);">
                    <p>${article.practicalTakeaway}</p>
                </div>
            </div>` : `
            <div class="modal-section">
                <div class="modal-insight-box"><p>${article.summaryPreview}</p></div>
            </div>`}
            <div class="modal-tags">
                ${article.tags.map(t => `<span class="card-tag tag-${t}">${getTagLabel(t)}</span>`).join('')}
            </div>
            <div class="modal-cta">
                <a href="${article.url}" target="_blank" rel="noopener noreferrer" class="btn-primary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    Read Full Article
                </a>
                <button class="btn-secondary" onclick="window.toggleBookmark(${article.id})">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="${isBookmarked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                    ${isBookmarked ? 'Bookmarked' : 'Bookmark'}
                </button>
            </div>`;

        $('#modal-overlay').classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    window.openArticleModal = openArticleModal;

    function closeModal() {
        $('#modal-overlay').classList.remove('active');
        document.body.style.overflow = '';
    }

    // ===== Bookmarks =====
    window.toggleBookmark = function (id) {
        const idx = bookmarks.indexOf(id);
        if (idx > -1) { bookmarks.splice(idx, 1); showToast('Bookmark removed'); }
        else { bookmarks.push(id); showToast('Article bookmarked! ✨'); }
        localStorage.setItem('devops-pulse-bookmarks', JSON.stringify(bookmarks));
        updateBookmarkCount();
        renderArticles();
        renderDiscoverArticles(activeCategory);
        if (currentView === 'bookmarks') renderBookmarks();
    };

    function updateBookmarkCount() {
        const el = $('#bookmark-count');
        el.textContent = bookmarks.length;
        el.classList.toggle('visible', bookmarks.length > 0);
    }

    // ===== Tag Click → Filter + Topic Memory =====
    window.filterByTag = function (tag) {
        // Add to topic history
        if (!topicHistory.includes(tag)) {
            topicHistory.unshift(tag);
            if (topicHistory.length > 15) topicHistory.pop();
            localStorage.setItem('devops-pulse-topics', JSON.stringify(topicHistory));
        }

        // Set filter
        activeCategory = tag;
        $$('.filter-pill').forEach(p => {
            p.classList.toggle('active', p.dataset.category === tag);
        });

        // If no pill matched, activate 'all' and just filter
        const matched = $(`.filter-pill[data-category="${tag}"]`);
        if (!matched) {
            $$('.filter-pill').forEach(p => p.classList.remove('active'));
        }

        showSection('feed');
        renderArticles(tag);
        renderDiscoverArticles(tag);
        updateRecommendedTopics();
        updateSidebarTopics();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ===== Recommended Topics =====
    function updateRecommendedTopics() {
        const section = $('#recommended-section');
        const container = $('#recommended-tags');
        if (topicHistory.length === 0) {
            section.classList.add('hidden');
            return;
        }

        // Get related topics from history
        const relatedSet = new Set();
        topicHistory.slice(0, 5).forEach(topic => {
            const related = TOPIC_RELATIONS[topic];
            if (related) related.forEach(r => {
                if (!topicHistory.includes(r)) relatedSet.add(r);
            });
        });

        const recommended = Array.from(relatedSet).slice(0, 6);
        if (recommended.length === 0) {
            section.classList.add('hidden');
            return;
        }

        section.classList.remove('hidden');
        container.innerHTML = recommended.map(t => `
            <span class="recommended-tag" onclick="window.filterByTag('${t}')">
                ${getTagLabel(t)}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </span>`).join('');
    }

    // ===== Sidebar Topics =====
    function updateSidebarTopics() {
        const container = $('#sidebar-topics');
        if (topicHistory.length === 0) {
            container.innerHTML = '';
            return;
        }
        container.innerHTML = `
            <div class="sidebar-title" style="margin-top:20px;">Recent Topics</div>
            <div style="margin-top:8px;">
                ${topicHistory.slice(0, 8).map(t => `<span class="sidebar-topic-tag" onclick="window.filterByTag('${t}')">${getTagLabel(t)}</span>`).join('')}
            </div>`;
    }

    // ===== Search =====
    function openSearch() {
        $('#search-overlay').classList.add('active');
        setTimeout(() => $('#search-modal-input').focus(), 100);
        document.body.style.overflow = 'hidden';
    }

    function closeSearch() {
        $('#search-overlay').classList.remove('active');
        $('#search-modal-input').value = '';
        document.body.style.overflow = '';
    }

    function performSearch(query) {
        const results = $('#search-results');
        if (!query.trim()) {
            results.innerHTML = '<div class="search-empty">Type to search DevOps topics...</div>';
            return;
        }
        const q = query.toLowerCase();
        const all = [...ARTICLES, ...DISCOVER_ARTICLES];
        const matched = all.filter(a =>
            a.title.toLowerCase().includes(q) ||
            a.tags.some(t => t.includes(q)) ||
            a.summaryPreview.toLowerCase().includes(q) ||
            a.source.toLowerCase().includes(q)
        );

        if (matched.length === 0) {
            results.innerHTML = `<div class="search-empty">No results for "${query}"</div>`;
            return;
        }

        results.innerHTML = matched.map(a => `
            <div class="search-result-item" onclick="window.handleArticleClick(${a.id}, ${!!a.type}); document.getElementById('search-overlay').classList.remove('active'); document.body.style.overflow='';">
                <div class="search-result-icon">${a.sourceIcon}</div>
                <div class="search-result-text">
                    <div class="search-result-title">${a.title}</div>
                    <div class="search-result-source">${a.source} · ${a.publishedAt}${a.type === 'showcase' ? ' · 🔗 Showcase' : ''}</div>
                </div>
            </div>`).join('');
    }

    // ===== Section Navigation =====
    function showSection(section) {
        currentView = section;
        const allSections = ['feed-section', 'discover-section', 'learning-section', 'tools-section', 'bookmarks-section', 'digest-section'];
        const homeSections = ['feed-section', 'discover-section', 'learning-section', 'tools-section'];

        // Update sidebar active
        $$('.sidebar-link').forEach(l => l.classList.remove('active'));
        $(`.sidebar-link[data-section="${section}"]`)?.classList.add('active');

        // Update nav btn active
        $$('.nav-btn').forEach(b => b.classList.remove('active-nav'));

        const heroEl = $('#hero-section');
        const filterEl = $('#filter-section');
        const breakingEl = $('#breaking-news');
        const recEl = $('#recommended-section');

        if (section === 'feed') {
            allSections.forEach(s => { $(`#${s}`).classList.toggle('hidden', !homeSections.includes(s)); });
            heroEl.classList.remove('hidden');
            filterEl.classList.remove('hidden');
            breakingEl.classList.remove('hidden');
            if (topicHistory.length > 0) recEl.classList.remove('hidden');
            $('#home-btn').classList.add('active-nav');
        } else if (section === 'discover') {
            allSections.forEach(s => { $(`#${s}`).classList.toggle('hidden', s !== 'discover-section'); });
            heroEl.classList.add('hidden'); filterEl.classList.remove('hidden'); breakingEl.classList.add('hidden'); recEl.classList.add('hidden');
        } else if (section === 'learning') {
            allSections.forEach(s => { $(`#${s}`).classList.toggle('hidden', s !== 'learning-section'); });
            heroEl.classList.add('hidden'); filterEl.classList.add('hidden'); breakingEl.classList.add('hidden'); recEl.classList.add('hidden');
        } else if (section === 'tools') {
            allSections.forEach(s => { $(`#${s}`).classList.toggle('hidden', s !== 'tools-section'); });
            heroEl.classList.add('hidden'); filterEl.classList.add('hidden'); breakingEl.classList.add('hidden'); recEl.classList.add('hidden');
        } else if (section === 'bookmarks') {
            renderBookmarks();
            allSections.forEach(s => { $(`#${s}`).classList.toggle('hidden', s !== 'bookmarks-section'); });
            heroEl.classList.add('hidden'); filterEl.classList.add('hidden'); breakingEl.classList.add('hidden'); recEl.classList.add('hidden');
            $('#bookmark-toggle').classList.add('active-nav');
        } else if (section === 'digest') {
            allSections.forEach(s => { $(`#${s}`).classList.toggle('hidden', s !== 'digest-section'); });
            heroEl.classList.add('hidden'); filterEl.classList.add('hidden'); breakingEl.classList.add('hidden'); recEl.classList.add('hidden');
            $('#digest-btn').classList.add('active-nav');
        }

        closeSidebar();
    }

    // ===== Home =====
    function goHome() {
        activeCategory = 'all';
        $$('.filter-pill').forEach(p => p.classList.toggle('active', p.dataset.category === 'all'));
        renderArticles('all');
        renderDiscoverArticles();
        showSection('feed');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ===== Sidebar =====
    function openSidebar() { $('#sidebar').classList.add('active'); $('#sidebar-overlay').classList.add('active'); }
    function closeSidebar() { $('#sidebar').classList.remove('active'); $('#sidebar-overlay').classList.remove('active'); }

    // ===== Notification =====
    function showNotificationBanner() {
        const rand = NOTIFICATIONS[Math.floor(Math.random() * NOTIFICATIONS.length)];
        $('#notification-text').textContent = rand;
        $('#notification-banner').classList.remove('hidden');
        setTimeout(() => {
            const nb = $('#notification-banner');
            if (nb && !nb.classList.contains('hidden')) nb.classList.add('hidden');
        }, 8000);
    }
    window.closeBanner = function () { $('#notification-banner').classList.add('hidden'); };

    // ===== Refresh =====
    function refreshFeed() {
        const btn = $('#refresh-btn');
        btn.classList.add('spinning');
        const grid = $('#articles-grid');
        grid.classList.add('feed-loading');

        setTimeout(() => {
            btn.classList.remove('spinning');
            grid.classList.remove('feed-loading');
            const shuffled = [...ARTICLES].sort(() => Math.random() - 0.5);
            ARTICLES.length = 0;
            ARTICLES.push(...shuffled);
            renderArticles();
            renderDiscoverArticles(activeCategory);
            showToast('Feed refreshed! 🔄');
        }, 800);
    }

    // ===== Toast =====
    function showToast(message) {
        const toast = $('#toast');
        $('#toast-message').textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2500);
    }

    // ===== Helpers =====
    function getTagLabel(tag) {
        const labels = {
            kubernetes: '☸️ Kubernetes', cloud: '☁️ Cloud', security: '🔒 Security',
            devops: '🔧 DevOps', docker: '🐳 Docker', cicd: '🚀 CI/CD',
            ai: '🤖 AI', sre: '📊 SRE', linux: '🐧 Linux', platform: '🏗️ Platform',
            aws: '☁️ AWS', azure: '☁️ Azure', gcp: '☁️ GCP',
            terraform: '🏗️ Terraform', gitops: '🔀 GitOps'
        };
        return labels[tag] || tag;
    }

    function setLearningDate() {
        $('#learning-date').textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }

    function setDigestWeek() {
        const now = new Date();
        const oneJan = new Date(now.getFullYear(), 0, 1);
        const week = Math.ceil(((now - oneJan) / 86400000 + oneJan.getDay() + 1) / 7);
        $('#digest-week').textContent = `Week ${week}, ${now.getFullYear()}`;
    }

    // ===== Intersection Observer =====
    function observeCards() {
        if (!('IntersectionObserver' in window)) return;
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        setTimeout(() => {
            $$('.learning-card, .tool-card').forEach(card => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                card.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                observer.observe(card);
            });
        }, 500);
    }

    // ===== Event Listeners =====
    function setupEventListeners() {
        // Home button
        $('#home-btn').addEventListener('click', goHome);
        $('#home-logo').addEventListener('click', goHome);

        // Refresh
        $('#refresh-btn').addEventListener('click', refreshFeed);

        // Bookmarks nav
        $('#bookmark-toggle').addEventListener('click', () => showSection('bookmarks'));

        // Digest nav
        $('#digest-btn').addEventListener('click', () => showSection('digest'));

        // Modal
        $('#modal-close').addEventListener('click', closeModal);
        $('#modal-overlay').addEventListener('click', (e) => { if (e.target === e.currentTarget) closeModal(); });

        // Search
        $('#search-bar').addEventListener('click', openSearch);
        $('#search-input').addEventListener('focus', openSearch);
        $('#search-close').addEventListener('click', closeSearch);
        $('#search-overlay').addEventListener('click', (e) => { if (e.target === e.currentTarget) closeSearch(); });
        $('#search-modal-input').addEventListener('input', (e) => performSearch(e.target.value));

        // Search tags
        $$('.search-tag').forEach(tag => {
            tag.addEventListener('click', () => {
                const t = tag.dataset.tag;
                $('#search-modal-input').value = t;
                performSearch(t);
            });
        });

        // Category filters
        $$('.filter-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                $$('.filter-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                activeCategory = pill.dataset.category;
                renderArticles(activeCategory);
                renderDiscoverArticles(activeCategory);

                // Topic memory
                if (activeCategory !== 'all' && !topicHistory.includes(activeCategory)) {
                    topicHistory.unshift(activeCategory);
                    if (topicHistory.length > 15) topicHistory.pop();
                    localStorage.setItem('devops-pulse-topics', JSON.stringify(topicHistory));
                    updateRecommendedTopics();
                    updateSidebarTopics();
                }
            });
        });

        // Sidebar
        $('#mobile-menu-btn').addEventListener('click', openSidebar);
        $('#sidebar-close').addEventListener('click', closeSidebar);
        $('#sidebar-overlay').addEventListener('click', closeSidebar);

        // Sidebar links
        $$('.sidebar-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                showSection(link.dataset.section);
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
            if (e.key === 'Escape') { closeSearch(); closeModal(); }
        });
    }

})();
