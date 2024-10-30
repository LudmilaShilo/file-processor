import { expect } from "chai";
import request from "supertest";
import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";

import app from "../../app.js";
import "../../config.js";

const fileSizeInMB = parseInt(process.env.fileSizeInMB, 10);

describe("upload normal file", function () {
  let largeBuffer = Buffer.alloc((fileSizeInMB - 1) * 1024 * 1024 + 1);
  it(`user does't login`, async () => {
    const res = await request(app)
      .post("/api/v1/files/")
      .attach("file", largeBuffer, "large_test_file.txt");
    expect(res.status).to.equal(401);
    expect(JSON.parse(res.text).message).to.equal(
      "You are not logged in. Pls, log in to get access!"
    );
  });
  /* it("returns an error when uploading a file larger than allowed size", async function () {
    // Генеруємо великий буфер для симуляції файлу розміром більше, ніж дозволено
    const largeBuffer = Buffer.alloc((fileSizeInMB + 1) * 1024 * 1024 + 1); // 101 МБ
    let res;
    try {
      res = await request(app)
        .post("/api/v1/files/")
        .attach("file", largeBuffer, "large_test_file.txt");
    } catch (err) {
      console.log("err", error);
    }

    console.log("res.status", res.status);
    console.log("res.body", res.body);

    // Перевірка статусу та повідомлення про помилку
    expect(res.status).to.equal(413);
    expect(res.body)
      .to.have.property("error")
      .that.equals("The file exceeds the allowed size");
  }); */
});
