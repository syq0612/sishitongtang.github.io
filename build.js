const fs = require('fs');
const path = require('path');

const CHAPTER_DIR = './chapters';
const IGNORE_FILES = ['metadata.json'];

const generateMetadata = () => {
    const chapters = fs.readdirSync(CHAPTER_DIR)
        .filter(file => !IGNORE_FILES.includes(file))
        .sort()
        .map(file => {
            const content = fs.readFileSync(path.join(CHAPTER_DIR, file), 'utf8');
            const [meta] = content.split('\n\n');
            return {
                path: path.join(CHAPTER_DIR, file),
                part: meta.match(/【部名】 (.+)/)[1],
                title: meta.match(/【标题】 (.+)/)[1],
                wordCount: content.length
            };
        });

    fs.writeFileSync(
        path.join(CHAPTER_DIR, 'metadata.json'),
        JSON.stringify({ chapters }, null, 2)
    );
    console.log('✅ 已生成元数据文件');
};

generateMetadata();