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

test_getRegExpFor.parameters = {
	'展開'     : { input : 'kak',
	               terms : ['かかく', 'かこ', 'かっか'] },
	'N1個'     : { input : 'kantoku',
	               terms : ['カントク', 'かんとく', 'ｶﾝﾄｸ'] },
	'N2個'     : { input : 'kanntoku',
	               terms : ['カントク', 'かんとく', 'ｶﾝﾄｸ'] },
	'N3個'     : { input : 'nannnin',
	               terms : ['なんニン', 'ナンニん'] },
	WE         : { input : 'werukam',
	               terms : ['ウぇるカむ', 'ウぇるカも', 'ゑるカム', 'ゑるカみ', 'werukam'] },
	'発音記号' : { input : 'dao',
	               terms : ['Dão'] },
	'音引き'   : { input : 'o-',
	               terms : ['おー', 'ｵｰ', 'オー', 'おｰ', 'お-'] },
	'漢字'     : { input : 'nihongo',
	               terms : ['日本語'] },
	'英単語'   : { input : 'hello',
	               terms : ['ハロー'] },
	openParen  : { input : '(', terms : ['(', '（'] },
	closeParen : { input : ')', terms : [')', '）'] },
	openBracket  : { input : '[', terms : ['[', '［'] },
	closeBracket : { input : ']', terms : [']', '］'] }
};
function test_getRegExpFor(aParameter)
{
	var regexp = engine.getRegExpFor(aParameter.input);
	regexp = new RegExp(regexp, 'i');
	aParameter.terms.forEach(function(aTerm) {
		assert.pattern(aTerm, regexp);
	});
}
