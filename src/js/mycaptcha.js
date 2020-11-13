
const puppeteer = require("puppeteer-core")
const Rembrandt = require('rembrandt') // 比较图片的库
const fs = require('fs').promises

async function mycaptcha_run(page) {  
	await trigger(page)
    await saveFullBg(page)
    const {sliderAttrs, barAttrs} = await getElAttrs(page)
    await mousedown(page, sliderAttrs)
    
    await mouseup(page)
}

/**
 *
 * 打开页面
 */
async function openPage() {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: true,
    defaultViewport: { width: 1366, height: 768 }
  })
  const page = await browser.newPage()
  await page.goto('https://www.geetest.com/demo/slide-float.html')
  return page
}

/**
 *
 * 点击按钮触发验证码
 */
async function trigger(page) {
  const triggerBtnElementHandle = await page.waitForSelector('#casLoginForm > p:nth-child(4) > button') // 点击触发验证码的按钮
  const triggerBtnAttrs = await triggerBtnElementHandle.boundingBox()
  await page.mouse.move(
    triggerBtnAttrs.x + triggerBtnAttrs.width / 2,
    triggerBtnAttrs.y + triggerBtnAttrs.height / 2
  )
  await page.mouse.down()
  await page.mouse.up()
}

/**
 *
 * 获取canvas数据，转换成buffer
 */
async function getCanvasData(page, selector) {
  const handle = await page.waitForSelector(selector)
  const canvasData = await page.evaluate(el => {
    return el.toDataURL().replace('data:image/png;base64,', '')
  }, handle)

  const buffer = Buffer.from(canvasData, 'base64')
  return buffer
}
/**
 *
 * 获取Img数据，转换成buffer
 */
async function getImgData(page, selector) {
  const handle = await page.waitForSelector(selector)
  const imgdata = await page.evaluate(el => {
    return el.src.replace('data:image/png;base64,', '')
  }, handle)

  const buffer = Buffer.from(imgdata, 'base64')
  return buffer
}
/**
 *
 * 将完整图片保存到本地，每次滑动进行对比。
 */
async function saveFullBg(page,selector,filepath) {
  await page.waitForSelector(selector)
    const fullBgBuffer = await getImgData(page, selector)

  await fs.writeFile(filepath, fullBgBuffer).catch(e => {
    console.log(e)
    })
}

/**
 *
 * 获取滑动按钮、滑动条的元素属性和位置。
 */
async function getElAttrs (page) {
    const sliderElHandle = await page.$('#captcha > div > div.sliderMask > div') // 滑块
    const sliderAttrs = await sliderElHandle.boundingBox()
	console.log("sliderAttrs=  ",sliderAttrs)
    const barElHandle = await page.$('#captcha > div') // 滑动条
    const barAttrs = await barElHandle.boundingBox()
    console.log("barAttrs=  ", barAttrs)
    return {
        sliderAttrs,
        barAttrs
    }
}

/**
 *
 * 按下鼠标
 */
async function mousedown (page, sliderAttrs) {
  await page.mouse.move(
    sliderAttrs.x + sliderAttrs.width / 2,
    sliderAttrs.y + sliderAttrs.height / 2
  )
    await page.mouse.down()
}

/**
 *
 * 按每次5px递增，进行滑动。进行截图。
 * 比较原图和每次截图的diff，取最小的一次为目标位置
 */
async function explorePosition (page, sliderAttrs, barAttrs) {
    let currentPosition = 0
  let bestSlider = {
    position: 0,
    difference: 100
    }

  while (currentPosition < barAttrs.width - sliderAttrs.width / 2) {
    await page.mouse.move(
      sliderAttrs.x + currentPosition,
      sliderAttrs.y + sliderAttrs.height / 2 + Math.random() * 10 - 5
    )

    let bgWrapperHandle = await page.$('#captcha') // 验证码背景外层节点
    let sliderImage = await bgWrapperHandle.screenshot() // 给验证码背景截图
    await fs.writeFile('./assets/now.jpeg', sliderImage)
    const rembrandt = new Rembrandt({
      imageA: './assets/fullBg.png',
      imageB: sliderImage,
      thresholdType: Rembrandt.THRESHOLD_PERCENT
    })

    let result = await rembrandt.compare()

    let difference = result.percentageDifference * 100

    if (difference < bestSlider.difference) {
      bestSlider.difference = difference
      bestSlider.position = currentPosition
    }

    currentPosition += 10
    }
    return bestSlider
}

/**
 *
 * 将滑块移动到目标位置
 */
async function gotoTargetPosition (page, position,sliderAttrs, barAttrs) {
  // 每100毫秒执行一次慢慢移动到目标位置
  await page.mouse.move(
    barAttrs.x + position+ sliderAttrs.width/2 + 2,
    barAttrs.y + barAttrs.height / 2 + Math.random() * 10 - 5,
    { steps: 30 }
  )
}

/**
 *
 * 滑动结束，放起按钮。
 */
async function mouseup (page) {
    await page.mouse.up()
}

module.exports = {gotoTargetPosition,saveFullBg,getElAttrs,mousedown,mouseup};

