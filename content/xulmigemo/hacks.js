XMigemoUI.overrideExtensionsPreInit = function() {
};

XMigemoUI.overrideExtensionsOnInitBefore = function() {
};

XMigemoUI.overrideExtensionsOnInitAfter = function() {

	// Download Statusbar
	if ('db_checkShouldShow' in window) {
		eval('window.db_checkShouldShow = '+window.db_checkShouldShow.toSource().replace(
			/(\}\)?)$/,
			'XMigemoUI.fireFindToolbarUpdateRequestEvent(); $1'
		));
	}
	if ('db_toggleDownbar' in window) {
		eval('window.db_toggleDownbar = '+window.db_toggleDownbar.toSource().replace(
			/(\}\)?)$/,
			'XMigemoUI.fireFindToolbarUpdateRequestEvent(); $1'
		));
	}

};
