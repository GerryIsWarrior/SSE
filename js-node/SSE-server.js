var http = require("http");
var url = require('url');

http.createServer(function (req, res) {
    var arg1 = url.parse(req.url, true).query;
    console.log(arg1.name);
    // 设置跨域和响应
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
    res.setHeader('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
    });
    setInterval(function () {
        res.write("id: 1\n");                                   //设置当前数据的唯一标识
        res.write("event: message\n");                          //设置浏览器响应的函数
        res.write("retry: 10000\n");                            //设置浏览器断线重连的时间
        res.write("data:"+ new Date().toISOString() +"\n\n");    //设置当前数据的相应值
    },3000)

}).listen(8888);
