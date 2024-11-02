import { DefaultTheme } from 'vitepress';

function recurse(sidebar: DefaultTheme.SidebarItem[], article: string[], link: string, collapsed: boolean) {
  if (article.length > 1) {
    const text = article[0];
    let item = sidebar.find((item) => item.text === text);
    if (item === undefined) {
      sidebar.push({ text, collapsed, items: [] });
      item = sidebar.at(-1);
    }
    if (item === undefined || item.items === undefined) { return; }
    item.collapsed = collapsed;
    recurse(item.items, article.slice(1), link, collapsed);
  } else {
    sidebar.push({ text: link.replaceAll('/', '-').replace('.md', ''), link });
  }
}

export default (articles: string[]) => {
  let sidebar: DefaultTheme.SidebarItem[] = [];
  articles.forEach(article => {
    recurse(sidebar, article.split("/"), article, article !== articles[articles.length - 1]);
  });
  sidebar.forEach(item => { item.collapsed = undefined; });
  return sidebar;
};
