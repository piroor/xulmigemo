/*
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
'use strict';

import {
  configs
} from '/common/common.js';
import * as Constants from '/common/constants.js';

import '/extlib/l10n.js';
import Scroll from '/extlib/scroll.js';
import { DOMUpdater } from '/extlib/dom-updater.js';
import Places from '/common/places.js';

const mPlaces = new Places();

//let gStyleVariables;
let mField;
let mProgress;
let mResults;
let mPageSelection;
let mCurrentTab;

window.addEventListener('DOMContentLoaded', async () => {
  //gStyleVariables = document.querySelector('#variables');

  mField = document.querySelector('#search-field');
  mProgress = document.querySelector('#search-progress');
  mResults = document.querySelector('#search-results');
  mResults.scroll = new Scroll(mResults, {
    duration: configs.smoothScrollDuration
  });
  mPlaces.onFound.addListener(onPlacesFound);
  mPlaces.onProgress.addListener(progress => {
    mProgress.setAttribute('value', Math.round(100 * progress));
  });

  mResults.scroll.scrollTo({ position: 0, justNow: true });
}, { once: true });

configs.$loaded.then(() => {
  document.documentElement.dataset.theme = configs.theme;
});

window.addEventListener('pageshow', async () => {
  document.addEventListener('submit', onSubmit);
  document.addEventListener('keydown', onKeyDown, { capture: true });
  mField.addEventListener('input', onInput);
  mField.addEventListener('focus', () => {
    mField.classList.add('focused');
    setTimeout(() => mField.classList.remove('focused'), 150);
  });
  mResults.addEventListener('mousedown', onItemMousedown, { capture: true });
  mResults.addEventListener('mouseup', onItemClick, { capture: true });
  mResults.addEventListener('mousemove', onMouseMove);
  mField.parentNode.addEventListener('mousemove', onMouseMove);

  document.documentElement.classList.add('building');

  mField.setAttribute('autocomplete', 'off');

  await configs.$loaded;

  if (configs.clearFieldAfterOpen &&
      configs.lastOpenTime >= 0 &&
      Date.now() - configs.lastOpenTime > configs.clearFieldAfterOpenDelay) {
    mField.value = mField.inputValue = '';
  }
  else {
    mField.value = mField.inputValue = configs.lastSearchTerm;
    mField.select();
  }

  mPageSelection = null;
  mCurrentTab = null;

  await updateUIForCurrentTab();
  if (mField.value) {
    if (mField.value == configs.lastSearchTerm &&
        configs.lastFoundPlaces) {
      const termsMatcher = configs.lastFoundTermsPattern ?
        new RegExp(configs.lastFoundTermsPattern, 'gi') :
        null;
      onPlacesFound(configs.lastFoundPlaces, { termsMatcher });
    }
    else {
      mPlaces.start(mField.value);
    }
  }

  /*
  gStyleVariables.textContent = `:root {
    --panel-width: ${gContainer.offsetWidth}px;
  }`;
  */

  document.documentElement.classList.remove('building');
  focusToField();
}, { once: true });

window.addEventListener('pagehide', () => {
  document.removeEventListener('submit', onSubmit);
  document.removeEventListener('keydown', onKeyDown, { capture: true });
  mField.removeEventListener('input', onInput);
  mResults.removeEventListener('mousedown', onItemMousedown, { capture: true });
  mResults.removeEventListener('mouseup', onItemClick, { capture: true });
  mResults.removeEventListener('mousemove', onMouseMove);
  mField.parentNode.removeEventListener('mousemove', onMouseMove);
}, { once: true });

let gLastEnterEvent;

function onSubmit(_event) {
  open({
    ...openParamsFromEvent(gLastEnterEvent),
    item: getActiveItem()
  });
  gLastEnterEvent = null;
}

