class BookReader {
    constructor() {
        this.config = {
            pageSize: 1500,      // ÿҳ�ַ���
            storageKey: 'sstt'   // �洢����
        };
        this.state = {
            currentChapter: 0,
            currentPage: 1,
            chapters: []
        };
    }

    async init() {
        await this.loadMetadata();
        this.renderTOC();
        this.loadProgress();
        this.setupEventListeners();
        this.applyNightMode();
        this.renderPage();
    }

    // ============== ���ݹ��� ==============
    async loadMetadata() {
        try {
            const response = await fetch('./chapters/metadata.json');
            const { chapters } = await response.json();
            this.state.chapters = await Promise.all(
                chapters.map(async chap => ({
                    ...chap,
                    content: await (await fetch(chap.path)).text()
                }))
            );
        } catch (error) {
            console.error('Ԫ���ݼ���ʧ��:', error);
        }
    }

    // ============== ������Ⱦ ==============
    renderTOC() {
        const list = document.getElementById('chapterList');
        list.innerHTML = this.state.chapters
            .map((chap, index) => `
                <li>
                    <button class="chapter-btn ${index === this.state.currentChapter ? 'active' : ''}" 
                            data-index="${index}">
                        ${chap.title}
                    </button>
                </li>
            `).join('');
    }

    splitContent(content) {
        const pages = [];
        let currentPage = '';
        const paragraphs = content.split(/(\n\s*\n)/g); // ���ֶܷ�

        paragraphs.forEach(para => {
            const trimmed = para.trim();
            if (!trimmed) return;

            if ((currentPage + trimmed).length > this.config.pageSize) {
                pages.push(currentPage);
                currentPage = trimmed;
            } else {
                currentPage += '\n\n' + trimmed;
            }
        });

        if (currentPage) pages.push(currentPage);
        return pages;
    }

    renderPage() {
        const chapter = this.state.chapters[this.state.currentChapter];
        if (!chapter) return;

        const pages = this.splitContent(chapter.content);
        if (pages.length === 0) return;

        // ҳ��߽����
        this.state.currentPage = Math.max(1, Math.min(this.state.currentPage, pages.length));

        document.getElementById('content').innerHTML = pages[this.state.currentPage - 1];
        document.getElementById('pageInfo').textContent =
            `��${this.state.currentPage}ҳ/��${pages.length}ҳ`;

        // ���°�ť״̬
        document.getElementById('prevPageBtn').disabled = this.state.currentPage === 1;
        document.getElementById('nextPageBtn').disabled =
            this.state.currentPage === pages.length;
    }

    // ============== ״̬���� ==============
    saveProgress() {
        localStorage.setItem(this.config.storageKey, JSON.stringify({
            chapter: this.state.currentChapter,
            page: this.state.currentPage
        }));
    }

    loadProgress() {
        const saved = JSON.parse(localStorage.getItem(this.config.storageKey));
        if (saved) {
            const validChapter = saved.chapter >= 0 && saved.chapter < this.state.chapters.length;
            const pages = this.getCurrentPages();
            const validPage = saved.page >= 1 && saved.page <= pages.length;

            if (validChapter && validPage) {
                this.state.currentChapter = saved.chapter;
                this.state.currentPage = saved.page;
            }
        }
    }

    // ============== �¼����� ==============
    setupEventListeners() {
        // Ŀ¼���
        document.querySelectorAll('.chapter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.state.currentChapter = parseInt(btn.dataset.index);
                this.state.currentPage = 1;
                this.renderPage();
                this.saveProgress();
                this.highlightCurrentChapter();
            });
        });

        // ��ҳ��ť
        document.getElementById('prevPageBtn').addEventListener('click', () => {
            if (this.state.currentPage > 1) {
                this.state.currentPage--;
                this.renderPage();
                this.saveProgress();
            }
        });

        document.getElementById('nextPageBtn').addEventListener('click', () => {
            const pages = this.getCurrentPages();
            if (this.state.currentPage < pages.length) {
                this.state.currentPage++;
                this.renderPage();
                this.saveProgress();
            }
        });

        // ҹ��ģʽ
        document.getElementById('nightModeBtn').addEventListener('click', () => {
            const isNight = document.documentElement.dataset.nightmode === 'true';
            document.documentElement.dataset.nightmode = !isNight;
            localStorage.setItem('nightMode', !isNight);
        });
    }

    // ============== ���߷��� ==============
    getCurrentPages() {
        const chapter = this.state.chapters[this.state.currentChapter];
        return chapter ? this.splitContent(chapter.content) : [];
    }

    highlightCurrentChapter() {
        document.querySelectorAll('.chapter-btn').forEach(btn =>
            btn.classList.remove('active')
        );
        document.querySelector(`.chapter-btn[data-index="${this.state.currentChapter}"]`)
            ?.classList.add('active');
    }

    applyNightMode() {
        const isNight = localStorage.getItem('nightMode') === 'true';
        document.documentElement.dataset.nightmode = isNight;
    }
}

// ��ʼ���Ķ���
const reader = new BookReader();
document.addEventListener('DOMContentLoaded', () => reader.init());