window.addEventListener('load', function() {
	var XMigemoDicManager = Components
				.classes['@piro.sakura.ne.jp/xmigemo/dictionary-manager;1']
				.getService(Components.interfaces.pIXMigemoDicManager);
	XMigemoDicManager.init();
	window.removeEventListener('load', arguments.callee, false);
}, false);
