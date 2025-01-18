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
    result.push(path.relative(root, dir.slice(0, -3)).replaceAll('\\', '/'));
  }
  return result;
}

function isNumericString(str: string): boolean {
  for (let i = 0; i < str.length; i++) {
    if (str.charCodeAt(i) < 48 || str.charCodeAt(i) > 57) {
      return false;
    }
  }
  return true;
}

function isNumericFileName(str: string): boolean {
  return isNumericString(path.basename(str));
}

export default (root: string) => {
  let result = recurse(root, root);
  result.sort((dir1: string, dir2: string) => { // index 排在前面
    if (isNumericFileName(dir1) != isNumericFileName(dir2)) {
      return +isNumericFileName(dir1) - +isNumericFileName(dir2);
    }
    return dir1.localeCompare(dir2);
  });
  return result;
};
