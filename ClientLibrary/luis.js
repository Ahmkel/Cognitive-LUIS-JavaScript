var LUISClient;
(function() {
    /**
     * This is the interface of the LUIS SDK
     * Constructs a LUISClient with the corresponding user's App ID and Subscription Keys
     * Starts the prediction procedure for the user's text, and accepts a callback function
     * @param initData an object that has 4 propertes:
     * @1- appId a String containing the Application Id
     * @2- appKey a String containing the Subscription Key
     * @3- preview a Boolean to choose whether to use the preview version or not
     * @4- verbose a Boolean to choose whether to use the verbose version or not
     * @returns {{predict: predict, reply: reply}} an object containing the functions that need to be used
     */

    LUISClient = function (initData) {
        validateInitData(initData);
        var appId = initData.appId;
        var appKey = initData.appKey;
        var preview = initData.preview;
        var verbose = initData.verbose;
        validateAppInfoParam(appId, 'Application Id');
        validateAppInfoParam(appKey, 'Subscription Key');
        preview = validateBooleanParam(preview, 'Preview');
        verbose = validateBooleanParam(verbose, 'Verbose');
        const LUISPreviewURL = preview ? '/preview' : '';
        const LUISPredictMask
            = 'https://api.projectoxford.ai/luis/v1/application{0}?id={1}&subscription-key={2}{3}&q={4}';
        const LUISReplyMask
            = 'https://api.projectoxford.ai/luis/v1/application{0}?id={1}&subscription-key={2}&contextid={3}{4}&q={5}';
        const LUISVerboseURL = verbose ? '&verbose=true' : '';
        return {
            /**
             * Initiates the prediction procedure
             * @param text a String containing the text which needs to be analysed and predicted
             * @param responseHandlers an object that contains "onSuccess" and "onFailure" functions to be executed
             * on the success or failure of the web request
             */
            predict: function (text, responseHandlers) {
                text = validateText(text);
                validateResponseHandlers(responseHandlers);
                var LUISOptions = {
                    path: stringFormat(LUISPredictMask, LUISPreviewURL, appId, appKey, LUISVerboseURL,
                        encodeURIComponent(text))
                };
                httpHelper(LUISOptions, responseHandlers);
            },
            /**
             * Initiates the prediction procedure
             * @param text a String containing the text which needs to be analysed and predicted
             * @param LUISresponse an object that contains the context ID of the dialog
             * @param responseHandlers an object that contains "onSuccess" and "onFailure" functions to be executed
             * on the success or failure of the web request
             */
            reply: function (text, LUISresponse, responseHandlers) {
                //TODO: When the reply can be used in the published version this condition has to be removed
                if (!preview) {
                    throw new Error('Reply can only be used with the preview version');
                }
                text = validateText(text);
                validateLUISresponse(LUISresponse);
                validateResponseHandlers(responseHandlers);
                var LUISOptions = {
                    path: stringFormat(LUISReplyMask, LUISPreviewURL, appId, appKey, LUISresponse.dialog.contextId,
                        LUISVerboseURL, encodeURIComponent(text))
                };
                httpHelper(LUISOptions, responseHandlers);
            }
        };
    };


    /**
     * Initiates the web request
     * @param LUISOptions a String containing the text which needs to be analysed and predicted
     * @param responseHandlers an object that contains "onSuccess" and "onFailure" functions to be executed
     * on the success or failure of the web request
     */
    var httpHelper = function (LUISOptions, responseHandlers) {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function () {
            if (xmlHttp.readyState !== 4) {
                return;
            }
            if (xmlHttp.status >= 200 && xmlHttp.status < 300) {
                LUISresponse = LUISResponse(xmlHttp.responseText);
                responseHandlers.onSuccess(LUISresponse);
            } else {
                var err;
                if (xmlHttp.status === 400) {
                    err = Error('Invalid Application Id');
                } else {
                    err = Error('Invalid Subscription Key');
                }
                responseHandlers.onFailure(err);
            }
        };
        xmlHttp.open('GET', LUISOptions.path, true);
        xmlHttp.send();
    };


    /**
     * Validates initialization object of LUISClient
     * @param initData an object that has 4 propertes:
     * @1- appId a String containing the Application Id
     * @2- appKey a String containing the Subscription Key
     * @3- preview a Boolean to choose whether to use the preview version or not
     * @4- verbose a Boolean to choose whether to use the verbose version or not
     */
    var validateInitData = function (initData) {
        if (initData === null || typeof initData === 'undefined') {
            throw Error('Null or undefined initialization data for LUISClient');
        }
        if (!initData.hasOwnProperty('appId')) {
            throw Error('You have to provide an Application Id in the initialization data object');
        }
        if (!initData.hasOwnProperty('appKey')) {
            throw Error('You have to provide an Subscription Key in the initialization data object');
        }
    };

    /**
     * Validates the App info parameters such as Application Id and SubscriptionKey
     * @param appInfoParam a String that represents an App info parameter
     * @param appInfoParamName a String containing the parameter's name
     */
    validateAppInfoParam = function (appInfoParam, appInfoParamName) {
        validateStringParam(appInfoParam, appInfoParamName);
        if (appInfoParam === '') {
            throw Error('Empty ' + appInfoParamName);
        }
        if (appInfoParam.indexOf(' ') !== -1) {
            throw Error('Invalid ' + appInfoParamName);
        }
    };

    /**
     * Validates the text to predict
     * @param text a String containing the text which needs to be analysed and predicted
     * @returns a string containing the processed text to use for prediction
     */
    var validateText = function (text) {
        validateStringParam(text, 'Text to predict');
        text = text.trim();
        if (text === '') {
            throw new Error('Empty text to predict');
        }
        return text;
    };

    /**
     * Validates a string parameter
     * @param param a string that represents a parameter to a function
     * @param paramName the parameter's name
     */
    var validateStringParam = function (param, paramName) {
        if (typeof param === 'undefined' || param === null) {
            throw Error('Null or undefined ' + paramName);
        }
        if (typeof param !== 'string') {
            throw Error(paramName + ' is not a string');
        }
    };

    /**
     * Validates a boolean parameter
     * @param param a boolean that represents a parameter to a function
     * @param paramName a String that represents the parameter's name
     */
    var validateBooleanParam = function (param, paramName) {
        if (typeof param === 'undefined' || param === null) {
            param = false;
        }
        if (typeof param !== 'boolean') {
            throw Error(paramName + ' flag is not boolean');
        }
        return param;
    };

    /**
     * Validates the response handlers
     * @param responseHandlers an object that contains "onSuccess" and "onFailure" functions to be executed
     * on the success or failure of the web request
     */
    var validateResponseHandlers = function (responseHandlers) {
        if (typeof responseHandlers === 'undefined' || responseHandlers === null) {
            throw new Error('You have to provide a response handlers object ' +
                'containing "onSuccess" and "onFailure" functions')
        }
        if (!responseHandlers.hasOwnProperty('onSuccess') || typeof responseHandlers.onSuccess === 'undefined'
            || responseHandlers.onSuccess === null || typeof responseHandlers.onSuccess !== 'function') {
            throw new Error('You have to provide an "onSuccess" function as a property ' +
                'of the response handlers object')
        }
        if (!responseHandlers.hasOwnProperty('onFailure') || typeof responseHandlers.onFailure === 'undefined'
            || responseHandlers.onFailure === null || typeof responseHandlers.onFailure !== 'function') {
            throw new Error('You have to provide an "onFailure" function as a property ' +
                'of the response handlers object')
        }
    };

    /**
     * Validates the LUISresponse
     * @param LUISresponse an object that contains the context ID of the dialog
     */
    var validateLUISresponse = function (LUISresponse) {
        if (typeof LUISresponse === 'undefined' || LUISresponse === null || !LUISresponse.hasOwnProperty('dialog')
            || typeof LUISresponse.dialog === 'undefined' || !LUISresponse.dialog.hasOwnProperty('contextId')
            || typeof LUISresponse.dialog.contextId === 'undefined' || typeof LUISresponse.dialog.contextId !== 'string') {
            throw Error('You have to provide a LUISResponse object containing the Context Id of the dialog' +
                ' you\'re replying to');
        }
    };


    /**
     * Validates the JSON response and attaches extra helper properties to it
     * @param JSONResponse a string that represents the JSON response of LUIS
     */
    var LUISResponse = function (JSONResponse) {
        if (typeof JSONResponse === 'undefined' || JSONResponse === null || JSONResponse.length === 0) {
            throw Error('Invalid Application Id');
        }
        var LUISresponse = JSON.parse(JSONResponse);
        if (LUISresponse.hasOwnProperty('statusCode')) {
            throw Error('Invalid Subscription Key');
        }
        if (LUISresponse.hasOwnProperty('topScoringIntent') && LUISresponse.topScoringIntent !== null
            && typeof LUISresponse.topScoringIntent !== 'undefined') {
            LUISresponse.intents = [LUISresponse.topScoringIntent];
        } else if (LUISresponse.hasOwnProperty('intents') && LUISresponse.intents !== null
            && typeof LUISresponse.intents !== 'undefined' && LUISresponse.intents.length > 0) {
            LUISresponse.topScoringIntent = LUISresponse.intents[0];
        }
        if (LUISresponse.hasOwnProperty('dialog') && typeof LUISresponse.dialog !== 'undefined') {
            LUISresponse.dialog.isFinished = function () {
                return this.status === 'Finished';
            };
        }
        return LUISresponse
    };

    var stringFormat = function () {
        var s = arguments[0];
        for (var i = 0; i < arguments.length - 1; i++) {
            var regExp = new RegExp('\\{' + i + '\\}');
            s = s.replace(regExp, arguments[i + 1]);
        }
        return s;
    };
})();