function onKeyDown(event) {
  if (event.isComposing)
    return;

  mField.classList.remove('pasted');
  if (event.key == 'Enter') {
    gLastEnterEvent = event;
    return;
  }
  gLastEnterEvent = null;

  const noModifiers = (
    !event.altKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.metaKey
  );
  const activeItem = getActiveItem();
  switch (event.key) {
    case 'Escape':
      if (noModifiers)
        window.close();
      return;

    case 'ArrowUp':
      if (!noModifiers)
        return;
      if (activeItem) {
        activeItem.classList.remove('active');
        const item = activeItem.previousSibling;
        if (item) {
          item.classList.add('active');
          mResults.scroll.scrollToItem(item);
          mField.value = item.dataset.url;
        }
        else {
          mField.value = mField.inputValue;
        }
      }
      else if (mResults.hasChildNodes()) {
        mResults.lastChild.classList.add('active');
        mResults.scroll.scrollToItem(mResults.lastChild);
        mField.value = mResults.lastChild.dataset.url;
      }
      event.stopImmediatePropagation();
      event.preventDefault();
      return;

    case 'ArrowDown':
      if (!noModifiers)
        return;
      if (activeItem) {
        activeItem.classList.remove('active');
        const item = activeItem.nextSibling;
        if (item) {
          item.classList.add('active');
          mResults.scroll.scrollToItem(item);
          mField.value = item.dataset.url;
        }
        else {
          mField.value = mField.inputValue;
        }
      }
      else if (mResults.hasChildNodes()) {
        mResults.firstChild.classList.add('active');
        mResults.scroll.scrollToItem(mResults.firstChild);
        mField.value = mResults.firstChild.dataset.url;
      }
      event.stopImmediatePropagation();
      event.preventDefault();
      return;
  }
}

function onInput(event) {
  if (event.isComposing)
    return;

  const oldActive = getActiveItem();
  if (oldActive)
    oldActive.classList.remove('active');

  mField.inputValue = mField.value;

  configs.lastSearchTerm = mField.value;
  configs.lastOpenTime = -1;

  if (onInput.timeout)
    clearTimeout(onInput.timeout);
  onInput.timeout = setTimeout(() => {
    onInput.timeout = null;
    onPlacesFound([], {});
    mPlaces.start(mField.value);
  }, configs.searchThrottleTimeout);
}
onInput.timeout = null;

function onPlacesFound(places, { termsMatcher } = {}) {
  configs.lastFoundPlaces = places;
  configs.lastFoundTermsPattern = termsMatcher && termsMatcher.source;

  const range = document.createRange();
  range.selectNodeContents(mResults);
  const contents = range.createContextualFragment(places.map(place => placeToItem(place, termsMatcher)).join(''));
  range.detach();

  DOMUpdater.update(mResults, contents);
}

function placeToItem(place, termsMatcher) {
  let displayTitle = sanitizeForHTML(place.title);
  let displayUrl   = sanitizeForHTML(place.url).replace(termsMatcher, '<em>$&</em>')
  if (termsMatcher) {
    displayTitle = displayTitle.replace(termsMatcher, '<em>$&</em>');
    displayUrl   = displayUrl.replace(termsMatcher, '<em>$&</em>');
  }
  return `
    <li id="${place.url.replace(/[^a-z0-9]/gi, '_')}"
        class="${place.tab ? 'tab' : ''} ${place.bookmark ? 'bookmark' : ''}"
        data-tab-id="${place.tab && place.tab.id || 0}"
        data-url="${sanitizeForHTML(place.url)}"
        data-title="${sanitizeForHTML(place.title)}"
        title="${sanitizeForHTML(place.title)}
${sanitizeForHTML(place.url)}">
     <span class="title"><span class="label">${displayTitle}</span></span>
     <span class="url">${displayUrl}</span>
    </li>
  `.trim();
}

