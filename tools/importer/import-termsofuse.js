/* eslint-disable */
/* global WebImporter */

// TRANSFORMER IMPORTS (no parsers — this template is pure default content)
import cleanupTransformer from './transformers/aiskillsnavigator-cleanup.js';
import sectionsTransformer from './transformers/aiskillsnavigator-sections.js';

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'termsofuse',
  description: 'Terms of Use legal page. Pure default content, no blocks.',
  urls: [
    'https://aiskillsnavigator.microsoft.com/termsofuse',
  ],
  blocks: [],
  sections: [
    { id: 'section-1', name: 'Terms', selector: ['main'], style: null, blocks: [], defaultContent: ['main'] },
  ],
};

// TRANSFORMER REGISTRY (section transformer only when >1 section)
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

export default {
  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    executeTransformers('beforeTransform', main, payload);

    // No blocks to parse for this template.

    executeTransformers('afterTransform', main, payload);

    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

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
        blocks: [],
      },
    }];
  },
};
