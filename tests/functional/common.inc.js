//var profile = '../res/profile-ja/';
//var options = ['-console', '-jsconsole'/*, '-uxu-do-not-quit'*/];

var XMigemoUI,
	XMigemoHighlight,
	win,
	browser,
	content,
	findCommand,
	gFindBar,
	field,
	inputElem;
var keyEventTest = baseURL+'../res/keyEventTest.html';
var keyEventTestXML = baseURL+'../res/keyEventTest.xml';
var wait = 500;

function commonSetUp(aURI)
{
	yield utils.setUpTestWindow();

	var retVal = utils.addTab(aURI);
	yield retVal;

	utils.setPref('browser.tabs.warnOnClose', false);

	browser = utils.getBrowser();
	browser.removeAllTabsBut(retVal.tab);

	win = utils.getTestWindow();
	win.resizeTo(800, 600);

	content = win.content;

	gFindBar = win.gFindBar;

	XMigemoUI = win.XMigemoUI;
	XMigemoUI.modeCirculation = XMigemoUI.CIRCULATE_MODE_NONE;
	XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
	XMigemoUI.forcedFindMode = -1;
	XMigemoUI.highlightCheckedAlways = false;
	XMigemoUI.caseSensitiveCheckedAlways = false;
	XMigemoUI.autoStartRegExpFind = true;
	XMigemoUI.autoStartQuickFind = false;
	XMigemoUI.autoExitQuickFindInherit = true;
	XMigemoUI.autoExitQuickFind = true;
	XMigemoUI.timeout = 2500;
	XMigemoUI.prefillWithSelection = true;
	XMigemoUI.workForAnyXMLDocuments = true;

	XMigemoHighlight = win.XMigemoHighlight;
	XMigemoHighlight.strongHighlight = false;
	XMigemoHighlight.animationEnabled = false;
	XMigemoHighlight.combinations = [
		{
			button   : 1,
			altKey   : false,
			ctrlKey  : false,
			shiftKey : false,
			metaKey  : false
		},
		{
			button   : 0,
			altKey   : false,
			ctrlKey  : true,
			shiftKey : false,
			metaKey  : false
		}
	];

	findCommand = 'with (win) {'+
		win.document.getElementById('cmd_find').getAttribute('oncommand')+
	'}';

	field = XMigemoUI.field;
	inputElem = field.inputField;

	gFindBar.closeFindBar();

	yield wait;
}

function commonTearDown()
{
	utils.tearDownTestWindow();
}

var key_Ctrl_A = {
		charCode : 'a'.charCodeAt(0),
		ctrlKey  : true
	};
var key_input_a = {
		charCode : 'a'.charCodeAt(0)
	};
var key_RETURN = {
		keyCode : Components.interfaces.nsIDOMKeyEvent.DOM_VK_RETURN
	};
var key_BS = {
		keyCode : Components.interfaces.nsIDOMKeyEvent.DOM_VK_BACK_SPACE
	};
var key_DEL = {
		keyCode : Components.interfaces.nsIDOMKeyEvent.DOM_VK_DELETE
	};

function fireKeyEvents(aTarget, aKey, aTimes)
{
	for (var i = 0; i < aTimes; i++)
	{
		action.fireKeyEventOnElement(aTarget, aKey);
	}
	yield wait;
}

// initialize prefs
function pref(aKey, aValue) {
	switch (aKey)
	{
		case 'xulmigemo.lang':
		case 'xulmigemo.dicpath':
		case 'xulmigemo.dicpath-relative':
			return;
	}
	utils.setPref(aKey, aValue);
}
utils.include('../../defaults/preferences/xulmigemo.js');
