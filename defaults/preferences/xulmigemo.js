pref("xulmigemo.lang", "");

pref("xulmigemo.autostart",                     false);
pref("xulmigemo.autostart.regExpFind",          true);
// 1 = normal find, 2 = migemo, 4 = regexp, 7 = all
pref("xulmigemo.disableIME.quickFindFor",       2);
pref("xulmigemo.disableIME.normalFindFor",      2);
pref("xulmigemo.startfromviewport",             true);
pref("xulmigemo.linksonly",                     false);
pref("xulmigemo.ignoreHiraKata",                true);
pref("xulmigemo.ignoreLatinModifiers",          true);
pref("xulmigemo.ignoreAnyInvisibleNode",        false);
pref("xulmigemo.splitTermsAutomatically",       false);
pref("xulmigemo.scrollSelectionToCenter",       true);
pref("xulmigemo.scrollSelectionToCenter.padding", 30);
pref("xulmigemo.scrollSelectionToCenter.smoothScroll.enabled", true);
pref("xulmigemo.scrollSelectionToCenter.smoothScroll.duration", 350);
pref("xulmigemo.ignore_find_links_only_behavior", true);

// 1 = native, 2 = migemo, 4 = regexp
pref("xulmigemo.findMode.always", -1);
pref("xulmigemo.findMode.default", 1);

pref("xulmigemo.timeout",                       4000);
pref("xulmigemo.timeout.stopWhileScrolling",    true);
pref("xulmigemo.enabletimeout",                 true);
pref("xulmigemo.enableautoexit.inherit",        true);
pref("xulmigemo.enableautoexit.nokeyword",      true);

pref("xulmigemo.shortcut.manualStart",           "/");
pref("xulmigemo.shortcut.manualStart2",          "Accel+Shift+F");
pref("xulmigemo.shortcut.manualStartLinksOnly",  "\\");
pref("xulmigemo.shortcut.manualStartLinksOnly2", "");
pref("xulmigemo.shortcut.goDicManager",          "Accel+Shift+F7");
// 0 = do nothing
// 1 = normal find
// 2 = migemo find
// 4 = regexp find
// 256 = Exit
pref("xulmigemo.shortcut.modeCirculation", 7);

pref("xulmigemo.dicpath",                       "");
pref("xulmigemo.dicpath-relative",              "");

pref("xulmigemo.cache.update.time",             100);
//pref("xulmigemo.cache.override.ja",             "migemocache.txt");
//pref("xulmigemo.cache.override.ja.encoding",    "Shift_JIS");
pref("xulmigemo.find_delay",                    50);


pref("xulmigemo.ANDFind.enabled", true);
pref("xulmigemo.NOTFind.enabled", true);

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

pref("xulmigemo.ctrlTab.enabled", true);

pref("xulmigemo.mailnews.threadsearch.enabled", true);
pref("xulmigemo.mailnews.threadsearch.body",    false);

pref("xulmigemo.combination.autocompletemanager", true);


pref("xulmigemo.dictionary.useInitializeWizard", true);
pref("xulmigemo.dictionary.download.uri.ja",     "https://piro.sakura.ne.jp/xul/xpi/xulmigemodic.zip");
pref("xulmigemo.dictionary.download.uri.en-US",  "https://piro.sakura.ne.jp/xul/xpi/xulmigemodic.en-US.zip");
