Components.utils.import('resource://gre/modules/Services.jsm');

Components.utils.import('resource://xulmigemo-modules/service.jsm'); 
Components.utils.import('resource://xulmigemo-modules/core/core.js');
Components.utils.import('resource://xulmigemo-modules/core/dicManager.js');
Components.utils.import('resource://xulmigemo-modules/core/fileAccess.js'); 

var XMigemo = MigemoCoreFactory.get(XMigemoService.getMyPref('lang'));

var gAbsolutePath;
var gRelativePath;

function getDP()
{
	var path = gAbsolutePath.value;
	var folderPath = MigemoDicManager.showDirectoryPicker(path);
	if (!folderPath || gAbsolutePath.value == folderPath) return;

	gAbsolutePath.value = folderPath;
	var event = document.createEvent('UIEvents');
	event.initUIEvent('input', true, false, window, 0);
	gAbsolutePath.dispatchEvent(event);

	gRelativePath.value = MigemoFileAccess.getRelativePath(folderPath);
	event = document.createEvent('UIEvents');
	event.initUIEvent('input', true, false, window, 0);
	gRelativePath.dispatchEvent(event);
}

function goInitializeWizard()
{
	var wizard = Services.wm.getMostRecentWindow('xulmigemo:initializer');
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
		document.getElementById('xulmigemo.dicpath-textbox').value = XMigemoService.getMyPref('dicpath');
		document.getElementById('xulmigemo.dicpath-relative-textbox').value = XMigemoService.getMyPref('dicpath-relative');
		document.getElementById('xulmigemo.dic.useInitializeWizard-check').value = XMigemoService.getMyPref('dic.useInitializeWizard');
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
				.createInstance(Components.interfaces.nsIFile);
		file.initWithPath(path);
		if (!file.exists()) fromRelative = true;
	}
	if (fromRelative && gRelativePath.value)
		gAbsolutePath.value = MigemoFileAccess.getAbsolutePath(gRelativePath.value);


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
