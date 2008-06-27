const Prefs = Components 
	.classes['@mozilla.org/preferences;1']
	.getService(Components.interfaces.nsIPrefBranch);

const XMigemo = Components
	.classes['@piro.sakura.ne.jp/xmigemo/factory;1']
	.getService(Components.interfaces.pIXMigemoFactory)
	.getService(Prefs.getCharPref('xulmigemo.lang'));

function getDP()
{
	var util = Components
				.classes['@piro.sakura.ne.jp/xmigemo/file-access;1']
				.getService(Components.interfaces.pIXMigemoFileAccess);
	var path = util.getAbsolutePath(document.getElementById('xulmigemo.dicpath').value);
	var folderPath = XMigemo.dictionaryManager.showDirectoryPicker(path);
	if (folderPath) {
		var relativePath = util.getRelativePath(folderPath);
		if (relativePath && folderPath.length > relativePath.length)
			folderPath = relativePath;
	}
	var field = document.getElementById('xulmigemo.dicpath-textbox');
	if (folderPath && field.value != folderPath) {
		field.value = folderPath;
		var event = document.createEvent('UIEvents');
		event.initUIEvent('input', true, false, window, 0);
		field.dispatchEvent(event);
	}
}



var gCacheSlider;
var gCacheTextbox;

function initDicPane()
{
	gCacheSlider  = document.getElementById('xulmigemo.cache.update.time-slider');
	var scrollbar = document.getElementById('xulmigemo.cache.update.time-scrollbar');
	if (!('value' in gCacheSlider)) {
		scrollbar.removeAttribute('hidden');
		gCacheSlider.setAttribute('hidden', true);
		gCacheSlider = scrollbar;
	}
	else {
		gCacheSlider.removeAttribute('hidden');
		scrollbar.setAttribute('hidden', true);
	}
	gCacheTextbox = document.getElementById('xulmigemo.cache.update.time-textbox');

	syncCacheUpdateTime();
}

function syncCacheUpdateTime(aNode)
{
	var slider = gCacheSlider;
	var textbox = gCacheTextbox;
	if (aNode == slider) {
		textbox.value = slider.value || slider.getAttribute('curpos');
		var event = document.createEvent('UIEvents');
		event.initUIEvent('input', true, false, window, 0);
		textbox.dispatchEvent(event);
	}
	else {
		slider.setAttribute('value', textbox.value);
		slider.setAttribute('curpos', textbox.value);
	}
}

var gTestStringBundle;

function updateCacheNow()
{
	if (!window.gTestStringBundle)
		window.gTestStringBundle = new XMigemoStringBundle('chrome://xulmigemo/content/res/test.properties');

	var strbundle = gStringBundle;
	var pattern = '';
	var patterns = [];
	var i = 0;

	XMigemo.createCacheTimeOverride = parseInt(document.getElementById('xulmigemo.cache.update.time-textbox').value);
	getPatterns:
	while (true)
	{
		try {
			pattern = strbundle.getString('pattern'+(i++));
			switch (pattern)
			{
				case '':
					continue;
				case '[EOF]':
					break getPatterns;
				default:
					XMigemo.cache.clearCacheFor(pattern);
			}
		}
		catch(e) {
		}
	}
}