function sanitizeForHTML(string) {
  return string.replace(/&/g, '&amp;').replace(/\"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function openParamsFromEvent(event) {
  const params = {
    where:        configs.defaultOpenIn,
    keepOpen:     false,
    regularAction:true
  };
  if (event.altKey || event.ctrlKey || event.metaKey) {
    params.where    = configs.accelActionOpenIn;
    params.keepOpen = configs.accelActionOpenIn == Constants.kOPEN_IN_BACKGROUND_TAB;
    params.regularAction = false;
    return params;
  }

  if (event.shiftKey) {
    params.where = Constants.kOPEN_IN_WINDOW;
    params.regularAction = false;
    return params;
  }

  if (configs.recycleBlankCurrentTab &&
      configs.defaultOpenIn == Constants.kOPEN_IN_TAB &&
      (mCurrentTab.url == 'about:blank' ||
       (configs.recycleTabUrlPattern &&
        new RegExp(configs.recycleTabUrlPattern).test(mCurrentTab.url)))) {
    params.where = Constants.kOPEN_IN_CURRENT;
    return params;
  }

  return params;
}

function onItemMousedown(event) {
  let item = event.target;
  while (item.nodeType != Node.ELEMENT_NODE ||
         !item.hasAttribute('data-url')) {
    item = item.parentNode;
    if (!item)
      return;
  }
  event.preventDefault();
}

function onItemClick(event) {
  let item = event.target;
  while (item.nodeType != Node.ELEMENT_NODE ||
         !item.hasAttribute('data-url')) {
    item = item.parentNode;
    if (!item)
      return;
  }
  switch (event.button) {
    case 0:
      open({
        ...openParamsFromEvent(event),
        item,
        regularAction: true
      });
      break;

    case 1:
      open({
        where:    configs.accelActionOpenIn,
        keepOpen: configs.accelActionOpenIn == Constants.kOPEN_IN_BACKGROUND_TAB,
        item,
        regularAction: false
      });
      break;

    default:
      break;
  }
}

function onMouseMove(event) {
  const oldActive = getActiveItem();
  if (oldActive)
    oldActive.classList.remove('active');

  const hoverItem = event.target.closest('#search-results li');
  if (hoverItem)
    hoverItem.classList.add('active');
}

function getActiveItem() {
  return mResults.querySelector('li.active');
}

async function updateUIForCurrentTab() {
  try {
    mCurrentTab = (await browser.tabs.query({
      currentWindow: true,
      active: true
    }))[0];
    if (!configs.fillFieldWithSelectionText)
      return;
    const selections = await browser.tabs.executeScript(mCurrentTab.id, {
      code: `(() => {
        const focused = document.hasFocus();

        let selection = window.getSelection();
        if (selection.rangeCount > 0) {
          let selectionText = selection.toString().trim();
          if (selectionText != '')
            return { selection: selectionText, focused };
        }

        let field = document.activeElement;
        if (!field || !field.matches('input, textarea'))
          return { selection: '', focused };

        let selectionText = (field.value || '').substring(field.selectionStart || 0, field.selectionEnd || 0);
        return { selection: selectionText.trim(), focused };
      })();`,
      allFrames: true
    });
    const activeSelection = selections.filter(aSelection => aSelection.focused)[0] || selections[0];
    mPageSelection = activeSelection.selection.trim();
    if (mPageSelection != '') {
      mField.value = mField.inputValue = mPageSelection;
      mField.select();
    }
  }
  catch(_error) {
    // if it is a special tab, we cannot execute script.
    //console.log(error);
  }
}

function focusToField() {
  window.focus();
  setTimeout(() => {
    mField.focus();
    if (configs.lastOpenTime > 0)
      mField.select();
  }, configs.focusDelay);
}

async function open({ where, keepOpen, item, regularAction } = {}) {
  item = item || getActiveItem();

  if (regularAction &&
      item.dataset.tabId &&
      item.dataset.tabId != 0) {
    browser.tabs.update(parseInt(item.dataset.tabId), { active: true });
  }
  else {
    browser.history.addUrl({
      url:        item.dataset.url,
      title:      item.dataset.title,
      transition: 'typed'
    });

    const currentWindow = await browser.windows.getCurrent();
    const activeTabs    = await browser.tabs.query({ active: true, windowId: currentWindow.id });

    switch (where) {
      case Constants.kOPEN_IN_CURRENT:
        browser.tabs.update(activeTabs[0].id, { url: item.dataset.url });
        break;

      case Constants.kOPEN_IN_TAB:
      case Constants.kOPEN_IN_BACKGROUND_TAB: {
        const params = {
          windowId: currentWindow.id,
          active:   where != Constants.kOPEN_IN_BACKGROUND_TAB,
          url:      item.dataset.url
        };
        const currentUrl  = new URL(activeTabs[0].url);
        const openUrl     = new URL(item.dataset.url);
        if (currentUrl.origin && currentUrl.origin == openUrl.origin)
          params.openerTabId = activeTabs[0].id;
        browser.tabs.create(params);
      }; break;

      case Constants.kOPEN_IN_WINDOW:
        browser.windows.create({ url: item.dataset.url });
        break;
    }
  }

  configs.lastSearchTerm = mField.inputValue;

  if (!configs.closeAfterOpen || keepOpen)
    return;

  configs.lastOpenTime = Date.now();
  window.close();
}
