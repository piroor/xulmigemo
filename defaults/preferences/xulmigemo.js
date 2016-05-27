pref("xulmigemo.lang", "");

// 1 = native find, 2 = migemo, 4 = regexp, -1 = keep previous mode
pref("xulmigemo.findMode.default", 1);
pref("xulmigemo.findMode.always", 1);
pref("xulmigemo.findMode.quick.default", 1);
pref("xulmigemo.findMode.quick.always", 1);

pref("xulmigemo.disableIME.migemo", true);

pref("xulmigemo.startfromviewport",             true);
pref("xulmigemo.ignoreHiraKata",                true);
pref("xulmigemo.ignoreLatinModifiers",          true);
pref("xulmigemo.ignoreAnyInvisibleNode",        false);
pref("xulmigemo.splitTermsAutomatically",       false);
pref("xulmigemo.autostart.regExpFind",          true);

pref("xulmigemo.scrollSelectionToCenter",       true);
pref("xulmigemo.scrollSelectionToCenter.padding", 30);
pref("xulmigemo.scrollSelectionToCenter.smoothScroll.enabled", true);
pref("xulmigemo.scrollSelectionToCenter.smoothScroll.duration", 350);

pref("xulmigemo.shortcut.startInTemporaryMode",  '[{"mode":"FIND_MODE_MIGEMO","findbarMode":"FIND_NORMAL","shortcut":"Accel+Shift+F"},{"mode":"FIND_MODE_MIGEMO","findbarMode":"FIND_TYPEAHEAD","shortcut":"\\\\"}]');
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

pref("xulmigemo.combination.autocompletemanager", true);


pref("xulmigemo.dictionary.useInitializeWizard", true);
pref("xulmigemo.dictionary.download.uri.ja",     "https://piro.sakura.ne.jp/xul/xpi/xulmigemodic.zip");
pref("xulmigemo.dictionary.download.uri.en-US",  "https://piro.sakura.ne.jp/xul/xpi/xulmigemodic.en-US.zip");


pref("xulmigemo.debug.all", false);

pref("xulmigemo.debug.ui", false);

pref("xulmigemo.debug.api", false);
pref("xulmigemo.debug.finder", false);
pref("xulmigemo.debug.mail", false);
pref("xulmigemo.debug.places", false);
pref("xulmigemo.debug.remoteFinder", false);
pref("xulmigemo.debug.service", false);

pref("xulmigemo.debug.cache", false);
pref("xulmigemo.debug.core", false);
pref("xulmigemo.debug.docUtils", false);
pref("xulmigemo.debug.dicManager", false);
pref("xulmigemo.debug.dictionary.ja", false);
pref("xulmigemo.debug.dictionary", false);
pref("xulmigemo.debug.engine.ja", false);
pref("xulmigemo.debug.engine", false);
pref("xulmigemo.debug.fileAccess", false);
pref("xulmigemo.debug.find", false);
pref("xulmigemo.debug.textTransform.ja", false);
pref("xulmigemo.debug.textTransform", false);
pref("xulmigemo.debug.textUtils", false);
