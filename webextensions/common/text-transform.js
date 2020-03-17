// This file is licensed under GPL2.
// See also: /license/COPYING.txt
'use strict';

const nonAsciiRegExp = /[^a-zA-Z0-9\!\_\-\?\/\\\~\|\{\}\(\)\'\"\&\%\$\<\>\[\]\@\`\+\*\;\:]/gi;

const LATIN_LETTES_WITH_MODIFIERS = `
a  [aàáâãäåāăąǎǻǟǡÀÁÂÃÄÅĀĂĄǍǺǞǠ]
ae  ae|[æǽǣÆǼǢ]
c  [cçćĉċčÇĆĈĊČ]
d  [dďđĎĐÐ]
dz  dz|[ǄǅǆǱǲǳ]
e  [eèéêëÈÉÊË]
g  [gĝğġģǵǥǧĜĞĠĢǴǤǦ]
h  [hħĥĤĦ]
i  [iìíîïĩīĭįıǐÌÍÎÏĨĪĬĮİǏ]
ij  ij|[ĳĲ]
j  [jĵǰĴ]
k  [kķĸǩĶǨ]
l  [lĺļľŀłĹĻĽĿŁ]
lj  lj|[Ǉǈǉ]
n  [nńņňŉñŃŅŇÑ]
ng  ng|[ŋŊ]
nj  nj|[ǌǋǊ]
o  [oòóôõöøǿōŏőǒǫǭÒÓÔÕÖØǾŌŎŐǑǪǬ]
oe  oe|[œŒ]
r  [rŕŗřŔŖŘ]
s  [sśŝşšŚŜŞŠ]
sz  sz|ß
t  [tţťŧŢŤŦ]
u  [uùúûüũūŭůűųǔǖǘǚǜÙÚÛÜŨŪŬŮŰŲǓǕǗǙǛ]
w  [wẁẃẅŵẀẂẄŴ]
y  [yỳýÿŷỲÝŸŶ]
z  [zźżžŹŻŽ]
`.trim();

const LATIN_LETTES_WITH_MODIFIERS_LAZY = `
a  [aàáâãäåāăąǎǻǟǡÀÁÂÃÄÅĀĂĄǍǺǞǠ]|a([ˋ\`ˊ´ˆ^˜~¨˚°ˉ¯˘˛ˇ]|˚ˊ|ˊ˚|¨[ˉ¯]|[ˉ¯]¨|˙[ˉ¯]|[ˉ¯]˙)
ae  ae|[æǽǣÆǼǢ]|(ae|[æÆ])[ˊ´ˉ¯]
c  [cçćĉċčÇĆĈĊČ]|c[¸ˊ´ˆ^˙ˇ]
d  [dďđĎĐÐ]|d[ˇ]
dz  dz|[ǄǅǆǱǲǳ]|(dz|ǅǆ)ˇ
e  [eèéêëÈÉÊË]|e[ˋ\`ˊ´ˆ^¨]
g  [gĝğġģǵǥǧĜĞĠĢǴǤǦ]|g[ˆ^˘˙¸ˊ´-]
h  [hħĥĤĦ]|h[-ˆ^]
i  [iìíîïĩīĭįıǐÌÍÎÏĨĪĬĮİǏ]|i[ˋ\`ˊ´ˆ^˜~¨ˉ¯˘˛ˇ]
ij  ij|[ĳĲ]
j  [jĵǰĴ]|j[ˆ^ˇ]
k  [kķĸǩĶǨ]|k[¸ˇ]
l  [lĺļľŀłĹĻĽĿŁ]|l[ˊ´¸ˇ˙-]
lj  lj|[Ǉǈǉ]
n  [nńņňŉñŃŅŇÑ]|n[ˊ´¸˘˜~']
ng  ng|[ŋŊ]
nj  nj|[ǌǋǊ]
o  [oòóôõöøǿōŏőǒǫǭÒÓÔÕÖØǾŌŎŐǑǪǬ]|o([ˋ\`ˊ´ˆ^˜~¨/ˉ¯˘˝ˇ˛]|/[ˊ´]|[ˊ´]/|˛[ˉ¯]|[ˉ¯]˛)
oe  oe|[œŒ]
r  [rŕŗřŔŖŘ]|r[ˊ´¸ˇ]
s  [sśŝşšŚŜŞŠ]|s[ˊ´ˆ^¸ˇ]
sz  sz|ß
t  [tţťŧŢŤŦ]|t[¸ˇ-]
u  [uùúûüũūŭůűųǔǖǘǚǜÙÚÛÜŨŪŬŮŰŲǓǕǗǙǛ]|u([ˋ\`ˊ´ˆ^˜~¨˚°ˉ¯˘˛ˇ]|¨[ˉ¯]|[ˉ¯]¨|¨[ˊ´]|[ˊ´]¨|¨ˇ|ˇ¨|¨[ˋ\`]|[ˋ\`]¨)
w  [wẁẃẅŵẀẂẄŴ]|w[ˋ\`ˊ´¨ˆ^]
y  [yỳýÿŷỲÝŸŶ]|y[ˋ\`ˊ´¨ˆ^]
z  [zźżžŹŻŽ]|z[ˊ´˙ˇ]
`.trim();

const mLatinWithModifiersByChar = {};
const mLatinPattern = (() => {
  const patterns = [];
  const strictPairs = LATIN_LETTES_WITH_MODIFIERS.split(/\s+/);
  for (let i = 0, maxi = strictPairs.length; i < maxi; i += 2) {
    mLatinWithModifiersByChar[strictPairs[i]] = strictPairs[i+1];
    patterns.push({ key : strictPairs[i], char : strictPairs[i+1] });
  }

  const source = patterns
    .sort((a, b) => b.key.length - a.key.length)
    .map(item => item.key)
    .join('|');
  return new RegExp(`(${source})`, 'ig');
})();

const mLatinWithModifiers = [];
const mLatinWithModifierPattern = (() => {
  const patterns = [];
  const lazyPairs = LATIN_LETTES_WITH_MODIFIERS_LAZY.split(/\s+/);
  for (let i = 0, maxi = lazyPairs.length; i < maxi; i += 2) {
    mLatinWithModifiers.push({ key : lazyPairs[i], char : lazyPairs[i+1] });
    patterns.push(lazyPairs[i+1]);
  }

  const source = patterns
    .sort((a, b) => b.length - a.length)
    .join('|');
  return new RegExp(`(${source})`, 'ig');
})();

export function isValidInput(input) {
  return !!normalizeInput(input);
}

export function normalizeInput(input) {
  return input.replace(nonAsciiRegExp, '');
}

export function normalizeKeyInput(input) {
  return input.replace(nonAsciiRegExp, '');
}

export function addLatinModifiers(input) {
  return removeLatinModifiers(input)
    .replace(mLatinPattern, character => `(${mLatinWithModifiersByChar[character]})`);
}

export function removeLatinModifiers(input) {
  return String(input)
    .replace(mLatinWithModifierPattern, character => {
      for (const modifierInfo of mLatinWithModifiers) {
        const regexp = new RegExp(`^(${modifierInfo.char})$`, 'i');
        if (regexp.test(character))
          return modifierInfo.key;
      }
      return character;
    });
}
