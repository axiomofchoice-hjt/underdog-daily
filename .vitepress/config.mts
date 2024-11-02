import { defineConfig, DefaultTheme } from 'vitepress';
import { RSSOptions, RssPlugin } from 'vitepress-plugin-rss';
import getArticles from './articles.mts';
import getSidebar from './sidebar.mjs';

let articles = getArticles('src');
const sidebar = getSidebar(articles);

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "败犬日报",
  description: "C++ Underdog Daily",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Latest', link: `/${articles[articles.length - 1]}` }
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
  cleanUrls: true,
  srcDir: 'src',
});
