const fs = require('fs');
const child_process = require('child_process');
var path1 = "./assets/fullBG.png"
var path2 = "./assets/block.png"
const main =async () => {
	
	const offset =await getCaptchaOffset();	
	console.log(offset)	
	
}
async function hello() {
  return greeting = await Promise.resolve("Hello");
}
async  function getCaptchaOffset() {
	return new Promise((resolve, reject) => {
		
		var workerProcess = child_process.exec('python ../py/captcha.py'+" "+ path1+" "+ path2, function (error, stdout, stderr) {
        if (error) {
            console.log(error.stack);
            console.log('Error code: '+error.code);
            console.log('Signal received: '+error.signal);
        }
		if (stderr){
			console.log('stderr: ' + stderr);
		}
			console.log('stdout: ' + stdout);			      
			
			resolve(stdout)
			return 
		});		
		workerProcess.on('exit', function (code) {
			console.log('子进程已退出，退出码 '+code);
		});
		
		
	})	
	
}

main()
