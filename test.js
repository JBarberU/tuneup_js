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
 * Setup is run prior to any test cases.
 * Could be used to set a known state for the app, that isn't part of 
 * the actual test cases.
 */
function setup(f) {
	test_internal("Setup", f);
}

/**
 * Adds the given test to the test queue.
 * All tests will run when the teardown function is called.
 */
function test(title, f, options) {
	tests.push({title: title, func: f, opts: options});
}

/**
 * Runs all the queued tests and finnally calls the teardown function that 
 * has been given as an argument to this function. 
 */
function tearDown(f) {
	try {
		tests.forEach(function(t) {
			test_internal(t.title, t.func, t.options);	
		});	
	} catch (e) {}	

	test_internal("Teardown", f);
}

/**
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

