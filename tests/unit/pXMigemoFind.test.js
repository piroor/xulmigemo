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
	assert.largerThan(200, utils.contentWindow.innerHeight);

	function assertScrollAndFind(aIdOrNode, aFindFlag)
	{
		var frame = utils.contentWindow;
		var item = typeof aIdOrNode == 'string' ? frame.document.getElementById(aIdOrNode) : aIdOrNode ;
		frame.scrollTo(
			0,
			(aFindFlag & findModule.FIND_BACK ?
				item.offsetTop - frame.innerHeight + item.offsetHeight + 12 :
				item.offsetTop
			)
		);
		var node = findModule.findFirstVisibleNode(aFindFlag, frame);
		assert.equals(item, node);
	}

	yield utils.addTab(baseURL+'../res/shortPage.html', { selected : true });
	assertScrollAndFind(utils.contentDocument.getElementsByTagName('BODY')[0], findModule.FIND_DEFAULT);

	yield utils.addTab(baseURL+'../res/longPage.html', { selected : true });
	assertScrollAndFind('p1', findModule.FIND_DEFAULT);
	assertScrollAndFind('p10', findModule.FIND_DEFAULT);
	assertScrollAndFind('p10', findModule.FIND_BACK);
	assertScrollAndFind('p5', findModule.FIND_BACK);

	yield utils.addTab(baseURL+'../res/tooLongPage.html', { selected : true });
	assertScrollAndFind('p1', findModule.FIND_DEFAULT);
	assertScrollAndFind('p10', findModule.FIND_DEFAULT);
	assertScrollAndFind('p10', findModule.FIND_BACK);
	assertScrollAndFind('p5', findModule.FIND_BACK);
}
