/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: AI Skills Navigator (aiskillsnavigator.microsoft.com) site-wide cleanup.
 *
 * Fluent UI React SPA. Real authorable content lives inside <main>; the site
 * shell (cookie banner, header/banner, footer/contentinfo) and interactive
 * chrome (carousel prev/next arrows, "Need help?" support button) are
 * non-authorable and stripped here.
 *
 * All selectors below were verified against:
 *   - migration-work/cleaned.html (homepage)
 *   - migration-work/pages/faq/cleaned.html
 *   - migration-work/pages/termsofuse/cleaned.html
 *
 * Notes / intentionally NOT removed:
 *   - div.fui-TabList is a mapped block (tabs-audience); its labels are
 *     authorable content owned by the parser, so it is left in place.
 *   - The `fai-CopilotProvider` class appears only as a wrapper on a content
 *     <div> (home/termsofuse line 9/7) — there is no Copilot chat widget,
 *     progressbar, or spinner element in the captured DOM, so none are targeted
 *     (adding selectors for absent elements would be guessing).
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Cookie banner overlay — verified <div id="cookie-banner"> (home line 4,
    // termsofuse line 2). Empty on homepage but present as shell chrome.
    WebImporter.DOMUtils.remove(element, [
      '#cookie-banner',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Non-authorable site shell + interactive chrome. All verified in captured DOM:
    //   header  -> site banner with logo + "Sign in" (home line 11, termsofuse line 9)
    //   footer  -> contentinfo legal links (home line 1127, termsofuse line 47)
    //   .fui-CarouselNavContainer -> carousel prev/next arrow buttons (home line 102, 403, 839)
    //   .___1ky57tc -> wrapper of the single "Need help?" support button (home line 1121)
    WebImporter.DOMUtils.remove(element, [
      'header',
      'footer',
      '.fui-CarouselNavContainer',
      '.___1ky57tc',
    ]);

    // Empty Fluent tabster placeholder <i></i> elements — non-authorable
    // artifacts scattered through the SPA markup. Only remove ones with no
    // content so no authorable text is touched.
    element.querySelectorAll('i').forEach((el) => {
      if (!el.hasChildNodes() && el.textContent.trim() === '') {
        el.remove();
      }
    });
  }
}
