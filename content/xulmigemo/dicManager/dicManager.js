Components.utils.import('resource://xulmigemo-modules/service.jsm'); 

const Prefs = Components
	.classes['@mozilla.org/preferences;1']
	.getService(Components.interfaces.nsIPrefBranch);

var XMigemo = XMigemoService.XMigemo.engine;
var XMigemoDic = XMigemo.dictionary;

function addTerm(aStatus)
{
	var input = document.getElementById('add-input').value;
	var term = document.getElementById('add-term').value;

	var result = XMigemoDic.addTerm(input, term);

	if (input && XMigemo.textTransform.isValidInput(input))
		document.getElementById('add-input').value = XMigemo.textTransform.normalizeInput(input);

	if (result == XMigemoDic.RESULT_OK)
		document.getElementById('add-term').value = '';

	updateStatus('addStatus', result);
}

function removeTerm(aStatus)
{
	var input = document.getElementById('remove-input').value;
	var term = document.getElementById('remove-term').value;
	var result = XMigemoDic.removeTerm(input, term);

	if (input && XMigemo.textTransform.isValidInput(input))
		document.getElementById('remove-input').value = XMigemo.textTransform.normalizeInput(input);

	if (result == XMigemoDic.RESULT_OK)
		document.getElementById('remove-term').value = '';

	updateStatus('removeStatus', result);
}

function updateStatus(aStatus, aResult)
{
	var node = document.getElementById(aStatus);
	var message = '';
	switch (aResult)
	{
		case XMigemoDic.RESULT_OK:
			message = node.getAttribute('statusSuccess');
			break;

		case XMigemoDic.RESULT_ERROR_NO_WORD:
			message = node.getAttribute('errorNoTerm');
			break;

		case XMigemoDic.RESULT_ERROR_INVALID_INPUT:
			message = node.getAttribute('statusErrorInvalid-'+Prefs.getCharPref('xulmigemo.lang')) ||
						node.getAttribute('statusErrorInvalid');
			break;

		case XMigemoDic.RESULT_ERROR_ALREADY_EXIST:
			message = node.getAttribute('statusErrorExist');
			break;

		case XMigemoDic.RESULT_ERROR_NOT_EXIST:
			message = node.getAttribute('statusErrorNotExist');
			break;
	}

	var range = document.createRange();
	range.selectNodeContents(node);
	range.deleteContents();
	range.detach();
	node.appendChild(document.createTextNode(message));
}


function handleKeyInput(aEvent, aCommands)
{
	var node, method, func;
	if (
		aCommands.next &&
		(
			aEvent.keyCode == aEvent.DOM_VK_ENTER ||
			aEvent.keyCode == aEvent.DOM_VK_RETURN
		)
		) {
		if (typeof aCommands.next == 'function') {
			func = aCommands.next;
		}
		else {
			node = document.getElementById(aCommands.next[1]);
			method = aCommands.next[0];
		}
	}
	else if (
		aCommands.prev &&
		(
			aEvent.target.localName != 'textbox' ||
			!aEvent.target.value
		) &&
		aEvent.keyCode == aEvent.DOM_VK_BACK_SPACE
		) {
		aEvent.preventDefault();
		aEvent.stopPropagation();
		if (typeof aCommands.prev == 'function') {
			func = aCommands.prev;
		}
		else {
			node = document.getElementById(aCommands.prev[1]);
			method = aCommands.prev[0];
		}
	}
	else if (
		aCommands.del &&
		aEvent.keyCode == aEvent.DOM_VK_DELETE
		) {
		if (typeof aCommands.del == 'function') {
			func = aCommands.del;
		}
		else {
			node = document.getElementById(aCommands.del[1]);
			method = aCommands.del[0];
		}
	}

	if (node || func) {
		aEvent.preventDefault();
		aEvent.stopPropagation();
		if (func)
			func();
		else if (method in node)
			node[method]();
		else
			eval(node.getAttribute(method));
	}
}





var gListRemoveCommand;
var gListRemoveOneCommand;
var gListAddCommand;
var gListKeys;
var gListTerms;
var gListDictionary;

var onListRomanInputTimer;


