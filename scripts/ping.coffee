# Description:
#   Utility commands surrounding Hubot uptime.
#
# Commands:
#   hubot ping - Reply with pong
#   hubot echo <text> - Reply back with <text>
#   hubot time - Reply with current time
#   hubot die - End hubot process

request = require 'request'

botName = "勤怠管理ボット"
botEmail = process.env.HUBOT_ATTENDANCE_EMAIL

GAS_URL = process.env.HUBOT_ATTENDANCE_URL
TOKEN   = process.env.HUBOT_ATTENDANCE_TOKEN
if not GAS_URL? then throw new Error("export HUBOT_ATTENDANCE_URL=...")
if not TOKEN?   then throw new Error("export HUBOT_ATTENDANCE_TOKEN=...")

module.exports = (robot) ->
  robot.respond /PING$/i, (msg) ->
    msg.send "PONG"

  robot.join (res) ->
    res.send """
             はじめまして。#{botName}です。
             「おはよう」で出勤時間、「おつかれ」で退社時間を記録します。
            
             ・シートのURLを教えてください。
             ・「+1」「-0.75」で時差を考慮します。
             """

  robot.hear /^(Hubot )?https:\/\/drive.google.com\/open/i, (res) ->
    res.send "ブラウザで開いたときの https://docs.google.com/spreadsheets/... でお願いします。"

  robot.hear /^(Hubot )?(https:\/\/docs.google.com\/spreadsheets\/.*\/edit)/i, (res) ->
    robot.brain.set("sheet-url-#{res.message.user.id}", res.match[2])
    res.send """
             #{res.message.user.name}さんの勤怠管理のURLを覚えました。
             共有設定で #{botEmail} を編集者として登録しておいてください
             """

  robot.hear /^(Hubot )?([+-＋−][0-9.]+)/i, (res) ->
    robot.brain.set("timeshift-#{res.message.user.id}", res.match[2])
    res.send "#{res.message.user.name}さんの勤怠管理の時差を覚えました。"

  robot.hear /^(Hubot )?(おはよう|お早う)/, (res) ->
    updateSheet res, "inTime"

  robot.hear /^(Hubot )?(おつかれ|お疲れ)/, (res) ->
    updateSheet res, "outTime"

  robot.hear "stamp", (res) ->
    stampIndex = res.json.stamp_index
    switch stampIndex
      when "1152921507291204119" then updateSheet res, "inTime"
      when "1152921507291204127", "1152921507291204168" then updateSheet res, "outTime"


  updateSheet = (res, key, value) ->
    url = robot.brain.get("sheet-url-#{res.message.user.id}")
    if not url?
      res.send "先に勤怠管理のURLを教えていただけますか？" 
      return
    
    if not value?
      date = new Date()
      if date.getTimezoneOffset() != -540  # JST
        date = new Date(date.getTime() + 540 * 60 * 1000)
      shift = robot.brain.get("timeshift-#{res.message.user.id}")
      if shift? 
        date = new Date(date.getTime() + parseFloat(shift) * 3600 * 1000)
      value = date.toLocaleTimeString()

    formData = 
      url: url
      token: TOKEN
      type: switch key
        when "inTime", "outTime" then "出勤"
        else undefined
      breakTime: "1:00"
    formData[key] = value

    request.post
      url: GAS_URL
      formData: formData
      followAllRedirects: true
    , (err, httpRes, body) ->
      console.log body
      try
        json = JSON.parse(body)
        status = json.status
      catch
        found = body.match /<center>(.*)<\/center>/i
        status = if found then found[1] else ""
      if status != "success"
        res.send "更新中にエラーが起きました。#{status}"
      else
        text = switch key
          when "inTime" then "おはようございます。"
          when "outTime" then "お疲れさまでした。"
          else ""
        res.send """
                 #{text}#{res.message.user.name}さん
                 勤怠管理を更新しました。
                 #{url}
                 """

  robot.respond /ADAPTER$/i, (msg) ->
    msg.send robot.adapterName

  robot.respond /ECHO (.*)$/i, (msg) ->
    msg.send msg.match[1]

  robot.respond /TIME$/i, (msg) ->
    msg.send "Server time is: #{new Date()}"

  robot.respond /DIE$/i, (msg) ->
    msg.send "Goodbye, cruel world."
    process.exit 0

