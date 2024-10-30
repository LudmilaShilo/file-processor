const nodemailer = require("nodemailer");
const fs = require("fs/promises");
const path = require("path");
const { fileURLToPath } = require("url");
const { convert } = require("html-to-text");
require("../config.js");

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.from = `Liudmyla Shylo <${process.env.EMAIL_FROM}>`;
    this.url = url;
    this.firstName = user.name.split(" ")[0];
  }

  newTransport() {
    if (process.env.NODE_ENV === "production") {
      console.log("send by sandGrid");
      return nodemailer.createTransport({
        service: "SendGrid",
        auth: {
          user: process.env.SEND_GRID_USERNAME,
          pass: process.env.SEND_GRID_PASSWORD,
        },
      });
    }
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    const html = await fs.readFile(
      path.join(__dirname, `../views/${template}.html`),
      "utf-8"
    );

    const mailOptions = {
      from: this.from, // sender address
      to: this.to, // list of receivers
      subject,
      html,
      text: convert(html, { wordwrap: 130 }),
    };

    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send("welcome", "Welcome to the File Processor System!");
  }

  async sendResetPassword() {
    await this.send(
      "resetPassword",
      "Token to reset password (valid only 10 min!)"
    );
  }
};
