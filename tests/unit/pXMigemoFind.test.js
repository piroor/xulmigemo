utils.include('pXMigemoClasses.inc.js');

var findModule;

function setUp()
{
	yield utils.setUpTestWindow();
	findModule = new pXMigemoFind();
	findModule.target = utils.getTestWindow().gBrowser;
}

function tearDown()
{
	findModule.destroy();
	findModule = null;
	utils.tearDownTestWindow();
}

function testFindFirstVisibleNode()
{
	var win = utils.getTestWindow();
	win.resizeTo(500, 500);

	yield utils.addTab(baseURL+'../res/shortPage.html', { selected : true });

	var frame = utils.contentWindow;
	frame.scrollTo(0, 0);
	var node = findModule.findFirstVisibleNode(findModule.FIND_DEFAULT, frame);
	assert.equals(frame.document.getElementsByTagName('P')[0], node);

	yield utils.addTab(baseURL+'../res/longPage.html', { selected : true });

	frame = utils.contentWindow;
	frame.scrollTo(0, 0);
	node = findModule.findFirstVisibleNode(findModule.FIND_DEFAULT, frame);
	assert.equals(frame.document.getElementsByTagName('P')[0], node);
}
