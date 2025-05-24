class BookReader {
    constructor() {
        this.config = {
            pageSize: 1500,      // 每页字符数
            storageKey: 'sstt'   // 存储键名
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

    // ============== 数据管理 ==============
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
            console.error('元数据加载失败:', error);
        }
    }

    // ============== 内容渲染 ==============
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
        const paragraphs = content.split(/(\n\s*\n)/g); // 智能分段

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

        // 页码边界控制
        this.state.currentPage = Math.max(1, Math.min(this.state.currentPage, pages.length));

        document.getElementById('content').innerHTML = pages[this.state.currentPage - 1];
        document.getElementById('pageInfo').textContent =
            `第${this.state.currentPage}页/共${pages.length}页`;

        // 更新按钮状态
        document.getElementById('prevPageBtn').disabled = this.state.currentPage === 1;
        document.getElementById('nextPageBtn').disabled =
            this.state.currentPage === pages.length;
    }

    // ============== 状态管理 ==============
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

    // ============== 事件监听 ==============
    setupEventListeners() {
        // 目录点击
        document.querySelectorAll('.chapter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.state.currentChapter = parseInt(btn.dataset.index);
                this.state.currentPage = 1;
                this.renderPage();
                this.saveProgress();
                this.highlightCurrentChapter();
            });
        });

        // 翻页按钮
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

        // 夜间模式
        document.getElementById('nightModeBtn').addEventListener('click', () => {
            const isNight = document.documentElement.dataset.nightmode === 'true';
            document.documentElement.dataset.nightmode = !isNight;
            localStorage.setItem('nightMode', !isNight);
        });
    }

    // ============== 工具方法 ==============
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

// 初始化阅读器
const reader = new BookReader();
document.addEventListener('DOMContentLoaded', () => reader.init());