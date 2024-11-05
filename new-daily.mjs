import matter from 'gray-matter';
import fs from 'fs';
import path from 'path';
import dayjs from 'dayjs';

function getLatest() {
  let latest = "";
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
  return latest;
}

var yesterday = dayjs(getLatest().replace('.src', '').replace('.md', ''));
var today = yesterday.add(1, 'day');
// update src/<yesterday>.md
{
  const file = 'src/' + yesterday.format("YYYY/MM/DD") + ".md";
  const str = fs.readFileSync(file, { encoding: 'utf8' });
  let mat = matter(str);
  mat.data.next = {
    text: '败犬日报 ' + today.format("YYYY-MM-DD"),
    link: today.format("YYYY/MM/DD")
  };
  fs.writeFileSync(file, matter.stringify(mat.content, mat.data), { encoding: 'utf8' });
}
// create src/<today>.md
{
  const file = 'src/' + today.format("YYYY/MM/DD") + ".md";
  fs.mkdirSync("src/" + today.format("YYYY/MM"), { recursive: true });
  fs.writeFileSync(file, matter.stringify('\n# {{ $frontmatter.title }}\n\n[[toc]]\n', {
    title: '败犬日报 ' + today.format("YYYY-MM-DD"),
    prev: {
      text: '败犬日报 ' + yesterday.format("YYYY-MM-DD"),
      link: yesterday.format("YYYY/MM/DD")
    },
    next: false
  }), { encoding: 'utf8' });
  console.log(path.resolve(file));
}
// update src/index.md
{
  const file = 'src/index.md';
  const str = fs.readFileSync(file, { encoding: 'utf8' });
  let mat = matter(str);
  mat.data.hero.actions[0].link = today.format("YYYY/MM/DD");
  fs.writeFileSync(file, matter.stringify(mat.content, mat.data), { encoding: 'utf8' });
}
