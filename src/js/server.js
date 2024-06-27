import * as http from "http";
import * as fs from "fs";
import Application from "koa";
import {koaBody} from "koa-body";
import koaCors from "koa-cors";
import mime from "mime-types";
import Message from "./Message.js";
import {getAttachmentPath, loadMessages, saveAttachments, saveMessages,} from "./dataUtils.js";
import messageTypes from "./messageTypes.js";
import {decode} from "base64-arraybuffer";
import Attachment from "./Attachment.js";

const app = new Application();
const messages = loadMessages() || [];
let maxId = messages.reduce((maxId, t) => Math.max(maxId, t.id), 0);

app.use(koaCors());
app.use(
  koaBody({
    json: true,
    multipart: true,
    formLimit: "100mb",
    jsonLimit: "100mb",
    textLimit: "100mb",
    enableTypes: ["json", "form", "text"],
  }),
);
app.use((ctx, next) => {
  if (ctx.request.method !== "OPTIONS") {
    next();
    return;
  }
  ctx.response.set("Access-Control-Allow-Origin", "*");
  ctx.response.set(
    "Access-Control-Allow-Methods",
    "DELETE, PUT, PATCH, GET, POST",
  );
  ctx.response.status = 204;
});

app.use(addMessage);
app.use(allMessages);
app.use(downloadAttachment);

const server = http.createServer(app.callback());
const port = 7070;
server.listen(port, (err) => {
  if (err) {
    console.log(err);
    return;
  }
  console.log("Server is listening to " + port);
});

function addMessage(context, next) {
  if (
    context.request.method !== "POST" ||
    getMethodName(context.request) !== "addMessage"
  ) {
    next();
    return;
  }

  const {
    type,
    data,
    dateTime,
    attachments: rawAttachments,
  } = context.request.body;

  const messageId = getNextId();
  const attachments = parseAttachments(messageId, rawAttachments);
  const message = new Message(
    messageId,
    type,
    parseData(type, data),
    parseDateTime(dateTime),
    attachments.map((a) => a.name),
  );

  messages.push(message);
  saveMessages(messages);

  saveAttachments(attachments);

  context.response.body = messageToJson(message);
  context.response.set("Access-Control-Allow-Origin", "*");
  context.type = "json";
  next();
}

async function downloadAttachment(context, next) {
  if (
    context.request.method !== "GET" ||
    getMethodName(context.request) !== "downloadAttachment"
  ) {
    next();
    return;
  }

  const filePath = getAttachmentPath(
    getMessageId(context.request),
    getAttachmentName(context.request),
  );
  context.status = 200;
  context.response.body = fs.createReadStream(filePath);
  context.attachment(filePath);
  context.set("Content-type", mime.lookup(filePath));

  next();
}

function messageToJson(message) {
  return JSON.stringify(message, (key, value) => {
    if (key === "dateTime") {
      return dateTimeToString(message.dateTime);
    } else {
      return value;
    }
  });
}

function dateTimeToString(dateTime) {
  console.log(dateTime);
  return `${dateTime.getDate()}-${dateTime.getMonth()}-${dateTime.getFullYear()} ${dateTime.getHours()}:${dateTime.getMinutes()}:${dateTime.getSeconds()}`;
}

function allMessages(context, next) {
  if (
    context.request.method !== "GET" ||
    getMethodName(context.request) !== "allMessages"
  ) {
    next();
    return;
  }
  context.response.set("Access-Control-Allow-Origin", "*");
  context.response.body = JSON.stringify(messages);
  context.type = "json";
  next();
}

function getMethodName(request) {
  return request.query && request.query["method"];
}

function getMessageId(request) {
  return request.query && +request.query["messageId"];
}

function getAttachmentName(request) {
  return request.query && request.query["attachmentName"];
}

function getNextId() {
  return ++maxId;
}

function parseData(messageType, data) {
  switch (messageType) {
    case messageTypes.text:
      return data;
    case messageTypes.audio:
    case messageTypes.video:
      return decode(data);
  }
}

function parseDateTime(dateTime) {
  // example 25-06-2024 18:05:06
  const dateAndTime = dateTime.split(" ");
  const dateParts = dateAndTime[0].split("-");
  const timeParts = dateAndTime[1].split(":");
  return new Date(
    +dateParts[2],
    +dateParts[1],
    +dateParts[0],
    +timeParts[0],
    +timeParts[1],
    +timeParts[2],
  );
}

function parseAttachments(messageId, attachments) {
  const array = [];
  for (const attachment of attachments) {
    array.push(
      new Attachment(
        messageId,
        attachment.file,
        decode(attachment.arrayBuffer),
      ),
    );
  }
  return array;
}
