/**
 * Run a new test with the given +title+ and function body, which will
 * be executed within the proper test declarations for the UIAutomation
 * framework. The given function will be handed a +UIATarget+ and
 * a +UIApplication+ object which it can use to exercise and validate your
 * application.
 *
 * The +options+ parameter is an optional object/hash thingie that
 * supports the following:
 *    logTree -- a boolean to log the element tree when the test fails (default 'true')
 *
 * Example:
 * test_internal("Sign-In", function(target, application) {
 *   // exercise and validate your application.
 * });
 *
 * The +title+ is checked against every element of a global TUNEUP_ONLY_RUN
 * array. To check, each element is converted to a RegExp. The test is only
 * executed, if one check succeeds. If TUNEUP_ONLY_RUN is not defined,
 * no checks are performed.
 */
function test_internal(title, f, options) {
	if (typeof TUNEUP_ONLY_RUN !== 'undefined') {
		for (var i = 0; i < TUNEUP_ONLY_RUN.length; i++) {
			if (new RegExp("^" + TUNEUP_ONLY_RUN[i] + "$").test(title)) {
				break;
			}
			if (i == TUNEUP_ONLY_RUN.length -1) {
				return;
			}
		}
	}

	if (!options) {
		options = testCreateDefaultOptions();
	}
	target = UIATarget.localTarget();
	application = target.frontMostApp();
	UIALogger.logStart(title);
	try {
		f(target, application);
		UIALogger.logPass(title);
	}
	catch (e) {
		UIALogger.logError(e.toString());
		if (options.logStackTrace) UIALogger.logError(e.stack);
		if (options.logTree) target.logElementTree();
		if (options.logTreeJSON) application.mainWindow().logElementTreeJSON();
		if (options.screenCapture) target.captureScreenWithName(title + '-fail');
		UIALogger.logFail(title);
	}
}

var tests = [];

/**
 * @brief Setup the following test cases 
 * @details Could be used to set a known state for the app, that isn't part of 
 * the actual test cases.
 *
 * @param f The function to use for the setup
 */
function setup(f) {
	test_internal("Setup", f);
}

/**
 * @brief Add a test to the test queue.
 * @details All tests will run when the teardown function is called.
 * @param title The name to show when running the test
 * @param f The function to use as a test case
 * @param f_cleanup The function to use as test cleanup (optional)
 * @param options The options to pass into the internal test function (optional)
 */
function test(title, f, f_cleanup, options) {
	tests.push({title: title, func: f, func_cleanup: f_cleanup, opts: options});
}

/**
 * @brief Run all the queued tests and finnally call the given teardown function 
 * @param f The teardown function
 */
function tearDown(f) {
	try {
		target = UIATarget.localTarget();
		application = target.frontMostApp();

		tests.forEach(function(t) {
			test_internal(t.title, t.func, t.options);	

			if (typeof t.func_cleanup !== "undefined") {
				try {
					t.func_cleanup(target, application);
				} catch (e) {
					UIALogger.logError("Failed to run cleanup of: \"" + t.title + "\"");
					UIALogger.logError(e.stack);
				}
			}
		});	
	} catch (e) {}	

	test_internal("Teardown", f);
}

/*
 * Helper function to isolate clients from additional option changes. Clients can use this function to get a new option object and then only change the options they care about, confident that any new options added since their
 * code was created will contain the new default values.
 * @returns {Object} containing the error options
 */
function testCreateDefaultOptions() {
	return {
		logStackTrace: false,
    	logTree: true,
    	logTreeJSON: false,
    	screenCapture: true
	};
}

