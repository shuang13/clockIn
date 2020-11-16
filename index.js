const puppeteer = require("puppeteer-core");
const {getCanvasData,gotoTargetPosition,saveFullBg,getElAttrs,mouseup,mousedown} = require("./src/js/mycaptcha");
const fs = require('fs').promises;
const child_process = require('child_process');
const request = require("request");
const { createCanvas, loadImage,Image } = require('canvas');
const sendMail = require("./src/js/mail");
const account = require("./src/js/account");

const picBG = './assets/fullBg.png'
const picBlock =  './assets/block.png'

let timeout = function (delay) {
	
	
     return new Promise((resolve, reject) => {   
           setTimeout(() => {   
                  try {
                      resolve(1)
                  } catch (e) {
                      reject(0)
                   }
           }, delay);
     })
 }

const Daka = async () => {	
		const browser = await puppeteer.launch({
			slowMo: 100,    //放慢速度
			headless: false, //开启可视化
			defaultViewport: {'width': 1920, 'height': 1080},
			executablePath: "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe", 
			ignoreHTTPSErrors: false, //忽略 https 报错
			args: ['--window-size=1920,1080']  //
		});
		const page = await browser.newPage(); // 打开一个页面, page就是后序将要操作的  

		await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36")
		// 打开拦截请求
		await page.setRequestInterception(true);
		// 请求拦截器
		// 这里的作用是在所有js执行前都插入我们的js代码抹掉puppeteer的特征
		
		page.on("request", async (req, res2) => {
			// 非js脚本返回
			// 如果html中有inline的script检测html中也要改，一般没有
			if (req.resourceType() !== "script") {
				req.continue()
				return
			}
			
			const url = req.url()
			await new Promise((resolve, reject) => {
				// 使用request/axios等请求库获取js文件
				request.get(url, (err, _res) => {
				   // 删掉navigator.webdriver
				   // 这里不排除有其它特征检测，每个网站需要定制化修改
					if (err){					
						resolve()
					}
					if (_res){
						let newRes = "navigator.webdriver && delete Navigator.prototype.webdriver;" + _res.body
						// 返回删掉了webdriver的js
						req.respond({
							body: newRes
						})
						resolve()
					}
					
				})
			})		
		})
	  
	  try {
		await page.goto("http://eportal.uestc.edu.cn", { waitUntil: "domcontentloaded"}); //页面跳转, 第二个参数为可选options, 这里表示等待页面结构加载完成, 无需等待img等资源
		console.log("登录页加载成功!"); //控制台输出一下进度

		let loginbtn = await page.$("#ampHasNoLogin");
		await Promise.all([
			loginbtn.hover(2000),
			loginbtn.focus(),		
			loginbtn.click(),
		]);
		page.setDefaultNavigationTimeout(90000);

		await page.waitForNavigation();

		console.log(account, account.name)
		const username = await page.$("#username");
		await username.type(account.name,{delay:100});
		
		const passwd =  await page.$("#password");
		await passwd.type(account.pwd,{delay:100})
		
		let submitbtn = await page.$(".auth_login_btn");
		submitbtn.hover(100);
		submitbtn.focus();
		submitbtn.click();
		console.log("请完成验证码拼图");	
		//验证码破解
		// 验证码图片（带缺口)		 	
		await saveFullBg(page,'#img1',picBG)
		await saveFullBg(page,'#img2',picBlock)
		console.log("拼图图片保存完成")
		
		const distance =await getCaptchaOffset(picBG,picBlock);
		console.log("滑块offset= " + distance);	
		// 滑块
		const {sliderAttrs, barAttrs} = await getElAttrs(page)
		await mousedown(page, sliderAttrs)    
		await gotoTargetPosition(page, distance,sliderAttrs,barAttrs)
		
		await mouseup(page)
		// 等待验证结果
		await page.waitFor(30000);
		//进入系统
		const newbtn = await page.waitForSelector('#widget-recommendAndNew-01 > div.clearfix.active.card-recommend-new-main.style-scope.pc-card-html-4786696181714491-01 > widget-app-item:nth-child(1) > div > div');
		//在点击按钮之前，事先定义一个 Promise，用于返回新 tab 的 Page 对象	
		// 轨迹模拟
		const newbtn_box = await newbtn.boundingBox();
		const destx1 = newbtn_box.x + newbtn_box.width/2
		const desty1 = newbtn_box.y+ newbtn_box.height/2
		
		//3 step 
		
		await page.mouse.move(destx1,desty1,{steps:20});
		await newbtn.focus();
		await newbtn.click();	
		await page.waitFor(8000)
		//点击按钮后，等待新tab对象
		const target = await browser.waitForTarget(t => t.url().includes('http://eportal.uestc.edu.cn/jkdkapp/sys/lwReportEpidemicStu'));
		const newPage = await target.page();	
		 
		//切换回原始
		
		const addbtn =await newPage.waitForSelector("body > main > article > section > div.bh-mb-16 > div")
		
		// 轨迹模拟
		const addbtn_box = await addbtn.boundingBox();
		const destx2 = addbtn_box.x+addbtn_box.width/2
		const desty2 = addbtn_box.y+addbtn_box.height/2
		//3 step 
		
		//await page.mouse.move(1480,278,{steps:30});
		await newPage.mouse.move(destx2,desty2,{steps:20});
		await addbtn.focus()
		await addbtn.click();	
		await newPage.waitFor(4000)
		
		await newPage.evaluate(()=>{
			document.querySelector('#save').click()
		});
		await newPage.evaluate(()=>{
			document.querySelector('.bh-color-primary-5').click()
		});
		
		await newPage.waitFor(2000)
		console.log(Date()," 打卡成功")	
		sendMail(`Success Check in at ${new Date().toLocaleString()}`);

		await browser.close();
		return "success"
		 
	  }catch (err) {
		console.log("签到过程出错了!" , err);
		await browser.close();
		
	  }
		
	
	
  
  
};

async  function getCaptchaOffset(imgpath1,imgpath2) {
	return new Promise((resolve, reject) => {
		
		var workerProcess = child_process.exec('python ./src/py/captcha.py'+" "+ imgpath1+" "+ imgpath2, function (error, stdout, stderr) {
        if (error) {
            console.log(error.stack);
            console.log('Error code: '+error.code);
            console.log('Signal received: '+error.signal);
        }
		if (stderr){
			console.log('stderr: ' + stderr);
		}
			console.log('stdout: ' + stdout);			      			
			resolve(stdout*278/590)
		});		
		workerProcess.on('exit', function (code) {
			console.log('子进程已退出，退出码 '+code);
		});
		
		
	})	
	
}
const main = async () => {
	var ret = await Daka()
	console.log(ret)
	while (ret != "success"){
		console.log("Another Try again")
		ret = await Daka()
	}
}
main()
// Daka()
module.exports = Daka
