pref("xulmigemo.lang", "");

pref("xulmigemo.autostart",                     false);
pref("xulmigemo.autostart.regExpFind",          true);
// 1 = normal find, 2 = migemo, 4 = regexp, 7 = all
pref("xulmigemo.disableIME.quickFindFor",       7);
pref("xulmigemo.disableIME.normalFindFor",      0);
pref("xulmigemo.prefillwithselection",          true);
pref("xulmigemo.startfromviewport",             true);
pref("xulmigemo.linksonly",                     false);
pref("xulmigemo.ignoreHiraKata",                true);
pref("xulmigemo.ignoreLatinModifiers",          true);
pref("xulmigemo.splitTermsAutomatically",       false);
pref("xulmigemo.scrollSelectionToCenter",       true);
pref("xulmigemo.scrollSelectionToCenter.padding", 30);
pref("xulmigemo.ignore_find_links_only_behavior", true);
pref("xulmigemo.rebuild_selection",             true);
pref("xulmigemo.work_for_any_xml_document",     true);

pref("xulmigemo.checked_by_default.findbar",       false);

pref("xulmigemo.checked_by_default.highlight",     false);
pref("xulmigemo.checked_by_default.caseSensitive", false);

pref("xulmigemo.checked_by_default.highlight.always",     false);
pref("xulmigemo.checked_by_default.highlight.always.minLength", 2);
pref("xulmigemo.checked_by_default.caseSensitive.always", false);

// 0 = native, 1 = migemo, 2 = regexp
pref("xulmigemo.findMode.always", -1);
pref("xulmigemo.findMode.default", 0);

pref("xulmigemo.highlight.showScreen",     true);
pref("xulmigemo.highlight.animateFound",   true);
// 0 = zoom (like webkit), 1 = jump (old XUL/Migemo)
pref("xulmigemo.highlight.animationStyle", 0);
pref("xulmigemo.highlight.animationStyle.0.size", 10);
pref("xulmigemo.highlight.animationStyle.1.size", 2);
// <button>[+<modifier flags (nsIDOMNSEvent)>]
// for example:
//   0+2 = 0(left click) + 2 (CONTROL_MASK)
//   0+8 = 0(left click) + 8 (META_MASK)
//   1+6 = 1(middle click) + 2 (CONTROL_MASK) + 4 (SHIFT_MASK)
//   2+1 = 2(right click) + 1 (ALT_MASK)
pref("xulmigemo.highlight.hideScreen.restoreButtons", "1,0+1,0+2,0+4,0+8,0+6,0+12");

pref("xulmigemo.highlight.foundMarker.enabled", true);
pref("xulmigemo.highlight.foundMarker.size",    10);
pref("xulmigemo.highlight.foundMarker.padding", 5);
pref("xulmigemo.highlight.foundMarker.fill",    "rgba(255,255,0,1)");
pref("xulmigemo.highlight.foundMarker.stroke",  "rgba(192,128,0,0.75)");
pref("xulmigemo.highlight.foundMarker.fill.active",   "rgba(255,191,0,1)");
pref("xulmigemo.highlight.foundMarker.stroke.active", "rgba(160,80,0,0.75)");

pref("xulmigemo.timeout",                       4000);
pref("xulmigemo.timeout.stopWhileScrolling",    true);
pref("xulmigemo.enabletimeout",                 true);
pref("xulmigemo.enableautoexit.inherit",        true);
pref("xulmigemo.enableautoexit.nokeyword",      true);

pref("xulmigemo.enabletimeout.indicator",       true);
// 0 = always show labels, 1 = auto, 2 = always hide labels
pref("xulmigemo.appearance.buttonLabelsMode",   1);
pref("xulmigemo.appearance.indicator.height",   5);
// 0 = leftmost, 1 = rightmost
pref("xulmigemo.appearance.closeButtonPosition", 0);
// 0 = below content area, 1 = above content area, 2 = between tab bar and content area
pref("xulmigemo.appearance.findBarPosition", 0);

pref("xulmigemo.shortcut.manualStart",           "/");
pref("xulmigemo.shortcut.manualStart2",          "Accel+Shift+F");
pref("xulmigemo.shortcut.manualStartLinksOnly",  "\\");
pref("xulmigemo.shortcut.manualStartLinksOnly2", "");
pref("xulmigemo.shortcut.manualExit",            "ESCAPE");
pref("xulmigemo.shortcut.findForward",           "F4");
pref("xulmigemo.shortcut.findBackward",          "Shift+F4");
pref("xulmigemo.shortcut.goDicManager",          "Accel+Shift+F7");
// 0 = do nothing, 1 = switch find mode, 2 = close find bar
pref("xulmigemo.shortcut.openAgain", 1);

pref("xulmigemo.dicpath",                       "");
pref("xulmigemo.dicpath-relative",              "");

pref("xulmigemo.cache.update.time",             500);
pref("xulmigemo.cache.override.ja",             "migemocache.txt");
pref("xulmigemo.find_delay",                    50);


pref("xulmigemo.places.enableANDFind",         true);
pref("xulmigemo.places.enableNOTFind",         true);
pref("xulmigemo.places.enableBoundaryFind",    false);
pref("xulmigemo.places.chunk",                 100);
pref("xulmigemo.places.minLength",             2);
pref("xulmigemo.places.ignoreURI",             true);
pref("xulmigemo.places.locationBar",           true);
pref("xulmigemo.places.locationBar.delay",     250);
pref("xulmigemo.places.locationBar.useThread", false);
pref("xulmigemo.places.bookmarksPanel",        true);
pref("xulmigemo.places.historyPanel",          true);
pref("xulmigemo.places.organizer",             true);

pref("xulmigemo.mailnews.threadsearch.enabled", true);
pref("xulmigemo.mailnews.threadsearch.body",    false);

pref("xulmigemo.combination.autocompletemanager", true);


pref("xulmigemo.dictionary.useInitializeWizard", true);
pref("xulmigemo.dictionary.download.uri.ja",     "http://piro.sakura.ne.jp/xul/xpi/xulmigemodic.zip");
pref("xulmigemo.dictionary.download.uri.en-US",  "http://piro.sakura.ne.jp/xul/xpi/xulmigemodic.en-US.zip");

pref("extensions.{01F8DAE3-FCF4-43D6-80EA-1223B2A9F025}.name", "chrome://xulmigemo/locale/xulmigemo.properties") ;
pref("extensions.{01F8DAE3-FCF4-43D6-80EA-1223B2A9F025}.description", "chrome://xulmigemo/locale/xulmigemo.properties") ;
