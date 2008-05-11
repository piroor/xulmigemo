var XMigemoUI,
	XMigemoHighlight,
	win,
	browser,
	findCommand,
	gFindBar,
	findField,
	inputElem;
var keyEventTest = baseURL+'keyEventTest.html';
var wait = 300;

function commonSetUp(aRetVal)
{
	browser = utils.getBrowser();
	browser.removeAllTabsBut(aRetVal.tab);

	win = utils.getTestWindow();

	gFindBar = win.gFindBar;

	XMigemoUI = win.XMigemoUI;
	XMigemoUI.openAgainAction = XMigemoUI.ACTION_NONE;
	XMigemoUI.highlightCheckedAlways = false;
	XMigemoUI.caseSensitiveCheckedAlways = false;
	XMigemoUI.autoStartRegExpFind = true;
	XMigemoUI.autoStartQuickFind = false;

	XMigemoHighlight = win.XMigemoHighlight;
	XMigemoHighlight.strongHighlight = false;
	XMigemoHighlight.animationEnabled = false;

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
