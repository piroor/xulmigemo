# History

 - master/HEAD
   * Firefox unexpectedly hanged in some pages including subframes.
   * Preferences are now stored under its private namespace.
   * Background operations in sidebar panels and the Places Organizer are now stopped after they are closed.
 - 0.14.4 (2016.5.28)
   * Never match to un-normalized patterns of modified latin characters. For example, `t-` can appear in input text as an alternative of modified `ŧ`, but it seems not to appear in webpages. So now `t-` and similar patterns are not matched to regular input like `t`.
   * Works correctly for webpages contains textarea and other input fields. (regression)
   * Migemo search in the bookmarks sidebar, the history sidebar, and the places organizer works correctly. (regression)
 - 0.14.3 (2016.5.28)
   * Firefox unexpectedly hanged in some pages.
   * Backward search works correctly with subframes.
   * Works correctly with pages including very long text node which includes the finding term multiple times.
   * Apply "no match" appearance immediately when there is no match.
   * The initialization wizard never appear multiple times for new windows opened on the initial session.
 - 0.14.2 (2016.5.20)
   * Dictionary manager works again.
   * Works correctly on the Places Organizer.
   * Works correctly for webpages with inline frames or scrollable elements.
 - 0.14.1 (2016.5.19)
   * Works correctly in English mode
 - 0.14.0 (2016.5.19)
   * Works on Firefox 45, Nightly 49.0a1 and Thunderbird 45.
   * Keyboard shortcuts to start find with specific mode are now defined as you like now.
   * Out-of-purpose features like auto highlighting are now removed.
   * "jar" archive is no longer included.
 - 0.13.6 (2010.7.13)
   * Fixed: On the first startup, the initial state of the find toolbar was wrongly set to "Migemo" mode. (*If you got the wrongly initialized preference, you have to repair it manually by "XUL/Migemo Configuration" =&gt; "Find Toolbar" =&gt; "Change initial state of the Find Toolbar Features..." =&gt; "Find mode:" =&gt; "Normal".)
   * Fixed: Failed to switch internal modes when you clicked the find mode switcher.
 - 0.13.5 (2010.7.12)
   * Improved: Highlighted terms are shown with drop shadow.
 - 0.13.4 (2010.7.9)
   * Improved: Async operation for Safari-style highlighting and markers is landed.
   * Fixed: Needless checkboxes for combination about other addons has been removed.
   * Fixed: [Highlights were wrongly cleared by markers, if Safari-style highlight was disabled.](http://piro.sakura.ne.jp/cgi-bin/bbs.cgi?2737)
 - 0.13.3 (2010.7.9)
   * Fixed: Some fatal regressions around the awsomebar disappeared.
 - 0.13.2 (2010.7.9)
   * Fixed: Freezing while highlighting disappeared.
 - 0.13.1 (2010.7.8)
   * Fixed: The awsomebar didn't work anymore after a browser window closed and there was another window.
 - 0.13.0 (2010.7.8)
   * Improved: Works on Minefield 4.0b2pre.
   * Improved: On Minefield 4.0b2pre, "switch to tab" feature of the awsomebar is supported.
   * Improved: Works on Thunderbird 3.0 and Thunderbird 3.1. (*Note: Migemo find is not available for quick find in folders if the Gloda is disabled.)
   * Improved: "Find from viewport" is optimized. (*Note: only on Gecko 1.9.2 and later.)
   * Improved: Smooth-scroll for "show the found term in the middle of the screen". (To disable it, go to about:config and set  `xulmigemo.highlight.foundMarker.smoothScroll.enabled`  to  `false` .)
   * Improved: Smooth-scroll for markers of found positions. (To disable it, go to about:config and set  `xulmigemo.highlight.foundMarker.smoothScroll.enabled`  to  `false` .)
   * Modified: "migemo" API doesn't return contents in the user dictionary anymore. This is a security improvement.
   * Fixed: Keyboard shortcuts can be customized on Firefox 3.6 and later.
   * Fixed: [Annoying focus moving when in-page finding is failed](http://piro.sakura.ne.jp/cgi-bin/bbs.cgi?2648) disappeared.
   * Fixed:  `browser.urlbar.autoFill`  works correctly for the smart location bar with XUL/Migemo.
   * Fixed: Highlighted terms for the last search are correctly cleared by the next search.
   * Fixed: Warnings from keyup events disappeared.
   * Drops support for Firefox 2 and Thunderbird 2.
 - 0.12.2 (2009.10.23)
   * Improved: New API for webapps is available.
   * Still doesn't work on Trunk at 2009-10-23, because of [Bug 396392](https://bugzilla.mozilla.org/show_bug.cgi?id=396392).
 - 0.12.1 (2009.10.21)
   * Improved: New API for addons and web applications, available on global namespace of JavaScript.
   * Fixed: "Highlight All" works correctly for case sensitive mode.
   * Fixed: Centering for the focused term works correctly for some cases.
   * Fixed: Smart keywords works correctly on the location bar.
   * Fixed: Regexp without "i" flag works correctly on the location bar.
   * Fixed: "ESC" key in the location bar correctly restores the original input.
   * Fixed: On Thunderbird, works correctly for messages without encoded characters.
   * Still doesn't work on Trunk at 2009-10-21, because of [Bug 396392](https://bugzilla.mozilla.org/show_bug.cgi?id=396392).
 - 0.11.16 (2009.6.8)
   * Fixed: Too high usage of CPU when you input many numbers of terms to the location bar dsappeared.
   * Fixed: "Home" key for smart location bar items works correctly.
 - 0.11.15 (2009.5.10)
   * Improved: "Match Cases" option is available for finding with regular expressions.
   * Fixed: Highlighting in text fields was broken on Shiretoko.
   * Fixed: Finds from document edge (or viewport edge) correctly if the find term is different from the previous find.
   * Fixed: Broken appearance of the find mode selector disappeared for [Download Statusbar](https://addons.mozilla.org/firefox/addon/26).
   * Fixed: User dictionary for English system dictionary works correctly.
 - 0.11.14 (2009.4.21)
   * Fixed: Position markers are correctly hidden after highlight is disabled. (regression on 0.11.13)
   * Modified: Application-specific checkboxes in "Combination" panel are hidden by the environment.
 - 0.11.13 (2009.4.21)
   * Fixed: Inital startup error disappeared.
   * Fixed: Invisible tests are correctly ignored on Gecko 1.8.
   * Fixed: Highlight screen and markers in background tabs are cleared automatically when the find toolbar is closed.
   * Fixed: The URI of the link is correctly shown in the status bar when the found range is inside a link. (regression)
   * Fixed: Focus ring is shown for the focused link in Quick Migemo Find mode.
   * Fixed: Found link is correctly focused when the find toolbar is closed.
   * Modified: The result shown as blank and "save" button for the query is disabled while there is no result yet for Migemo search in Bookmarks, History, and Library.
   * Fixed: Freezing on window resizing disappeared for Minefield. (maybe)
   * Fixed: Infinity increasing of elements for highlighting disappeared even if you switch the find mode with checked "highlight all" button.
 - 0.11.12 (2009.4.2)
   * Works on Minefield again.
   * Modified: Highlighting is disabled automatically when the find toolbar is closed.
   * Fixed: Highlighting works correctly for the native find.
 - 0.11.11 (2009.2.12)
   * Modified: XUL/Migemo keep terms highlighted while switching find modes.
   * Fixed: Highlight screen of Safari style highlight disappeared when just you start to find.
   * Fixed: "ヴ", a special kata-kana character, is found correctry by input like "va", "vi", "vu", "ve" and "vo".
 - 0.11.10 (2009.2.10)
   * Fixed: Configuration dialog works correctly with English locale.
   * Fixed: Ctrl-F circulates find mode correctly even if the default mode of the find toolbar is changed by user's preference.
 - 0.11.9 (2009.2.7)
   * Improved: Works on Firefox 3.1b3pre.
   * Improved: Search mode can be circulated by Ctrl-F as: [Normal] =&gt; [RegExp] =&gt; [Migemo] =&gt; Exit =&gt; [Normal] =&gt; ...
   * Fixed: You can start Quick Migemo Find even if you've already opened the find toolbar.
   * Fixed: Highlights are shown correctly even if there are hidden elements in the page.
   * Fixed: "g" flag works correctly on finding by pIMigemo's API.
 - 0.11.8 (2008.11.20)
   * Search field in sidebar panels (Bookmarks, etc.) works correctly again.
 - 0.11.7 (2008.11.17)
   * Fixed: Japanese engine generates correct regular expressions for inputs including half-width parenthesis.
   * Fixed: "Find from viewport" works more correctly.
   * Improved: [Search source configuration for the location bar](https://bugzilla.mozilla.org/show_bug.cgi?id=463661) is supported on Minefield 3.1b2pre.
 - 0.11.6 (2008.11.10)
   * Fixed: Works with [SearchWP](https://addons.mozilla.org/firefox/addon/376).
 - 0.11.5 (2008.11.7)
   * Fixed: Items from input histories in the smart location bar appear in the correct order.
   * Fixed: Find mode returns to the normal find mode when Firefox's original "quick find" starts.
   * Fixed: Changing find mode finishes the find, while Firefox's quick find or the quick migemo find is running.
   * Fixed: XUL/Migemo works correctly even if the initialization wizard is disabled and the dictionary is not configured.
   * Improved: You can start the initialization wizard from the configuration dialog.
   * Improved: Migemo find is available for the search box in the tab previews of Minefield 3.1b2pre.
 - 0.11.4 (2008.9.26)
   * Fixed: Broken behavior about default find mode and permanent find mode is corrected.
 - 0.11.3 (2008.9.24)
   * Improved: IME is automatically disabled for Migemo Find Mode even if it is started from normal find. (*Available only on Windows or Mac OS X.)
   * Fixed: Popup contents of the smart location bar is correctly filled with recently visited pages when the drop marker is clicked after Migemo Find.
   * Modified: Any integer number from 0 to 100 is available for "xulmigemo.scrollSelectionToCenter.padding".
 - 0.11.2 (2008.9.12)
   * Fixed: A serious problem is resolved. The previous version couldn't work after restarting when it was newly installed.
 - 0.11.1 (2008.9.12)
   * Improved: Markers are shown in correctly position.
   * Improved: Dictionaries' path can be stored as a relative path from the profile folder. On mobile Firefox, XUL/Migemo possibly works correctly.
 - 0.11.0 (2008.9.7)
   * Improved: Markers beside the scroll bar are available. They indicate where search term is in the page.
   * Improved: New awsomebar features introduced by Firefox 3.1 are supported. [Restrictions](http://ed.agadak.net/2008/07/firefox-31-restricts-matches-keywords), [dysplaying smart keywords](https://bugzilla.mozilla.org/show_bug.cgi?id=392143), and [matching only for beginnings of title/URL.](https://bugzilla.mozilla.org/show_bug.cgi?id=451760)
   * Fixed: Focused search term can be shown in the middle of the screen correctly if it is found by normal search.
   * Improved: Focused search term is shown in nearly middle of the screen, not just middle. In particular, only if the term exists out of the hidden border (30% from window edges), XUL/Migemo scrolls to the term. If you like the old behavior, type "about:config" into the location bar and change the value of "xulmigemo.scrollSelectionToCenter.padding" to "50".
   * [Selection based highlighting of Firefox 3.1](https://bugzilla.mozilla.org/show_bug.cgi?id=263683) is supported.
   * Improved: Performance improvements on next/previous find for "Highlight All".
   * Improved: The timer is stopped while scrolling, for the Quick Migemo Find.
   * Fixed: Find toolbar status is updated correctly.
   * Fixed: Focused term keeps selected after "Highlight All" check is turned off.
   * Modified: Now, the last page of the initializing wizard has a checkbox "never show this wizard".
 - 0.10.6 (2008.7.7)
   * Fixed: Input histories affect to the result of Migemo Find on the Smart Location Bar correctly.
   * Fixed: Left and Right arrows work correctly for Migemo Find on the Smart Location Bar.
 - 0.10.5 (2008.7.7)
   * Improved: "Not" find is available on the Smart Location Bar. If you add "-" before terms, Firefox shows results whitch  don't include those terms.
   * Fixed: Smart Location Bar results keeps itself showing while input.
   * Fixed: Backward find works correcly in webpages which include frames.
   * Fixed: Up and Down arrows work correctly for normal find on the Smart Location Bar.
 - 0.10.4 (2008.7.6)
   * Fixed: Migemo Find works correctly in the Smart Location Bar after toolbar customizing.
 - 0.10.3 (2008.7.5)
   * Modified: XUL/Migemo ignores input from the Smart Location Bar if there is no term which can be recognized by XUL/Migemo.
   * Fixed: Clicked item is loaded correctly on the Smart Location Bar.
   * Fixed: Selected item is correctly deleted from the database on the Smart Location Bar.
 - 0.10.2 (2008.7.5)
   * Fixed: Freezing on searching from the Smart Location Bar disappeared for some inputs which matche to "full-width space" characters.
 - 0.10.1 (2008.7.4)
   * Fixed: "Tab" key moves focus in the autocomplete list correctly.
   * Fixed: Place titles are correctly ignored on finding of bookmarks.
 - 0.10.0 (2008.7.3)
   * Improved: Available for Firefox 3 features, the Smart Location Bar, search boxes of History and Bookmarks.
   * Improved: "thi" matches "てぃ".
 - 0.9.1 (2008.6.27)
   * Fixed: "Compact" radio button in the dialog is correctly shown.
 - 0.9.0 (2008.6.27)
   * Improved: The Find Toolbar can be moved to above the content area or below the tab.
   * Improved: closebox of the Find Toolbar can be moved to rightside.
   * Improved: Tind Toolbar buttons become compact automatically when window is too small.
   * Improved: Better support for Split Browser.
   * Fixed: Auto-highlight feature works correctly.
   * Fixed: Animation preference works correctly in the configuration dialog.
   * Firefox 1.5 is not supported anymore.
 - 0.8.15 (2008.6.20)
   * Improved: Old animation style can be chosen from the configuration dialog.
   * Fixed: Highlights are correctly cleared.
   * Fixed: IM is correctly disable on Linux.
 - 0.8.14 (2008.6.16)
   * Fixed: Broken appearance on Mac OS X is corrected.
 - 0.8.13 (2008.5.16)
   * Modified: Auto-highlighting is disabled for a blank find field.
   * Fixed: The find toolbar doesn't appear on the startup even if any find mode is chosen for the default mode.
   * Fixed: Works with multiple frames correctly.
   * Modified: Highlighted terms are cleared after the find toolbar is closed.
 - 0.8.12 (2008.5.13)
   * Fixed: Works correctly on Firefox 3.
   * Fixed: Quick Migemo Find doesn't finish even if the Enter key is pressed on found terms which are not link.
   * Fixed: The find toolbar is hidden correctly after the Quick Migemo Find finishes if that is started from the Migemo find mode.
   * Fixed: Quick Migemo Find doesn't start while menus are showing.
   * Fixed: Regular expression search and Migemo find works on XML documents.
 - 0.8.11 (2008.5.13)
   * Modified: In the Quick Migemo Find mode, label beside the find field is changed.
   * Fixed: Find field isn't filled with selected terms if Quick Migemo Find starts.
   * Fixed: Clicked elements keeps its focus correctly after Quick Migemo Find finishes.
 - 0.8.10 (2008.5.12)
   * Fixed: Quick Migemo Find doesn't start when the trigger event is fired in the find field.
   * Fixed: Progress meter is shown with narrow style.
 - 0.8.9 (2008.5.12)
   * Improved: "Highlight All" works in any XML documents.
   * Fixed: The find field is correctly filled with selection terms.
   * Fixed: Character input after "Ctrl-A" in the find field works correctly for regular expression search and Migemo Find mode.
   * Fixed: State of find toolbar buttons in regular expression search and Migemo Find mode is same to normal find mode.
 - 0.8.8 (2008.5.10)
   * Improved: IME is automatically disabled for the Quick Migemo Find. (for Firefox 3)
   * Fixed: Back space key doesn't go back if it cancels the Quick Migemo Find.
   * Fixed: "/" can be typed into the location bar or other places.
   * Fixed: Safari style highlight works correctly on webpages with thier content-type "application/xhtml+xml".
   * Fixed: Works with recent versions of the Autocomplete Manager.
 - 0.8.7 (2008.5.7)
   * Improved: Quick Migemo Find can be started even if you focus to the location bar or the web search bar.
   * Fixed: Click events are correctly re-dispatched even if the full-zoom feature is used.
   * Fixed: Regular expression search can be started with selection terms correctly.
   * Fixed: Dark screen keeps itself shown after you click on somewhere not a link.
   * Fixed: "Highlight All" appearance is correctly applied for the first-loaded page.
   * Fixed: Safari style "Highlight All" works with the auto scroll, All-in-One Gestures, FireGestures and Optimoz Mouse Gestures. (maybe)
   * Fixed: Highlighted and focused text is shown correctly.
   * Fixed: Find feature works correctly on plain text pages.
   * Fixed: Operations on the find field works correctly in the Quick Migemo Find mode.
   * Fixed: "Enter" and "Shfit-Enter" for normal find works correctly.
 - 0.8.6 (2008.5.7)
   * Improved: Focused term is highlighted like safari.
   * Fixed: "Highlight All" is correctly checked automatically even if it is the first time.
   * Fixed: "Highlight All" appearances are correctly applied even if there are website stylesheets.
   * Fixed: Transparent screen is correctly hidden if highlighted terms are clicked.
   * Fixed: Wrongly selected ranges in text field disappeared for "find next" and "find previous" when "Highlight All" is checked.
 - 0.8.5 (2008.5.6)
   * Improved: Middle click, Ctrl-click or some combinations keeps "Highlight All" screen shown.
   * Fixed: "Highlight All" screen is correctly hidden if it is disabled.
 - 0.8.4 (2008.5.5)
   * Improved: Animation effect of "Highlight All" feature becomes like Safari. (If you need, to get old behavior back, set "xulmigemo.highlight.animationStyle" to "1".)
   * Fixed: Migemo Find works without timeout correctly if you are not in the Quick Migemo Find mode.
   * Fixed: "BackSpace" key resets timeout of Quick Migemo Find correctly.
 - 0.8.3 (2008.5.4)
   * Fixed: Error message on switching find mode disappeared.
 - 0.8.2 (2008.5.4)
   * Improved: Click events are fired when elements are clicked through the highlighting screen.
   * Improved: Highlights are cleared by clicking if they are in text fields.
   * Fixed: Highlighting screen disappears correctly if the find bar is closed.
   * Improved: "Find from viewport" works more intelligently.
 - 0.8.1 (2008.5.3)
   * Improved: Works more smoothly on Firefox 3.
   * Improved: Quick Migemo Find doesn't send keyboard events from your keytypes to webpages anymore.
   * Improved: The focused link is loaded directly from Quick Migemo Find.
   * Improved: The link URI of the focused link is shown in the status bar.
   * Fixed: Terms in text fields are found correctly.
   * Fixed: Highlights in text fields are cleared correctly.
 - 0.8.0 (2008.5.2)
   * Improved: Regular expression search is available. To activate it, switch the find mode manually or type regexp literal like "/find/" to the find field.
   * Improved: Ctrl(Command)-F switches the find mode or closes the find toolbar when it is already focused.
   * Modified: Algorithm of backward find is changed.
   * Modified: Texts are decoded by Thunderbird's built-in feature. Because JavaScript-based decoder became obsolete, the installation file becomes smaller.
 - 0.7.14 (2008.3.12)
   * Fixed: "Find Next" of native search works correctly after XUL/Migemo search is done.
   * Fixed: "Find Previous" of XUL/Migemo search works correctly for multiple terms.
   * Improved: Mail bodies can be searched by XUL/Migemo, in Thunderbird.
   * Modified: Configuration dialog is restrucured.
   * Works on Minefield 3.0b5pre.
 - 0.7.13 (2008.1.30)
   * Improved: Works with [Autocomplete Manager](https://addons.mozilla.org/firefox/addon/2300).
 - 0.7.12 (2008.1.29)
   * Improved: Available for searching mails on Thunderbird. (But searching in "body" field isn't supported yet.)
 - 0.7.11 (2007.10.28)
   * Fixed: Works with [Internote](http://internote.sourceforge.net/).
 - 0.7.10 (2007.10.24)
   * Fixed: Works with [Source Viewer Tab](http://piro.sakura.ne.jp/xul/_viewsourceintab.html.en).
   * Fixed: The input "uwwu-" hits to "うっうー" correctly.
 - 0.7.9 (2007.9.19)
   * Fixed: Freezing on start to find with auto-highlighting disappeared. (maybe)
   * Fixed: "Find from viewport" feature works correctly.
   * Fixed: The input "ssyo" hits to "っしょ" correctly.
 - 0.7.8 (2007.8.3)
   * Improved: Words exist in the dictionary are found preferentially.
   * Improved: Highlight are not re-rendered on "Find Again" command. ("Find Again" command is optimized.)
   * Fixed: The status message for wrapped find is shown correctly.
   * Fixed: Firefox keeps the selection of found term when you toggle the "Highlight all" feature.
   * Fixed: Dictionaries can be loaded correctly if it is encoded in Shift_JIS.
   * Fixed: "Highlight all" highlights case-insensitive result.
   * Fixed: "Highlight all" can be disabled by hand if it is automatically enabled.
   * Modified: Matched terms are not highlighted automatically when the length of the longest term (or the term in the input field) is shorter than the number of the minimum characters for auto-highlight.
 - 0.7.7 (2007.7.21)
   * Improved: Modifiers of latin letters can be ignored. For example, "Frédéric" can be found by the input "frederic".
   * Modified: English engine becomes the general engine. It can load dictionaries of any languages.
   * Modified: Dictionaries for the general engine are encoded in UTF-8.
   * Fixed: "Highlight all" is disabled automatically for the cases which the feature doesn't affect to.
   * Fixed: Invalid regular expressions disappeared.
   * Fixed: "Highlight all" doesn't enabled for SearchWP and Googlebar Lite, if the feature should not be enabled automatically.
 - 0.7.6+ (2007.7.19)
   * Fixed: The engine creates correct regular-expression for an alphabets input which is not a roman-letter spelling.
 - 0.7.6 (2007.7.18)
   * Improved: The Find Toolbar can be shown with compact buttons.
   * Improved: "Highlight all" doesn't canceled when you scroll the page.
   * Fixed: The dark screen of the "Highlight all" covers the page completely.
   * Modified: Matched terms are not highlighted automatically when the longest term is shorter than the number of the minimum characters for auto-highlight.
   * Fixed: An error in "Highlight all" disappeared.
 - 0.7.5+ (2007.7.18)
   * Modified: The auto-start feature of the Quick Migemo Find is disabled by default.
   * Fixed: "Highlight all" works correctly on Firefox 1.5.
 - 0.7.5 (2007.7.17)
   * Improved: Minimum length of the search term can be customized for "Highlight all" when it is automatically enabled.
   * Improved: Any matched terms of the roman-letter input are highlighted in the Migemo-find mode.
   * Fixed: Some roman-letter inputs are parsed correctly.
   * Modified: Configuration of the Find Toolbar's state is restructured.
 - 0.7.4 (2007.7.15)
   * Fixed: Some characters, which become two characters when it is translated to half-width kana, are found correctly. And, terms which include spaces are found correctly.
   * Improved: "Highlight all" and "Match Cases" can be enabled permanently.
   * Improved: Auto-start and auto-exit of the Quick Migemo Find are synchronized.
 - 0.7.3 (2007.7.1)
   * Fixed: Selections are restored correctly, after find in "Highlight All" mode.
   * Fixed: "Highlight All" can be unchecked by hand correctly, even if you set it is checked by default.
   * Fixed: Some rules of roman-letter input are supported; for example, "we" -&gt; "うぇ", "dhi" -&gt; "でぃ", etc.
 - 0.7.2 (2007.6.28)
   * Fixed: Errors in the initial preferences disappeared.
 - 0.7.1 (2007.6.28)
   * Fixed: Works on Trunk.
   * Improved: Rebuilding selection after highlighting ( xulmigemo.rebuild_selection ) and animation for found section ( xulmigemo.highlight.animateFound ) can be disabled separately.
   * Fixed: A mistake in animation disappeared.
 - 0.7.0 (2007.6.28)
   * Modified: "[Forked Edition]" is removed from its name.
   * Modified: Translation engine of roman letters and hiragana letters is replaced.
   * Modified: Published under GPL2.
 - 0.6.6 (2007.6.27)
   * Improved: The found term is shown with animation in "Highlight All" mode.
   * Improved: Selections are restored after find in "Highlight All" mode.
   * Improved: XUL/Migemo clears its custom attribute from content documents.
   * Modified: Codes about cache are rewritte.
   * Modified: Appearance of highligh-screen is changed.
   * Fixed: In Firefox 1.5, "Highligh All" button works after you switch tabs.
   * Fixed: Highlighted terms are shown over the screen. (implemented by Dear Periwinkle)
   * Fixed: A mistake in the English locale disappeared.
 - 0.6.5 (2007.6.22)
   * Improved: Works with [Split Browser](http://piro.sakura.ne.jp/xul//xul/_splitbrowser.html).
   * Improved: Highlighting of [Googlebar Lite](https://addons.mozilla.org/firefox/addon/492) and [SearchWP](https://addons.mozilla.org/firefox/addon/376) is supported. (implemented by Dear Periwinkle)
   * Improved: Highlighting is always canceled when you click on the page.
   * Improved: Any "embed" elements are hidden while highlighting.
 - 0.6.4 (2007.6.22)
   * Improved: Safari 3 style emphasis appearance is available, based on [Dear Periwinkle's implementation](http://kuonn.mydns.jp/fx/SafariHighlight.uc.js).
   * Fixed: Emphasis of "Highlight all" is updated correctly for Migemo-find-mode.
 - 0.6.3 (2007.6.21)
   * Modified: API is changed.
 - 0.6.2 (2007.6.19)
   * Fixed: Mistakes in API are corrected.
 - 0.6.1 (2007.6.19)
   * Fixed: English dictionary is correctly used.
 - 0.6.0 (2007.6.19)
   * Improved: Other languages can be supported.
   * Improved: English engine and dictionary is available.
 - 0.5.5 (2007.6.5)
   * Improved: Relative path from the installation folder of Firefox is available for the dictionary folder path.
 - 0.5.4 (2007.6.4)
   * Fixed: Works in the "View Source" window correctly.
   * Improved: Works in "Help" and "View Partial Source" window.
 - 0.5.3 (2007.3.24)
   * Fixed: Found term of normal find is shown in the middle of the screen correctly.
 - 0.5.2 (2007.3.18)
   * Fixed: Found term is shown in the middle of the screen correctly.
 - 0.5.1 (2007.3.16)
   * Fixed: A mistake in the implementation of pIXMigemo disappeared.
 - 0.5.0 (2007.3.14)
   * Added: Icon is available.
   * Improved: You can keep available Quick Migemo Find when there is no keyword left.
   * Improved: Main implementations become XPCOM components written in JavaScript.
 - 0.4.16 (2007.3.9)
   * Improved: You can change the shortcut to exit Quick Migemo Find.
 - 0.4.15 (2007.3.7)
   * Fixed: Find feature works in the "View Source" window on Firefox Trunk.
 - 0.4.14 (2007.3.7)
   * Improved: Thunderbird 2 is supported.
   * Improved: Works in "View Page Source" window.
   * Fixed: Mistakes in Japanese locale are corrected.
   * Fixed: Found term is shown in the middle of the screen correctly.
 - 0.4.13 (2007.2.27)
   * Fixed: "Find Next" and "Find Previous" work correctly in Minefield.
 - 0.4.12 (2007.2.27)
   * Fixed: Quick Migemo Find mode correctly timeouts after you start it from normal find.
   * Fixed: The option to enable Migemo find permanently works correctly.
   * Fixed: Reopening find bar resets the mode of finding correctly.
   * Fixed: Freezing for inputs start with "." key disappeared.
   * Fixed: Normal find works correctly for starting with long terms even if the secret option "accessibility.typeaheadfind.linksonly" is "true".
 - 0.4.11 (2007.2.24)
   * Improved: A new option, to show the found term in the middle of the screen, is available. (It is based on [the script made by alice0775](http://space.geocities.yahoo.co.jp/gl/alice0775/view/20070224/1172242960))
 - 0.4.10 (2007.2.15)
   * Modified: Now, the feature to enter Migemo mode automatically by keytype or "/" key is named "Quick Migemo Find".
   * Modified: Firefox resets the remaining time of timeout for "Find Next" and "Find Previous" in Quick Migemo Find mode.
   * Modified: "Find links only" option is available only in Quick Migemo Find mode.
   * Improved: You can customize the initial state of the find toolbar.
 - 0.4.9 (2007.2.14)
   * Fixed: Links are correctly focused.
   * Modified: Behavior of link focus becomes like the default of Firefox. (Links are always focused if the find toolbar is hidden or you start find directly. If you start to find by Ctrl-F, the found link will be focused after you close the find toolbar.)
 - 0.4.8 (2007.2.14)
   * Improved: New option to fill the find field previously with selection is available.
   * Improved: New option to enable Migemo mode automatically is available.
   * Improved: You can find in text fields.
   * Improved: You can highlight found words in Migemo mode.
   * Improved: You can keep open the find toolbar while switching tabs or page loads.
   * Modified: Previous input is cleared before you start Migemo mode manually.
   * Fixed: "Find links only" mode works correctly.
   * Modified: The initial height of the progress bar is modified.
 - 0.4.7 (2006.12.7)
   * Fixed: The checkbox to switch Migemo mode is shown over the find toolbar, in the correct position.
   * Improved: The height of the indicator became customizable, for the remaining time of timeout to exit from Migemo mode.
   * Modified: The find toolbar is always overrided.
 - 0.4.6 (2006.12.6)
   * Improved: Half-width kana are available for input.
 - 0.4.5 (2006.12.5)
   * Improved: Now an initializing wizard available. It can download and install dictionary via the Internet automatically.
   * Improved: Half-width Kana characters can be found by Migemo-mode.
   * Improved: The difference of Hiragana and Katakana characters can be ignored.
   * Fixed: Dictionaries placed in a folder which has Japanese characters in its path can be recognized. (maybe)
 - 0.4.4 (2006.12.5)
   * Fixed: Stupid regexps disappeared.
 - 0.4.3 (2006.12.4)
   * Improved: For Minefield, a slider widget (&lt;xul:scale /&gt;) is available to customize disk cache.
   * Improved: Shortcuts work in textfields.
   * Improved: Two shortcuts are available to enter Migemo mode.
 - 0.4.2 (2006.12.3)
   * Improved: Internal operations to create disk cache are optimized.
 - 0.4.1 (2006.12.2)
   * Improved: Supports Minefield (Firefox 3.0 Alpha.)
   * Improved: Internal operations to create regular expressions are optimized.
   * Improved: Frequency of creating disk cache made customizable.
   * Fixed: Reloading of dictionary works correctly.
   * Modified: Appearance and internal methods to override the find toolbar is changed for Minefield.
 - 0.4.0 (2006.12.1)
   * Modified: Totally refactored. Mozilla Suite, Seamonkey, and Netscape 7.x are not supported.
   * Fixed: Shortcuts with just one key work correctly.
   * Fixed: Works with SearchWP correctly.
   * Improved: Shortcut keys to enter Migemo mode became changable.
   * Modified: The find bar will be cleared after exitting Migemo mode.
   * Modified: Configuration dialog became Firefox 1.5 style.
   * Improved: Dictionary manager and user dictionary are available.
   * Improved: ja-JP locale is available.
 - 0.3.11
   * Fixed: The find toolbar is updated correctly in Firefox 2.0 RC2.
 - 0.3.10
   * Fixed: Works on Firefox 2.0 Beta1.
 - 0.3.9
   * Fixed: Command key works correctly in Mac OS X.
 - 0.3.8
   * Fixed: Works correctly for plaintext pages.
   * Fixed: Ctrl-"/", Ctrl-"\" and other shortcuts work correctly when AutoStart is disabled.
 - 0.3.7
   * Fixed: Rich-textareas in some websites (ex. Gmail) are ignored correctly.
 - 0.3.6
   * Fixed: Works correctly in environments which includes no Find Bar.
   * Fixed: Fixed some problems in F3 and Shift-F3 key.
 - 0.3.5
   * Fixed: F3 and Shift-F3 calls native feature of finding correctly if XUL/Migemo is not active.
   * Fixed: Regular expressions for forwarding search are created correctly. (maybe)
 - 0.3.4
   * Improved: The remaining time for the timeout of XUL/Migemo can be shown with a progress meter.
 - 0.3.3
   * Fixed: Works on Firefox Trunk.
 - 0.3.2
   * Improved: XUL/Migemo can override or ignore the Find Toolbar as your setting.
   * Fixed: Re-finding with F3 key works correctly after finding from the find toolbar.
 - 0.3.1
   * Forked.
   * Modified: Initializing operations are modified.
   * Fixed: Works on Firefox 1.5 correctly.
   * Fixed: Freezing of "links only search" disappeared.
