utils.include('xmXMigemoClasses.inc.js');

var engine;

function setUp()
{
	engine = new xmXMigemoEngineJa();
	engine.dictionary.load();
}

function tearDown()
{
	engine = null;
}

test_getRegExpFor.parameters = utils.readJSON('xmXMigemoEngineJa_regExpPatterns.json', 'UTF-8');
function test_getRegExpFor(aParameter)
{
	var regexp = engine.getRegExpFor(aParameter.input);
	regexp = new RegExp(regexp, 'i');
	aParameter.terms.forEach(function(aTerm) {
		assert.pattern(aTerm, regexp);
	});
}
