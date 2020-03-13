/*
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
'use strict';

/* eslint-disable indent */
export const regExpPatterns = {
  '展開'     : { input : 'kak',
                 terms : ['かかく', 'かこ', 'かっか'] },
  'N1個'     : { input : 'kantoku',
                 terms : ['カントク', 'かんとく', 'ｶﾝﾄｸ'] },
  'N2個'     : { input : 'kanntoku',
                 terms : ['カントク', 'かんとく', 'ｶﾝﾄｸ'] },
  'N3個'     : { input : 'nannnin',
                 terms : ['なんニン', 'ナンニん'] },
  WE         : { input : 'werukam',
                 terms : ['ウぇるカむ', 'ウぇるカも', 'ゑるカム', 'ゑるカみ', 'werukam'] },
  '発音記号' : { input : 'dao',
                 terms : ['Dão'] },
  '音引き'   : { input : 'o-',
                 terms : ['おー', 'ｵｰ', 'オー', 'おｰ', 'お-'] },
  '漢字'     : { input : 'nihongo',
                 terms : ['日本語'] },
  '英単語'   : { input : 'hello',
                 terms : ['ハロー'] },
  openParen  : { input : '(', 
                 terms : ['(', '（'] },
  closeParen : { input : ')',
                 terms : [')', '）'] },
  openBracket :
               { input : '[',
                 terms : ['[', '［'] },
  closeBracket :
               { input : ']',
                 terms : [']', '］'] },
  JSCode     : { input : 'window.open();',
                 terms : ['window.open();'] },
  JSCodeWithParameter :
               { input : 'window.open("about:blank", "_blank", "all");',
                 terms : ['window.open("about:blank", "_blank", "all");'] }
};
/* eslint-enable indent */
