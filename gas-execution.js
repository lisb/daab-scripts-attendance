

var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/script-nodejs-quickstart.json
var SCOPES = [];
var SECRET_PATH = 'client_secret.json';
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '/.credentials/';
var TOKEN_NAME = 'gas-execution.json';
var TOKEN_PATH = TOKEN_DIR + TOKEN_NAME;
var SCRIPT_ID = 'ENTER_YOUR_SCRIPT_ID_HERE';

var CLIENT;

function setOptions(options) {
  if (options.scopes) SCOPES = options.scopes;
  if (options.secretPath) SECRET_PATH = options.secretPath;
  if (options.tokenDir) TOKEN_DIR = options.tokenDir;
  if (options.tokenName) TOKEN_NAME = options.tokenName;
  if (options.tokenPath) TOKEN_PATH = options.tokenPath;
    else TOKEN_PATH = TOKEN_DIR + TOKEN_NAME;
  if (options.scriptId) SCRIPT_ID = options.scriptId;
}

function getClient(callback) {
  if (CLIENT) {
    callback(null, CLIENT);
    return;
  }
  // Load client secrets from a local file.
  fs.readFile(SECRET_PATH, function processClientSecrets(err, content) {
    if (err) {
      console.log('Error loading client secret file: ' + err);
      callback(err);
      return;
    }
    // Authorize a client with the loaded credentials, then call the
    // Google Apps Script Execution API.
    authorize(JSON.parse(content), function(auth) {
      CLIENT = auth;
      callback(null, CLIENT);
    });
  });
}

function doPost(params, callback) {
  getClient(function(err, auth) {
    if (err) {
      callback(err);
      return;
    }
    callAppsScript(auth, 'doPost', params, callback);
  });
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}

/**
 * Call an Apps Script function to list the folders in the user's root
 * Drive folder.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function callAppsScript(auth, name, params, callback) {
  var scriptId = SCRIPT_ID;
  var script = google.script('v1');
console.log({
    auth: auth,
    resource: {
      function: name,
      parameters: [ { parameter: params.formData } ]
    },
    scriptId: scriptId
  });
  // Make the API request. The request object is included here as 'resource'.
  script.scripts.run({
    auth: auth,
    resource: {
      function: name,
      parameters: [ { parameter: params.formData } ]
    },
    scriptId: scriptId
  }, function(err, resp) {
    console.log(err, resp);
    if (err) {
      // The API encountered a problem before the script started executing.
      callback(err, null, '{"status":"' + err + '"}');
      return;
    }
    if (resp.error) {
      // The API executed, but the script returned an error.

      // Extract the first (and only) set of error details. The values of this
      // object are the script's 'errorMessage' and 'errorType', and an array
      // of stack trace elements.
      var error = resp.error.details[0];
      callback(error, null, '{"status":"' + error.errorMessage + '"}');

    } else {
      // The structure of the result will depend upon what the Apps Script
      // function returns.
      callback(null, null, resp.response.result);
    }

  });
}

module.exports = {
  setOptions:setOptions,
  post:doPost
};
