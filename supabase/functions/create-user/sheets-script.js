// Cole este código no Google Apps Script da sua planilha
// Extensões → Apps Script → cole aqui → salve → configure o gatilho

var WEBHOOK_URL = 'https://qahwetokqnejlbqlufqg.supabase.co/functions/v1/create-user';

function onFormSubmit(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();

  var nome    = sheet.getRange(lastRow, 1).getValue(); // coluna A
  var email   = sheet.getRange(lastRow, 2).getValue(); // coluna B
  var celular = sheet.getRange(lastRow, 3).getValue(); // coluna C

  if (!email || !celular) return;

  var payload = JSON.stringify({
    name:  nome,
    email: email,
    phone: String(celular)
  });

  var options = {
    method: 'post',
    contentType: 'application/json',
    payload: payload,
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(WEBHOOK_URL, options);
  Logger.log('Status: ' + response.getResponseCode());
  Logger.log('Resposta: ' + response.getContentText());
}
