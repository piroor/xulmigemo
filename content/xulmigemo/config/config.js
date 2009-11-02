var gDisableIME;
var gNormalFind;
var gQuickFind;

function initGeneralPane()
{
	gDisableIME = document.getElementById('xulmigemo.disableIME-check');
	gNormalFind = document.getElementById('xulmigemo.disableIME.normalFindFor-textbox');
	gQuickFind = document.getElementById('xulmigemo.disableIME.quickFindFor-textbox');
	var platform = navigator.platform.toLowerCase();
	if (platform.indexOf('win') < 0 && platform.indexOf('mac') < 0) {
		gDisableIME.setAttribute('hidden', true);
	}
	else {
		gDisableIME.removeAttribute('hidden');
		initDisableIMECheck();
	}
}

function onChangeDisableIMECheck()
{
	gNormalFind.value = gQuickFind.value = (gDisableIME.checked ? 2 : 0 );
	[gNormalFind, gQuickFind].forEach(fireInputEvent);
}
function initDisableIMECheck()
{
	var normalFind = parseInt(gNormalFind.value);
	var quickFind = parseInt(gQuickFind.value);

	gDisableIME.checked = (
		(normalFind & Components.interfaces.xmIXMigemoFind.FIND_MODE_MIGEMO) &&
		(quickFind & Components.interfaces.xmIXMigemoFind.FIND_MODE_MIGEMO)
	) ? true : false ;
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
			'chrome,modal,centerscreen,dialog=no',
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

	fireInputEvent(aNode);
}

function fireInputEvent(aNode)
{
	var event = document.createEvent('UIEvents');
	event.initUIEvent('input', true, false, window, 0);
	aNode.dispatchEvent(event);
}


function readModeCirculationPref(aCheckbox)
{
	var current = document.getElementById('xulmigemo.shortcut.modeCirculation').value;
	var flag = parseInt(aCheckbox.getAttribute('flag'));
	return current & flag;
}

function writeModeCirculationPref(aCheckbox)
{
	var current = document.getElementById('xulmigemo.shortcut.modeCirculation').value;
	var flag = parseInt(aCheckbox.getAttribute('flag'));
	if ((current & flag) != aCheckbox.checked) {
		if (current & flag) {
			current ^= flag;
		}
		else {
			current |= flag;
		}
	}
	return current;
}


function initCombinationPane()
{
	const XULAppInfo = Components.classes['@mozilla.org/xre/app-info;1']
			.getService(Components.interfaces.nsIXULAppInfo);
	const comparator = Components.classes['@mozilla.org/xpcom/version-comparator;1']
						.getService(Components.interfaces.nsIVersionComparator);
	const ExtensionManager = Components.classes['@mozilla.org/extensions/manager;1']
				.getService(Components.interfaces.nsIExtensionManager);

	const kID_FIREFOX = '{ec8030f7-c20a-464f-9b0e-13a3a9e97384}';
	const kID_THUNDERBIRD = '{3550f703-e582-4d05-9a08-453d09bdfdc6}';

	var placesBox = document.getElementById('combination-places');
	if (XULAppInfo.ID == kID_FIREFOX &&
		comparator.compare(XULAppInfo.version, '3.0') >= 0)
		placesBox.removeAttribute('collapsed');
	else
		placesBox.setAttribute('collapsed', true);

	var ctrlTabBox = document.getElementById('xulmigemo.ctrlTab.enabled-check');
	if (XULAppInfo.ID == kID_FIREFOX &&
		comparator.compare(XULAppInfo.version, '3.6a1pre') >= 0)
		ctrlTabBox.removeAttribute('collapsed');
	else
		ctrlTabBox.setAttribute('collapsed', true);

	var thunderbirdBox = document.getElementById('combination-thunderbird');
	if (XULAppInfo.ID == kID_THUNDERBIRD)
		thunderbirdBox.removeAttribute('collapsed');
	else
		thunderbirdBox.setAttribute('collapsed', true);

	var autocompletemanagerBox = document.getElementById('xulmigemo.combination.autocompletemanager-check');
	if (ExtensionManager.getInstallLocation('acmanager@ucla'))
		autocompletemanagerBox.removeAttribute('collapsed');
	else
		autocompletemanagerBox.setAttribute('collapsed', true);
}
