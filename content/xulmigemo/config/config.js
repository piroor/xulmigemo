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
		(normalFind & Components.interfaces.pIXMigemoFind.FIND_MODE_MIGEMO) &&
		(quickFind & Components.interfaces.pIXMigemoFind.FIND_MODE_MIGEMO)
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

	fireInputEvent(aNode);
}

function fireInputEvent(aNode)
{
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

