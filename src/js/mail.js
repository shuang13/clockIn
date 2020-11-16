const nodemailer = require("nodemailer");
const user = require("./account");

const sendMail = msg => {
  nodemailer.createTestAccount((err, account) => {
    let transporter = nodemailer.createTransport({
      service: "qq", // 使用了内置传输发送邮件 查看支持列表：
      port: 465, // SMTP 端口
      secureConnection: true, // 使用了 SSL
      auth: {
        user: user.mail,
        // 这里密码不是qq密码，是你设置的smtp授权码
        pass: user.smtp
      }
    });
    let mailOptions = {
      from: "Angus<"+user.mail+">", // 发送者
      to: user.mail, // 接收者
      subject: "打卡提醒", // 主题
      html: msg // html body
    };
    console.log(mailOptions)
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log(error,"错误");
      }
      console.log("Message sent: %s", info.messageId);
    });
  });
};

module.exports = sendMail;
