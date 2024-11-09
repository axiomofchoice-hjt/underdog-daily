import fs from 'fs';
import path from 'path';

function recurse(dir: string, root: string): string[] {
  const stats = fs.statSync(dir);
  let result: string[] = [];
  if (stats.isDirectory()) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      result = result.concat(recurse(path.join(dir, file), root));
    }
  }
  if (stats.isFile() && dir.endsWith(".md")) {
    result.push(path.relative(root, dir.slice(0, -3)));
  }
  return result;
}

export default (root: string) => {
  let result = recurse(root, root);
  result.sort((a: string, b: string) => { // index 排在前面
    if (a.endsWith('index') != b.endsWith('index')) {
      return +b.endsWith('index') - +a.endsWith('index');
    }
    return a.localeCompare(b);
  });
  return result;
};
