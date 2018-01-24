var http = require("http");
var url = require('url');
var qs = require('querystring');//解析参数的库
var sendObject = {}, count = 0;
var gerry = {}

// 向除自己的所有人推送信息
function sendAll(data) {
  for (var index in sendObject) {
    if (data.name !== index) {
      sendObject[index].write("retry: " + data.retry + "\n");
      if (data.event) {
        sendObject[index].write("event: " + data.event + "\n");
      }

      var sengData = {
        author: data.name,
        data: data.data
      }
      sendObject[index].write("data: " + JSON.stringify(sengData) + "\n\n");
    }
  }
}

// 聊天系统的demo推送测试
http.createServer(function (req, res) {

  var arg1 = url.parse(req.url, true).query;
  console.log(arg1.name);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive"
  });

  res.setTimeout(5000, function () {
    res.write(":this is test")
  })
  sendObject[arg1.name] = res;
}).listen(8074);

// ajax双工执行发送机制
http.createServer(function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
  res.writeHead(200, {
    "content-type": "application/json; charset=utf-8"
  });
  var arr = []
  new Promise(function (x, xx) {
    req.on("data", function (data) {
      arr.push(data);
    });

    req.on("end", function () {
      var data = Buffer.concat(arr).toString(), ret;
      try {
        ret = JSON.parse(data);
        x(ret)
      } catch (err) {
      }
    })
  }).then(function (req) {
    var data = {
      retry: 10000,
      name: req.name,
      data: req.message,
      event: req.event
    }
    sendAll(data)
    // res.write(Buffer.concat(arr).toString())

  })
  res.end()
}).listen(8075)


var cacheUpdate = {}

// 缓存更新和线上正在使用的代码热修复和强制用户重新请求去拉取最新代码
http.createServer(function (req, res) {

  var arg1 = url.parse(req.url, true).query;
  console.log(arg1.name);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive"
  });

  res.setTimeout(5000, function () {
    res.write(":this is test")
  })
  cacheUpdate[arg1.name] = res;
}).listen(8076);

// 触发推送的动作
http.createServer(function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
  res.writeHead(200, {
    "content-type": "application/json; charset=utf-8"
  });
  var arr = []
  new Promise(function (x, xx) {
    req.on("data", function (data) {
      arr.push(data);
    });

    req.on("end", function () {
      var data = Buffer.concat(arr).toString(), ret;
      try {
        ret = JSON.parse(data);
        x(ret)
      } catch (err) {
      }
    })
  }).then(function (req) {
    var data = {
      retry: 10000,
      name: req.name,
      data: req.message,
      event: req.event
    }

    cacheUpdate[data.name].write("retry: " + data.retry + "\n");
    cacheUpdate[data.name].write("event: " + data.event + "\n");
    cacheUpdate[data.name].write("data: " + data.data + "\n\n");

  })
  res.end()
}).listen(8077)