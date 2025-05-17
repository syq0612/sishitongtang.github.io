class BookReader {
    constructor() {
        this.bookshelf = {
            currentBook: 'sishitongtang',
            currentChapter: 0,
            currentPage: 1,
            chaptersData: []
        };

        this.init();
    }

    async init() {
        await this.loadMetadata();
        this.renderTOC();
        this.loadProgress();
        this.setupEventListeners();
    }

    async loadMetadata() {
        const res = await fetch('./chapters/metadata.json');
        const { chapters } = await res.json();
        this.bookshelf.chaptersData = await Promise.all(
            chapters.map(async chap => ({
                ...chap,
                content: await (await fetch(chap.path)).text()
            }))
        );
    }

    renderTOC() {
        const toc = document.getElementById('toc');
        this.bookshelf.chaptersData.forEach((chap, index) => {
            const li = document.createElement('li');
            li.className = `chapter-item ${index === 0 ? 'active' : ''}`;
            li.innerHTML = `
                <a href="#${index}">
                    <span class="part">${chap.part}</span>
                    <span class="title">${chap.title}</span>
                </a>
            `;
            li.addEventListener('click', () => this.openChapter(index));
            toc.appendChild(li);
        });
    }

    openChapter(chapterIndex) {
        this.bookshelf.currentChapter = chapterIndex;
        this.bookshelf.currentPage = 1;
        this.renderPage();
    }

    renderPage() {
        const { content } = this.bookshelf.chaptersData[this.bookshelf.currentChapter];
        const pages = this.splitPages(content);
        document.getElementById('content').innerHTML = pages[this.bookshelf.currentPage - 1];
        this.updatePagination();
    }

    splitPages(content) {
        // 智能分页算法
        const MAX_CHARS = 1500;
        const paragraphs = content.split(/\n\s*\n/);
        let pages = [];
        let currentPage = '';

        paragraphs.forEach(para => {
            if ((currentPage + para).length > MAX_CHARS) {
                pages.push(currentPage);
                currentPage = '';
            }
            currentPage += para + '\n\n';
        });
        if (currentPage) pages.push(currentPage);
        return pages;
    }

    // 其他方法（翻页、进度保存等）需下载完整代码...
}

// 初始化阅读器
const reader = new BookReader();