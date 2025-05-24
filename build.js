const fs = require('fs');
const path = require('path');

const CHAPTER_DIR = path.join(__dirname, 'chapters');
const METADATA_PATH = path.join(CHAPTER_DIR, 'metadata.json');

function generateMetadata() {
    const chapters = fs.readdirSync(CHAPTER_DIR)
        .filter(file => file.endsWith('.txt'))
        .sort((a, b) => a.localeCompare(b, 'zh-Hans'))
        .map(file => {
            const filePath = path.join(CHAPTER_DIR, file);
            const content = fs.readFileSync(filePath, 'utf8');
            return {
                path: `chapters/${file}`.replace(/\\/g, '/'), // 兼容Windows路径
                title: content.match(/【标题】\s*(.+)/)?.[1] || '未命名章节',
                wordCount: content.length
            };
        });

    fs.writeFileSync(METADATA_PATH, JSON.stringify({ chapters }, null, 2));
    console.log(`✅ 已生成 ${chapters.length} 个章节的元数据`);
}

try {
    generateMetadata();
} catch (error) {
    console.error('生成失败:', error.message);
    process.exit(1);
}