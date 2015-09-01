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
  updateSheet(SpreadsheetApp.getActiveSpreadsheet(), {
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
  var name = "" + date.getFullYear() + ( '0' + (date.getMonth() + 1) ).slice( -2 )
  var sheet = ss.getSheetByName(name);
  if (sheet == null) {
    Logger.log('Not found the sheet: ' + name);
    return name + 'シートが見つかりません';
  }
  
  var row = 13 + (day ? parseInt(day) : date.getDate());
  
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


