utils.include('pXMigemoClasses.inc.js');

var find;

function setUp()
{
	find = new pXMigemoFind();
	find.init();
}

function tearDown()
{
	find.destroy();
	find = null;
}

function testFindFirstVisibleNode()
{
}
