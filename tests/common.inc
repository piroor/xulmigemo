var XMigemoUI,
	XMigemoHighlight,
	win,
	browser,
	content,
	findCommand,
	gFindBar,
	findField,
	inputElem;
var keyEventTest = baseURL+'keyEventTest.html';
var keyEventTestXML = baseURL+'keyEventTest.xml';
var wait = 300;

function commonSetUp(aRetVal)
{
	browser = utils.getBrowser();
	browser.removeAllTabsBut(aRetVal.tab);

	win = utils.getTestWindow();

	content = win.content;

	gFindBar = win.gFindBar;

	XMigemoUI = win.XMigemoUI;
	XMigemoUI.openAgainAction = XMigemoUI.ACTION_NONE;
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

	findField = XMigemoUI.findField;
	inputElem = findField.inputField;

	win.gFindBar.closeFindBar();
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
