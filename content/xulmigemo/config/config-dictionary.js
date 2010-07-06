const Prefs = Components 
	.classes['@mozilla.org/preferences;1']
	.getService(Components.interfaces.nsIPrefBranch);

const XMigemo = Components
	.classes['@piro.sakura.ne.jp/xmigemo/factory;1']
	.getService(Components.interfaces.xmIXMigemoFactory)
	.getService(Prefs.getCharPref('xulmigemo.lang'));

const util = Components
	.classes['@piro.sakura.ne.jp/xmigemo/file-access;1']
	.getService(Components.interfaces.xmIXMigemoFileAccess);

var gAbsolutePath;
var gRelativePath;

function getDP()
{
	var path = gAbsolutePath.value;
	var folderPath = XMigemo.dictionaryManager.showDirectoryPicker(path);
	if (!folderPath || gAbsolutePath.value == folderPath) return;

	gAbsolutePath.value = folderPath;
	var event = document.createEvent('UIEvents');
	event.initUIEvent('input', true, false, window, 0);
	gAbsolutePath.dispatchEvent(event);

	gRelativePath.value = util.getRelativePath(folderPath);
	event = document.createEvent('UIEvents');
	event.initUIEvent('input', true, false, window, 0);
	gRelativePath.dispatchEvent(event);
}

function goInitializeWizard()
{
	var wizard = Components
			.classes['@mozilla.org/appshell/window-mediator;1']
			.getService(Components.interfaces.nsIWindowMediator)
			.getMostRecentWindow('xulmigemo:initializer');
	if (wizard) {
		wizard.focus();
		return;
	}

	window.openDialog(
		'chrome://xulmigemo/content/initializer/initializer.xul',
		'xulmigemo:initializer',
		'chrome,dialog,modal,centerscreen,dependent'
	);
	window.setTimeout(function() {
		document.getElementById('xulmigemo.dicpath-textbox').checked = decodeURIComponent(escape(Prefs.getCharPref('xulmigemo.dicpath')));
		document.getElementById('xulmigemo.dicpath-relative-textbox').checked = decodeURIComponent(escape(Prefs.getCharPref('xulmigemo.dicpath-relative')));
		document.getElementById('xulmigemo.dic.useInitializeWizard-check').checked = Prefs.getBoolPref('xulmigemo.dic.useInitializeWizard');
	}, 0);
}



var gCacheSlider;
var gCacheTextbox;

function initDicPane()
{
	gAbsolutePath = document.getElementById('xulmigemo.dicpath-textbox');
	gRelativePath = document.getElementById('xulmigemo.dicpath-relative-textbox');

	var fromRelative = false;
	var path = gAbsolutePath.value;
	if (path) {
		var file = Components
				.classes['@mozilla.org/file/local;1']
				.createInstance(Components.interfaces.nsILocalFile);
		file.initWithPath(path);
		if (!file.exists()) fromRelative = true;
	}
	if (fromRelative && gRelativePath.value)
		gAbsolutePath.value = util.getAbsolutePath(gRelativePath.value);


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
		window.gTestStringBundle = XMigemoService.stringBundle.get('chrome://xulmigemo/content/res/test.properties');

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
