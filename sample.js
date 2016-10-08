var previousResponse = null;

var Predict = function() {
    try {
        var LUISclient = LUISClient({
            appId: $('#appIdTxt').val(),
            appKey: $('#appKeyTxt').val(),
            preview: true,
            verbose: true
        });

        LUISclient.predict($('#queryTxt').val(), {

            //On success of prediction
            onSuccess: function (response) {
                processOnSuccess(response);
            },

            //On failure of prediction
            onFailure: function (err) {
                processOnFailure(err);
            }
        });
    } catch (e) {
        processOnFailure(e);
    }
};

var Reply = function() {
    try {
        if (typeof previousResponse === 'undefined' || previousResponse === null
            || typeof previousResponse.dialog === 'undefined' || previousResponse.dialog === null) {
            processNoPreviousResponse();
            return;
        }

        var LUISclient = LUISClient({
            appId: $('#appIdTxt').val(),
            appKey: $('#appKeyTxt').val(),
            preview: true,
            verbose: true
        });

        LUISclient.reply($('#queryTxt').val(), previousResponse, {

            //On success of prediction
            onSuccess: function (response) {
                processOnSuccess(response);
            },

            //On failure of prediction
            onFailure: function (err) {
                processOnFailure(err);
            }
        });
    } catch (e) {
        processOnFailure(e);
    }
};

var processOnSuccess = function(response) {
    previousResponse = response;
    var msg = 'Query: ' + response.query;
    msg += '</br>Top Intent: ' + response.topScoringIntent.intent;
    msg += '</br>Entities:';
    for (var i = 1; i <= response.entities.length; i++) {
        msg += '</br>' + i + '- ' + response.entities[i - 1].entity;
    }
    if (typeof response.dialog !== 'undefined' && response.dialog !== null) {
        msg += '</br>Dialog Status: ' + response.dialog.status;
        if (!response.dialog.isFinished()) {
            msg += '</br>Dialog Parameter Name: ' + response.dialog.parameterName;
            msg += '</br>Dialog Prompt: ' + response.dialog.prompt;
        } else {
            previousResponse = null;
        }
    }
    $('#msg').html(msg);
    $('#queryTxt').val('');
};

var processOnFailure = function(err) {
    $('#msg').html(err);
    $('#queryTxt').val('');
};

var processNoPreviousResponse = function(response) {
    $('#msg').html('Nothing to reply to!');
    $('#queryTxt').val('');
};