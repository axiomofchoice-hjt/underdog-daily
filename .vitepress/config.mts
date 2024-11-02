import { defineConfig } from 'vitepress';
import { RSSOptions, RssPlugin } from 'vitepress-plugin-rss';
import fs from 'fs';

let articles: string[] = [];
fs.readdirSync('./daily').forEach(file => {
  if (file !== 'index.md') {
    articles.push(file.slice(0, file.length - 3));  // remove suffix '.md'
  }
});
articles.sort();
let sidebar: { text: string, items: { text: string, link: string; }[]; }[] = [];
articles.forEach(article => {
  let month = article.slice(0, article.lastIndexOf('-'));
  if (sidebar.length == 0 || sidebar[sidebar.length - 1].text != month) {
    sidebar.push({ text: month, items: [] });
  }
  sidebar[sidebar.length - 1].items.push({
    text: article,
    link: `/daily/${article}`
  });
});

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "败犬日报",
  description: "C++ Underdog Daily",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Latest', link: `/daily/${articles[articles.length - 1]}` }
    ],

    sidebar,

    socialLinks: [
      { icon: 'github', link: 'https://github.com/axiomofchoice-hjt/underdog-daily' }
    ],
    search: {
      provider: 'local'
    }
  },
  vite: {
    plugins: [
      RssPlugin({
        title: '败犬日报',
        baseUrl: 'https://underdog-daily.pages.dev',
        copyright: 'Copyright (c) 2024-present, 败犬日报',
        description: 'C++ 败犬日报',
      })
    ]
  },
  markdown: {
    lineNumbers: true,
    math: true
  },
  cleanUrls: true
});
