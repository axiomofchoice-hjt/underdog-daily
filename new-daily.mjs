import matter from 'gray-matter';
import fs from 'fs';
import path from 'path';
import dayjs from 'dayjs';

var latest = "";

function recurse(dir, root) {
  const stats = fs.statSync(dir);
  if (stats.isDirectory()) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      recurse(path.join(dir, file), root);
    }
  }
  if (stats.isFile() && dir.endsWith(".md") && path.basename(dir) !== 'index.md') {
    if (latest < dir) { latest = dir; }
  }
}

recurse('src', 'src');
let date = dayjs(latest.replace('.md', '')).add(1, 'day');
fs.mkdirSync("src/" + date.format("YYYY/MM"), { recursive: true });
const file = 'src/' + date.format("YYYY/MM/DD") + ".md";
fs.writeFileSync(file, `---\ntitle: 败犬日报 ${date.format("YYYY-MM-DD")}\n---\n\n# {{ $frontmatter.title }}\n\n[[toc]]\n`);
console.log(path.resolve(file));

const str = fs.readFileSync('src/index.md', { encoding: 'utf8' });
let m = matter(str);
m.data.hero.actions[0].link = date.format("YYYY/MM/DD");
fs.writeFileSync('src/index.md', matter.stringify(m.content, m.data), { encoding: 'utf8' });
