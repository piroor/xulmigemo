var EXPORTED_SYMBOLS = ['MigemoConstants']; 

var MigemoConstants = {
	// find mode
	FIND_MODE_NATIVE : 1 << 0,
	FIND_MODE_MIGEMO : 1 << 1,
	FIND_MODE_REGEXP : 1 << 2,
	FIND_MODE_KEEP   : -1,
	FIND_MODE_NOT_INITIALIZED : -2,
	CIRCULATE_MODE_EXIT : 1 << 8,

	FIND_CONTEXT_NORMAL : 0,
	FIND_CONTEXT_QUICK  : 1,

	// find result
	NOTFOUND          : 0,
	FOUND             : 1 << 0,
	WRAPPED           : 1 << 1,
	FOUND_IN_LINK     : 1 << 2,
	FOUND_IN_EDITABLE : 1 << 3,
	FINISH_FIND       : 1 << 4,

	// find flags
	FIND_DEFAULT     : 1 << 0,
	FIND_BACK        : 1 << 1,
	FIND_FORWARD     : 1 << 2,
	FIND_IN_LINK     : 1 << 7,
	FIND_IN_EDITABLE : 1 << 8,
	FIND_SILENTLY    : 1 << 9, // for internal use

	// dictionary types
	SYSTEM_DIC : 1 << 0, 
	USER_DIC   : 1 << 1,
	ALL_DIC    : (1 << 0 | 1 << 1),

	// dictionary operations
	RESULT_OK                      : 1 << 0,
	RESULT_ERROR_INVALID_INPUT     : 1 << 1,
	RESULT_ERROR_ALREADY_EXIST     : 1 << 2,
	RESULT_ERROR_NOT_EXIST         : 1 << 3,
	RESULT_ERROR_NO_TARGET         : 1 << 4,
	RESULT_ERROR_INVALID_OPERATION : 1 << 5,

	// IPC
	MESSAGE_TYPE : '{01F8DAE3-FCF4-43D6-80EA-1223B2A9F025}',
	SCRIPT_URL : 'chrome://xulmigemo/content/content.js',

	COMMAND_SET_FIND_MODE : 'set-find-mode',
	COMMAND_SHUTDOWN : 'shutdown',

	COMMAND_REPORT_FIND_MODE : 'report-find-mode',

	RANGE_MARKER_ACTIVE      : 'data-xulmigemo-marker-active',
	RANGE_MARKER_COUNT       : 'data-xulmigemo-marker-count',
	RANGE_MARKER_RANGE_START : 'data-xulmigemo-marker-range-start',
	RANGE_MARKER_RANGE_END   : 'data-xulmigemo-marker-range-end',
	RANGE_MARKER_START_POINT : 'data-xulmigemo-marker-start-point',
	RANGE_MARKER_END_POINT   : 'data-xulmigemo-marker-end-point'
};

MigemoConstants.FIND_MODE_FLAG_FROM_NAME = (function() {
	var names = {};
	[
		'FIND_MODE_NATIVE',
		'FIND_MODE_MIGEMO',
		'FIND_MODE_REGEXP'
	].forEach(function(aName) {
		names[MigemoConstants[aName]] = aName;
	});
	return names;
})();
