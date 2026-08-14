/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroSkillingParser from './parsers/hero-skilling.js';
import cardsPillsParser from './parsers/cards-pills.js';
import tabsAudienceParser from './parsers/tabs-audience.js';
import cardsCourseParser from './parsers/cards-course.js';
import cardsCredentialParser from './parsers/cards-credential.js';
import columnsQuoteParser from './parsers/columns-quote.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/aiskillsnavigator-cleanup.js';
import sectionsTransformer from './transformers/aiskillsnavigator-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-skilling': heroSkillingParser,
  'cards-pills': cardsPillsParser,
  'tabs-audience': tabsAudienceParser,
  'cards-course': cardsCourseParser,
  'cards-credential': cardsCredentialParser,
  'columns-quote': columnsQuoteParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'homepage',
  description: 'AI Skills Navigator landing page.',
  urls: [
    'https://aiskillsnavigator.microsoft.com/',
  ],
  blocks: [
    { name: 'hero-skilling', instances: ['div.___1ptpwvl:has(h1.fui-LargeTitle)'] },
    { name: 'cards-pills', instances: ['div.___te5d3i0'] },
    { name: 'tabs-audience', instances: ['div.fui-TabList'] },
    { name: 'cards-course', instances: ['div.fui-Carousel'] },
    { name: 'cards-credential', instances: ['div.___c1fvi20'] },
    { name: 'columns-quote', instances: ['div.___xl246q0:has(#skilling-playlist-heading)'] },
  ],
  sections: [
    { id: 'section-1', name: 'Hero', selector: ['div.___1ptpwvl:has(h1.fui-LargeTitle)'], style: null, blocks: ['hero-skilling', 'cards-pills'], defaultContent: [] },
    { id: 'section-2', name: 'Catalog intro and audience selector', selector: ['div.___8n1h8p0'], style: null, blocks: ['tabs-audience'], defaultContent: ['h2.fui-Title2'] },
    { id: 'section-3', name: 'Course carousels', selector: ['div.___8n1h8p0'], style: null, blocks: ['cards-course'], defaultContent: [] },
    { id: 'section-6', name: 'Credentials', selector: ['div:has(> #train-with-the-best-heading)'], style: null, blocks: ['cards-credential'], defaultContent: ['#train-with-the-best-heading'] },
    { id: 'section-7', name: 'Closing quote callout', selector: ['div.___xl246q0:has(#skilling-playlist-heading)'], style: null, blocks: ['columns-quote'], defaultContent: [] },
  ],
};

// TRANSFORMER REGISTRY
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      let elements = [];
      try {
        elements = document.querySelectorAll(selector);
      } catch (e) {
        console.warn(`Invalid selector for "${blockDef.name}": ${selector}`);
      }
      if (!elements.length) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({ name: blockDef.name, selector, element, section: blockDef.section || null });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    // 1. beforeTransform (cleanup + section breaks)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return; // already replaced by an earlier parser
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Sanitized path — root URL maps to /index
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
