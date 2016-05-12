' \
../../modules/core/textUtils.js \
../../modules/core/fileAccess.js \
../../modules/core/dicManager.js \
../../modules/core/dictionary.js \
../../modules/core/dictionary.ja.js \
../../modules/core/cache.js \
../../modules/core/engine.ja.js \
../../modules/core/textTransform.js \
../../modules/core/textTransform.ja.js \
../../modules/core/core.js \
../../modules/core/find.js \
../../modules/core/mail.js \
'.replace(/^\s+|\s+$/g, '')
	.split('\n')
	.forEach(function(aURI) {
		utils.include({
			uri                    : aURI,
			encoding               : 'UTF-8',
			allowOverrideConstants : true
		});
	}, this);
TEST = true;
