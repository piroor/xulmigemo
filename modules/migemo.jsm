const EXPORTED_SYMBOLS = ['migemo']; 

const Cc = Components.classes;
const Ci = Components.interfaces;

const migemo = Cc['@piro.sakura.ne.jp/xmigemo/api;1']
				.getService(Ci.xmIXMigemoAPI)
				.QueryInterface(Ci.xmIXMigemoCoreAPI)
				.QueryInterface(Ci.xmIXMigemoRangeFindAPI)
				.QueryInterface(Ci.xmIXMigemoHighlightAPI);
