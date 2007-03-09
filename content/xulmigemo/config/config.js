
function getDP()
{
	var XMigemoDicManager = Components
				.classes['@piro.sakura.ne.jp/xmigemo/dictionary-manager;1']
				.getService(Components.interfaces.pIXMigemoDicManager);

	var folderPath = XMigemoDicManager.showDirectoryPickerFor(document.getElementById('xulmigemo.dicpath').value);
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

	XMigemoCore.createCacheTimeOverride = parseInt(document.getElementById('xulmigemo.cache.update.time-textbox').value);

	var XMigemoCache = Components
			.classes['@piro.sakura.ne.jp/xmigemo/cache;1']
			.getService(Components.interfaces.pIXMigemoCache);

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
					XMigemoCache.clearCacheFor(pattern);
			}
		}
		catch(e) {
		}
	}
}



var shortcutFindBackward;
var shortcutFindForward;
var shortcutManualStart;
var shortcutManualStart2;
var shortcutManualStartLinksOnly;
var shortcutManualStartLinksOnly2;
var shortcutGoDicManager;

function initShortcutPane()
{

	shortcutFindForward = document.getElementById('shortcutFindForward');
	shortcutFindForward.keyData = XMigemoService.parseShortcut(shortcutFindForward.value);
	shortcutFindBackward = document.getElementById('shortcutFindBackward');
	shortcutFindBackward.keyData = XMigemoService.parseShortcut(shortcutFindBackward.value);
	shortcutManualStart = document.getElementById('shortcutManualStart');
	shortcutManualStart.keyData = XMigemoService.parseShortcut(shortcutManualStart.value);
	shortcutManualStart2 = document.getElementById('shortcutManualStart2');
	shortcutManualStart2.keyData = XMigemoService.parseShortcut(shortcutManualStart2.value);
	shortcutManualStartLinksOnly = document.getElementById('shortcutManualStartLinksOnly');
	shortcutManualStartLinksOnly.keyData = XMigemoService.parseShortcut(shortcutManualStartLinksOnly.value);
	shortcutManualStartLinksOnly2 = document.getElementById('shortcutManualStartLinksOnly2');
	shortcutManualStartLinksOnly2.keyData = XMigemoService.parseShortcut(shortcutManualStartLinksOnly2.value);
	shortcutManualExit = document.getElementById('shortcutManualExit');
	shortcutManualExit.keyData = XMigemoService.parseShortcut(shortcutManualExit.value);
	shortcutGoDicManager = document.getElementById('shortcutGoDicManager');
	shortcutGoDicManager.keyData = XMigemoService.parseShortcut(shortcutGoDicManager.value);;
}

function setShortcut(aNode)
{
		window.openDialog(
			'keyDetecter.xul',
			'_blank',
			'chrome,modal,resizable=no,titlebar=no,centerscreen',
			aNode.keyData,
			aNode.getAttribute('dialogMessage'),
			aNode.getAttribute('dialogButton')
		);
		if (aNode.keyData.modified) {
			aNode.value = aNode.keyData.string;
			var event = document.createEvent('UIEvents');
			event.initUIEvent('input', true, false, window, 0);
			aNode.dispatchEvent(event);
		}
}
function clearShortcut(aNode)
{
	aNode.value = '';
	aNode.keyData = XMigemoService.parseShortcut(aNode.value);
	aNode.keyData.modified = true;

	var event = document.createEvent('UIEvents');
	event.initUIEvent('input', true, false, window, 0);
	aNode.dispatchEvent(event);
}




function opener()
{
	return XMigemoService.WindowManager.getMostRecentWindow('navigator:browser');
}

function loadURI(uri)
{
	if (opener())
		opener().loadURI(uri);
	else
		window.open(uri);
}

