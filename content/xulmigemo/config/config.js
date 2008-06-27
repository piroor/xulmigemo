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

