var TOKEN='<your private keyword>';

function doPost(e) {
  var status;
  
  if (e.parameter.token === TOKEN) {
    status = updateSheet(SpreadsheetApp.openByUrl(e.parameter.url), e.parameter);
  } else {
    status = '認証に失敗しました。';
  }
  
  return ContentService
  .createTextOutput(JSON.stringify({status:status}))
  .setMimeType(ContentService.MimeType.JSON);

}

function myFunction() {
  var url = "https://docs.google.com/spreadsheets/d/.../edit";
  updateSheet(SpreadsheetApp.openByUrl(url)/*SpreadsheetApp.getActiveSpreadsheet()*/, {
    day: 3, // 1-31
    type: '出勤',
    inTime: '8:45',
    outTime: '18:44',
    breakTime: '0:15'
  });
}

function updateSheet(ss, params) {
  var day = params.day; // 1-31
  var type = params.type; //'出勤';
  var inTime = params.inTime; //'8:45';
  var outTime = params.outTime; //'18:44';
  var breakTime = params.breakTime; //'0:15';
  
  var date = new Date();
  var year = date.getFullYear();
  var month = date.getMonth() + 1;
  day = day ? parseInt(day) : date.getDate()
  
  var name = "";
  if (year === 2015 && (month === 9) && day <= 15) { // 開始なので特別
    name = "0901-0915";
  } else {
    var m = day <= 15 ? month - 1 : month;
    name = ('0' + m).slice(-2) + "16-" + ('0' + (m % 12 + 1)).slice(-2) + "15";
  }
  
  var sheet = ss.getSheetByName(name);
  if (sheet == null) {
    Logger.log('Not found the sheet: ' + name);
    return name + 'シートが見つかりません';
  }
  
  // 日付
  var range = sheet.getRange(14, 1, 44 - 14 + 1, 3);
  var values = range.getValues();
  var row = -1;
  for (var index = 0, len = values.length; index < len; index++) {
    var value = values[index][0];
    // js date <- excel serial http://yooogooo.blogspot.jp/2011/12/google-apps-scriptgoogle.html
    var date = new Date((value - 25569) * (1000 * 60 * 60 * 24) - (1000 * 60 * 60 * 9/*TMZ*/));
    if (date.getDate() === day) {
      row = 14 + index;
      break;
    }
  };
  if (row === -1) {
    Logger.log('Not found the row: ' + day);
    return '日付けが見つかりません';
  }
  
  var typeCell = sheet.getRange("E" + row);
  var inCell = sheet.getRange("I" + row);
  var outCell = sheet.getRange("L" + row);
  var breakCell = sheet.getRange("O" + row);
  
  if (type) {
    typeCell.setValue(type);
  }
  if (inTime) {
    inCell.setValue(inTime);
  }
  if (outTime) {
    outCell.setValue(outTime);
  }
  if (breakTime) {
    breakCell.setValue(breakTime);
  }
  
  Logger.log(ss.getUrl());
  return 'success';
}


