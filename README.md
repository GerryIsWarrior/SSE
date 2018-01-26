# SSE设计方案(现已支持npm安装)

#### npm安装，文档见底部
    npm i sse-js  /  yarn add sse-js
    
#### 一些概念
  * Server-Sent Events：简称SSE技术，也是前端es5支持的一种基于http协议的服务器推送技术。
  * EventSource：js中承载SSE技术的主要核心方案和方法
  * 单工通道：只能一方面的数据导向，例如，在我们前端，我们通过浏览器向服务器请求数据，但是服务器不会主动推送数据给我们，这就是单通道
  * 双工通道：类似webSocket这样的技术，客户端可以推数据给服务器，服务器也可以推数据给客户端
  * 定点推送：服务器可以将数据针对单个客户端推送
  * 多人推送：服务器可以将数据一次性推送给所有人
  
#### 官方设计标准和浏览器实现
  * [设计标准，约定浏览器的实现方式](https://html.spec.whatwg.org/multipage/server-sent-events.html#server-sent-events)
  * [MDN使用方式API介绍](https://developer.mozilla.org/zh-CN/docs/Server-sent_events/EventSource)
  * [服务器推送流API](https://developer.mozilla.org/zh-CN/docs/Server-sent_events/Using_server-sent_events)
  
####兼容性如下图：
  ![](https://images2017.cnblogs.com/blog/801930/201710/801930-20171015211314199-1753271813.png)
  
####兼容性方案
在所有IE系列中都不支持，其他浏览器几乎都可以实现，所以为了实现万恶的IE，会有如下2种方案
  1. 在其他浏览器上使用原生 EventSource 对象，而在 IE 上则使用简易轮询或 COMET 技术来实现；
  2. 使用 polyfill 技术，即使用第三方提供的 JavaScript 库来屏蔽浏览器的不同。本文使用的是 polyfill 技术，只需要在页面中加载第三方 JavaScript 库即可。应用本身的浏览器端代码并不需要进行改动。
  
####相对于其他通信技术选型考虑点（待补充）
  * sse是基于http协议的，对于现有项目的改造和支持是成本最低的方案。webSocket需要前后端全都换上新的协议支持
  * 对于推送的频率来说，针对小于1次/1的推送，sse的使用最合适。大于1次的使用不划算，建议webSocket（考虑成本）
  * WebSocket 技术也比较复杂，包括服务器端和浏览器端的实现都不同于一般的 Web 应用
  * 对于轮询来说的话，每次的http协议的创建和销毁对性能有点要求，况且对这个轮询的时间点也不是能特别好的把握
  
#### 客户端代码实现
全局配置参数：

      var initParam = {
        url :'',                                //所链接的服务器地址
        data:'',                                //所发送的客户端数据
        customEvent:[],                         //自定义事件 格式：[{name:'事件名称',callback:function(res){}}]
        withCredentials:false,                 //是否发送跨域凭证
        serverTimeout:60000,                    //服务器http默认超时时间   带考虑：客户端配置服务器时间，不安全
        clientConnection:3000,                  //设置浏览器重连时间，浏览器默认3s重连，
        openEvent:function () {},              //客户端开始链接的事件
        messageEvent:function () {},           //客户端接受到消息的事件（如不自定义系统默认）
        errorEvent:function () {}              //客户端错误事件
      }
      
客户端建立连接：

    // 抛出对象
    var output = {
    create:function (options) {
      // 处理参数
      var param = tool.initParam(options),sendData = '';
    
      // 是否有url传值
      if (param.data){
        tool.each(param.data, function (item, index) {
          sendData += (index + "=" + item + "&")
        });
        sendData = sendData.slice(0, -1);
      }
    
      // 与服务器建立http通道
      var es = new EventSource(param.url+'?'+sendData);
    
      // 建立默认事件监听：打开、获得消息、错误
      es.addEventListener('open',function (e) {
        param.openEvent(e)
      });
    
      es.addEventListener('message',function (e) {
        param.messageEvent(e)
      });
    
      es.addEventListener('error',function (e) {
        param.errorEvent(e)
        es.close()  // 关闭连接
      });
    
      // 创建用户自定义事件
      if (param.customEvent.length > 0){
        tool.each(param.customEvent,function (item) {
          es.addEventListener(item.name,item.callback);
        })
      }
    }
    
客户端代表状态只读参数 es.readyState：     
 * CONNECTING，表示连接还未建立，或者连接断线。
 * OPEN，表示连接已经建立，可以接受数据。
 * CLOSED，表示连接已断，且不会重连。
 
 message回调返回值：      
  * data：服务器端传回的数据
  * origin： 服务器端URL的域名部分，即协议、域名和端口。
  * lastEventId：数据的编号，由服务器端发送。如果没有编号，这个属性为空。
  
#### 服务器代码实现（编码格式永远都是：）
服务器推送参数：
  * ：这是注释　　　　    单独一个冒号，代表服务器推送的一个注释。（这个可解决http中的324，发送心跳包）
  * id：11　　　　　　代表数据标识符，代表当前数据的唯一标识（如果断线，客户端会在下次http head中发送这个标识，可做数据传输标记）
  * data：我是谁　　　　这个数据就是客户端所接受到的数据（可推送格式化过的json数据）
  * event：myEvent　　  服务器返回客户端所执行事件（如不定义默认执行message事件）
  * retry：3000　　　　  客户端在http超时断开后多长时间重新连接
  
#### API文档
    1. SSE.create(object)       创建监听推送方法
        参数类型：object  
        参数内容：见上面配置参数
        demo：
            SSE.create({url:'http://localhost:8074'})
  
  
### 场景案例引导
#### 1. 聊天系统（只要服务器支持可以支持任意多人在线）     
  * 介绍：既然服务器有了主动推送给客户端的能力，那么最重要的基础场景就是交流。所以这个聊天系统demo应运而生
  * demo查看：js-demo/index_chat.html     
 
 测试结果：
  1. 测试2个用户的聊天场景
  ![](https://images2017.cnblogs.com/blog/801930/201801/801930-20180124142050772-2077680413.png)      
  2. 第二个用户接受到的推送
  ![](https://images2017.cnblogs.com/blog/801930/201801/801930-20180124142101787-787156837.png)
  3. 监控chrome的请求
  ![](https://images2017.cnblogs.com/blog/801930/201801/801930-20180124142108694-2016517960.png)
  
  总结：这个聊天系统的demo，创建了2个用户，用左边用户进行发送，监控右边用户的控制台的network，可以查看到通信的请求，在左边用户每次发完消息之后，右边用户每次都接受到数据，然后处理到聊天系统界面。其实sse后端底层也类似于长连接，只是多了一个服务器可以反向推的动作。
  
#### 2. 性能优化缓存的更新(模拟localStory缓存数据更新)    
  * 介绍：因为前端浏览器的机制，将所有用的数据请求过来，没有请求的页面也能跑起来。所以对于做前端优化的同学就明白一件事，希望用户能更多的缓存命中我们存储在用户浏览器中的一些数据，这样对于第一次加载之后，如果一些缓存数据没动的data，直接取出来，渲染到用户浏览器中。这样给用户的感觉就是秒开的感觉（大家可以参考京东网站的首页优化，首屏啊，二次打开等等）
  * demo查看：js-demo/index_cache.html     
 
 测试结果：
  1. 本地的基础缓存
  ![](https://pic3.zhimg.com/80/v2-4ca03480e63ba8dd5afdd9eeccf5ac3f_hd.jpg)      
  2. 服务器推送过来的新缓存
  ![](https://pic2.zhimg.com/80/v2-be3ae3c94aeba733a093555826402fea_hd.jpg)
  3. 本地localStory的更新
  ![](https://pic1.zhimg.com/80/v2-055dd1472fd784efd972f39d356207a6_hd.jpg)
  4. postman推送的信息
  ![](https://pic1.zhimg.com/80/v2-7c02bde28d906fde54fa7fccd66896e9_hd.jpg)
  
  总结：测试页面，首先我在代码中固定写了一个dom的我是基础缓存的数据，存到localStory中。然后对于这个打开我们的网页在线上的用户，我使用了postman往我的借口里发送数据，触发推送的动作，比如我的demo中就是发送了一个‘我试更新过的混存数据’，然后推送到客户端，然后客户端接收到这个event，然后更新缓存。这样就完成了线上缓存更新的方式。这样避免了让用户再刷一次页面（重新请求页面数据，比对缓存版本啥的），毕竟用户，才是我们的上帝。
  
#### 3. 线上代码热修复以及生产版本更新提示用户重新拉取页面(模拟一个线上案例)    
  * 介绍：对于现在更多的spa来说，浏览器下载结束了代码，你使用的代码就是浏览器下载的，如果这块前端代码是有问题的，那么生产跑得代码都是有问题代码，除非用户手动刷新页面，重新请求一个正确的生产代码。
  * demo查看：js-demo/index_hotRepair.html     
 
 测试结果：
  1. 线上计算金额，打了8折
  ![](https://pic3.zhimg.com/80/v2-c888acd9ec2c66672b2afed37db687b2_hd.jpg)      
  2. 推送新的折扣，9折
  ![](https://pic3.zhimg.com/80/v2-63d4d6033d07af47ae9aa28de0e5ec26_hd.jpg)
  3. 用户重新计算为9折的结果
  ![](https://pic2.zhimg.com/80/v2-0b95d3cd29652eb6b4cff02697c26255_hd.jpg)
  
  总结：这个案例就是这样，之前我们写死了线上代码要打8折，所以我们最后计算金额的时候就是按照8折去计算的。但是产品过来说，不应该这样啊，这TM不是打9折吗？这样公司会亏损严重的。然后大家都蒙蔽，修正发布。然后发现用户的页面还是8折，用户没刷新。尴尬.....通过正在线上的推送，来进行代码的热修复。比如我推送了一个9折的信息，然后客户端接受处理了，哪怕正在线上的用户都按正确的9折来计算。挽回了公司的损失。
     
     
     
PS：如果线上改动太多太多了，不好进行局部热修复方案，只能让正在用的用户强制更新，拉新数据
 * 让用户强制更新，止损
 ![](https://pic4.zhimg.com/80/v2-b522b1655da6f02909a6398d9e3c30df_hd.jpg)
 
 
 #### 个人介绍
   * 性别：男
   * 爱好：女
   * 近期目标：前端架构师
   * 职业目标：全栈架构师
   * 博客园:http://www.cnblogs.com/GerryOfZhong
   * 知乎:https://www.zhihu.com/people/zhong-qiang-51-33/activities
   * 格言：我可能推动不了前端技术的进步，但是我可以让前端技术变得更美好.....