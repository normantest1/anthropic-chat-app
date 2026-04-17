# anthropic-chat-app



一个用于支持anthropic api的大模型聊天测试应用，如果你购买了大模型相关的code plan服务，想测试该服务效果，但又不想编写麻烦的代码，就可以使用本项目，只许填写相关配置，就可以直接聊天

![](https://github.com/normantest1/anthropic-chat-app/blob/main/souye.png)

### 如何使用

##### 直接下载

如果你是windows 64位版本的话，直接下载[打包好的文件](https://github.com/normantest1/anthropic-chat-app/releases/latest)就可以了，解压后，打开它，并访问http://localhost:3000端口

如果你是其它系统，则需要自己构建项目或直接打开测试模式

##### 自己构建项目

本步骤默认用户已经安装了NodeJS并在控制台能直接使用npm命令

1. 下载本项目文件

   ```
   git clone https://github.com/normantest1/anthropic-chat-app.git
   cd anthropic-chat-app
   ```

2. 安装

   ```
   npm install
   ```

3. 构建或进入测试模式

   3.1 如果你想要在任意目录下运行文件或分发给别人，则选择构建项目

   

   ```
   npm run build
   ```

   项目构建完成后，需要将public文件夹复制到dist文件夹内，都完成操作步骤后，双击它

   3.2 如果你有其他选择，可以选进入测试模式

   ```
   npm run dev
   ```

4. 浏览器访问 http://localhost:3000

