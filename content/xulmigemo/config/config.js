Components.utils.import('resource://xulmigemo-modules/service.jsm');
Components.utils.import('resource://xulmigemo-modules/constants.jsm');
Components.utils.import('resource://xulmigemo-modules/core/find.js');

var gDisableIME;
var gNormalFind;
var gQuickFind;

function initGeneralPane()
{
	gDisableIME = document.getElementById('xulmigemo.disableIME.migemo-check');
	if (!XMigemoService.isWindows && !XMigemoService.isMac) {
		gDisableIME.setAttribute('hidden', true);
	}
	else {
		gDisableIME.removeAttribute('hidden');
	}
}


function initModePane()
{
	updateDefaultFindModeRadio('xulmigemo.findMode');
	updateDefaultFindModeRadio('xulmigemo.findMode.quick');
}

function updateDefaultFindModeRadio(aBase)
{
	var alwaysRadio = document.getElementById(aBase + '.always-radio');
	var defaultRadio = document.getElementById(aBase + '.default-radio');
	defaultRadio.disabled = alwaysRadio.value != -1;
}



var startInTemporaryMode = [];
var startInTemporaryModeFields = [];
var shortcutGoDicManager;

function initShortcutPane()
{
	shortcutGoDicManager = document.getElementById('shortcutGoDicManager');
	shortcutGoDicManager.keyData = XMigemoService.parseShortcut(shortcutGoDicManager.value);
	buildStartInTemporaryModeRows();
}
function buildStartInTemporaryModeRows()
{
	var range = document.createRange();
	range.selectNodeContents(document.getElementById('startInTemporaryModeRows'));
	range.deleteContents();
	range.detach();

	startInTemporaryMode = [];
	startInTemporaryModeFields = [];

	var field = document.getElementById('startInTemporaryMode-field');
	var shortcuts = field.value;
	JSON.parse(shortcuts).forEach(addStartInTemporaryModeRow);
}

function addStartInTemporaryModeRow(aDefinition)
{
	var index = startInTemporaryModeFields.length;

	startInTemporaryMode.push(aDefinition);

	var template = document.getElementById('startInTemporaryModeRow-template');
	var row = template.cloneNode(true);
	row.setAttribute('id', 'startInTemporaryModeRow' + index);
	row.setAttribute('data-index', index);

	if (aDefinition.mode)
		row.childNodes[1].setAttribute('value', aDefinition.mode);
	else
		aDefinition.mode = row.childNodes[1].getAttribute('value');

	if (aDefinition.findbarMode)
		row.childNodes[2].setAttribute('value', aDefinition.findbarMode);
	else
		aDefinition.findbarMode = row.childNodes[2].getAttribute('value');

	var field = row.childNodes[3];
	field.setAttribute('value', aDefinition.shortcut || '');
	field.keyData = XMigemoService.parseShortcut(aDefinition.shortcut || '');

	document.getElementById('startInTemporaryModeRows').appendChild(row);
	startInTemporaryModeFields.push(field);
}

function removeStartInTemporaryModeRow(aIndex)
{
	startInTemporaryMode.splice(aIndex, 1);
	startInTemporaryModeFields.splice(aIndex, 1);
	saveStartInTemporaryMode();
	buildStartInTemporaryModeRows();
}

function saveStartInTemporaryMode()
{
	console.log(startInTemporaryMode);
	var definitions = startInTemporaryMode.filter(function(aDefinition) {
		return (
			aDefinition.mode &&
			aDefinition.findbarMode &&
			aDefinition.shortcut
		);
	});
	var field = document.getElementById('startInTemporaryMode-field');
	field.value = JSON.stringify(definitions);
	console.log(field.value);
	var event = document.createEvent('UIEvents');
	event.initUIEvent('input', true, false, window, 0);
	field.dispatchEvent(event);
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

	const kID_FIREFOX = '{ec8030f7-c20a-464f-9b0e-13a3a9e97384}';
	const kID_THUNDERBIRD = '{3550f703-e582-4d05-9a08-453d09bdfdc6}';

	var placesBox = document.getElementById('combination-places');
	if (XULAppInfo.ID == kID_FIREFOX &&
		comparator.compare(XULAppInfo.version, '3.0') >= 0)
		placesBox.removeAttribute('collapsed');
	else
		placesBox.setAttribute('collapsed', true);

	var thunderbirdBox = document.getElementById('combination-thunderbird');
	if (XULAppInfo.ID == kID_THUNDERBIRD)
		thunderbirdBox.removeAttribute('collapsed');
	else
		thunderbirdBox.setAttribute('collapsed', true);
}