function onListRomanInput()
{
	if (onListRomanInputTimer) {
		window.clearTimeout(onListRomanInputTimer);
		onListRomanInputTimer = null;
	}
	if (gListKeys.addItemTimer) {
		window.clearTimeout(gListKeys.addItemTimer);
		gListKeys.addItemTimer = null;
	}
	if (gListTerms.addItemTimer) {
		window.clearTimeout(gListTerms.addItemTimer);
		gListTerms.addItemTimer = null;
	}
	onListRomanInputTimer = window.setTimeout(updateKeysList, 300);
}

function updateKeysList()
{
	var range = document.createRange();
	range.selectNodeContents(gListKeys);
	range.deleteContents();

	if (gListTerms.addItemTimer) {
		window.clearTimeout(gListTerms.addItemTimer);
		gListTerms.addItemTimer = null;
	}
	range.selectNodeContents(gListTerms);
	range.deleteContents();

	range.detach();

	gListRemoveCommand.setAttribute('disabled', true);
	gListRemoveOneCommand.setAttribute('disabled', true);
	gListAddCommand.setAttribute('disabled', true);

	var roman = document.getElementById('list-roman').value;
	if (!roman) {
		return;
	}

	roman = XMigemo.textTransform.normalizeKeyInput(roman);
	if (document.getElementById('list-roman').value != roman)
		document.getElementById('list-roman').value = roman;

	var type;
	switch (gListDictionary.selectedItem.value)
	{
		case 'system':
			type = XMigemo.SYSTEM_DIC;
			break;
		case 'user':
			type = XMigemo.USER_DIC;
			break;
		case 'all':
			type = XMigemo.ALL_DIC;
			break;
	}
	var list = XMigemo.gatherEntriesFor(roman, type);
	list.sort();

	if (gListKeys.addItemTimer) {
		window.clearInterval(gListKeys.addItemTimer);
		gListKeys.addItemTimer = null;
	}
	gListKeys.addItemTimer = window.setInterval(
		progressivelyAddListItem,
		0,
		gListKeys,
		list,
		function(aList, aItem) {
			if (!aItem) return;

			var data = aItem.replace(/\n/mg, '').split('\t');
			var input = data[0];
			data.splice(0, 1);

			var target = aList.getElementsByAttribute('label', input);
			if (target.length) {
				target[0].value += '\n' + data.join('\n');
			}
			else {
				aList.appendItem(input, data.join('\n'));
			}
		}
	);
}

function updateTermsList()
{
	var range = document.createRange();
	range.selectNodeContents(gListTerms);
	range.deleteContents();
	range.detach();

	var item = gListKeys.selectedItem;
	if (!item) return;

	if (gListKeys.selectedItem) {
		gListAddCommand.removeAttribute('disabled');
		if (gListDictionary.selectedItem.value != 'system') {
			gListRemoveCommand.removeAttribute('disabled');
		}
		gListRemoveOneCommand.setAttribute('disabled', true);
	}

	var list = item.value.split('\n');
	list.sort();

	if (gListTerms.addItemTimer) {
		window.clearInterval(gListTerms.addItemTimer);
		gListTerms.addItemTimer = null;
	}
	gListTerms.addItemTimer = window.setInterval(
		progressivelyAddListItem,
		0,
		gListTerms,
		list,
		function(aList, aItem) {
			if (!aItem) return;

			aList.appendItem(aItem, '');
		}
	);
}

function updateListCommands()
{
	if (gListTerms.selectedItem &&
		gListDictionary.selectedItem.value != 'system') {
		gListRemoveOneCommand.removeAttribute('disabled', true);
	}
}

function progressivelyAddListItem(aList, aDataList, aProgressListener)
{
	if (!aList || !aDataList.length) {
		if (aList.addItemTimer) {
			window.clearTimeout(aList.addItemTimer);
			aList.addItemTimer = null;
		}
		return;
	}

	var item = aDataList[0];
	aDataList.splice(0, 1);

	var data = aProgressListener(aList, item);
}

function addTermList()
{
	input = gListKeys.selectedItem ? gListKeys.selectedItem.label : '' ;
	if (!input) return;

	var node = document.getElementById('listStatus');

	var term = prompt(node.getAttribute('promptAddTerm'));
	if (!term) return;

	var message;
	var result = XMigemoDic.addTerm(input, term);

	switch (result)
	{
		case XMigemoDic.RESULT_OK:
			if (gListDictionary.selectedItem.value != 'system') {
				gListTerms.appendItem(term, '');
				gListKeys.selectedItem.value += '\n' + term;
			}
			message = node.getAttribute('statusAddSuccess');
			break;

		case XMigemoDic.RESULT_ERROR_ALREADY_EXIST:
			message = node.getAttribute('statusErrorExist');
			break;
	}
	if (message) alert(message);
}

function removeTermList(aAll)
{
	var input = gListKeys.selectedItem ? gListKeys.selectedItem.label : '' ;
	if (!input) return;

	var term = gListTerms.selectedItem ? gListTerms.selectedItem.label : '' ;

	if (aAll) term = '';

	var node = document.getElementById('listStatus');
	var message;
	var result = XMigemoDic.removeTerm(input, term);

	switch (result)
	{
		case XMigemoDic.RESULT_OK:
			message = node.getAttribute('statusRemoveSuccess');
			var index;
			if (term) {
				index = gListTerms.selectedIndex;
				gListTerms.removeItemAt(index--);
				if (index == -1) index = 0;
				if (gListTerms.getRowCount())
					gListTerms.selectItem(gListTerms.getItemAtIndex(index));

				if (gListDictionary.selectedItem.value != 'system') {
					gListRemoveOneCommand.removeAttribute('disabled');
				}
				else {
					gListRemoveOneCommand.setAttribute('disabled', true);
				}

				let { MigemoTextUtils } = Components.utils.import('resource://xulmigemo-modules/core/textUtils.js', {});

				gListKeys.selectedItem.value = gListKeys.selectedItem.value.replace(new RegExp('^'+MigemoTextUtils.sanitize(term)+'$', 'm'), '');
			}
			if (!term || !gListKeys.selectedItem.value.replace(/\s+/g, '')) {
				index = gListKeys.selectedIndex;
				gListKeys.removeItemAt(index--);
				if (index == -1) index = 0;
				gListRemoveOneCommand.setAttribute('disabled', true);
				if (gListKeys.getRowCount()) {
					gListKeys.selectItem(gListKeys.getItemAtIndex(index));
					gListAddCommand.removeAttribute('disabled');
					if (gListDictionary.selectedItem.value != 'system')
						gListRemoveCommand.removeAttribute('disabled');
				}
				else {
					gListRemoveCommand.setAttribute('disabled', true);
					gListAddCommand.setAttribute('disabled', true);
				}
			}
			break;

		default:
			message = node.getAttribute('statusErrorNotInUserDic');
			break;
	}
	alert(message);
}

function onChangeDictionary()
{
	onListRomanInput();
	if (gListKeys.selectedItem) {
		if (gListDictionary.selectedItem.value == 'system') {
			gListRemoveCommand.setAttribute('disabled', true);
			gListRemoveOneCommand.setAttribute('disabled', true);
		}
		else {
			gListRemoveCommand.removeAttribute('disabled');
		}
	}
}

function initListContext(aPopup)
{
	var node = aPopup.triggerNode || document.popupNode;
	if (node.localName == 'listitem') node = node.parentNode;

	var removeItem = document.getElementById('listContextRemoveTerm');
	if (node.id == 'list-terms' &&
		gListRemoveOneCommand.getAttribute('disabled') != 'true')
		removeItem.removeAttribute('disabled');
	else
		removeItem.setAttribute('disabled', true);
}



function opener()
{
	return XMigemoService.WindowManager.getMostRecentWindow('navigator:browser');
}

function Startup()
{
	gListRemoveCommand = document.getElementById('listRemoveCommand');
	gListRemoveOneCommand = document.getElementById('listRemoveOneCommand');
	gListAddCommand    = document.getElementById('listAddCommand');
	gListKeys          = document.getElementById('list-keys');
	gListTerms         = document.getElementById('list-terms');
	gListDictionary    = document.getElementById('list-target');

	var win = opener();
	if (win) {
		var term = win._content.getSelection().toString();
		document.getElementById('add-term').value = term;

		document.getElementById('add-input').focus();
	}
}
