import * as http from "http";
import * as fs from "fs";
import Application from "koa";
import { koaBody } from "koa-body";
import koaCors from "koa-cors";
import mime from "mime-types";
import Message from "./Message.js";
import {
  getAttachmentPath,
  loadMessages,
  saveAttachments,
  saveMessages,
} from "./dataUtils.js";
import { decode } from "base64-arraybuffer";
import Attachment from "./Attachment.js";
import MessagesPage from "./MessagesPage.js";
import WebSocket, { WebSocketServer } from "ws";
import messageTypes from "./messageTypes.js";

const app = new Application();
const messages = loadMessages() || [];
let maxId = messages.reduce((maxId, t) => Math.max(maxId, t.id), 0);
let clientId = 0;

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
app.use(getPage);
app.use(downloadAttachment);
app.use(getClientId);

const server = http.createServer(app.callback());
const wsServer = new WebSocketServer({ server });

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
    clientId,
    type,
    data,
    dateTime,
    attachments: rawAttachments,
    location,
  } = context.request.body;

  const messageId = getNextId();
  const attachments = parseRawAttachments(messageId, rawAttachments);
  const message = new Message(
    clientId,
    messageId,
    type,
    data,
    dateTime,
    attachments.map((a) => a.name),
    location,
  );

  messages.push(message);
  saveMessages(messages);

  saveAttachments(attachments);

  sendToWsClientsMessage(message);

  context.response.body = messageToJson(message);
  context.response.set("Access-Control-Allow-Origin", "*");
  context.type = "json";
  next();
}

function sendToWsClientsMessage(message) {
  [...wsServer.clients]
    .filter((o) => o.readyState === WebSocket.OPEN)
    .forEach((o) => o.send(JSON.stringify(message)));
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
  return JSON.stringify(message);
}

function getClientId(context, next) {
  if (
    context.request.method !== "GET" ||
    getMethodName(context.request) !== "getClientId"
  ) {
    next();
    return;
  }

  context.response.set("Access-Control-Allow-Origin", "*");
  context.response.body = JSON.stringify({
    clientId: getNextClientId(),
  });
  context.type = "json";
  next();
}

function getPage(context, next) {
  if (
    context.request.method !== "GET" ||
    getMethodName(context.request) !== "getPage"
  ) {
    next();
    return;
  }

  const page = getMessagesPage(
    getPageIndex(context.request),
    getPageSize(context.request),
    getSearchText(context.request),
  );

  context.response.set("Access-Control-Allow-Origin", "*");
  context.response.body = messagesPageToJson(page);
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

function getPageIndex(request) {
  return (request.query && request.query["pageIndex"]) || 1;
}

function getPageSize(request) {
  return (request.query && request.query["pageSize"]) || 3;
}

function getSearchText(request) {
  return (request.query && request.query["searchText"]) || null;
}

function getMessagesPage(pageIndex, pageSize, searchText) {
  const filteredMessages = messages.filter(
    (m) => !searchText || searchText.length === 0 || containsText(m, searchText),
  );
  const pagesCount =
    filteredMessages.length / pageSize +
    (filteredMessages.length % pageSize !== 0 ? 1 : 0);
  pageIndex = Math.min(pageIndex, pagesCount - 1);
  const pageMessages = filteredMessages
    .slice(
      Math.max(0, filteredMessages.length - pageSize * (pageIndex + 1)),
      filteredMessages.length - pageSize * pageIndex,
    )
    .reverse();
  return new MessagesPage(
    pageIndex,
    pageSize,
    filteredMessages.length - pageSize * (pageIndex + 1),
    pageSize * pageIndex,
    pageMessages,
  );
}

function containsText(message, searchText) {
  return (
    message.type === messageTypes.text &&
    message.data &&
    message.data.toLowerCase().includes(searchText.toLowerCase())
  );
}

function getNextId() {
  return ++maxId;
}

function getNextClientId() {
  return ++clientId;
}

function parseRawAttachments(messageId, rawAttachments) {
  const array = [];
  if (rawAttachments && rawAttachments.length > 0) {
    for (const rawAttachment of rawAttachments) {
      array.push(
        new Attachment(
          messageId,
          rawAttachment.file,
          decode(rawAttachment.arrayBuffer),
        ),
      );
    }
  }
  return array;
}

function messagesPageToJson(page) {
  return JSON.stringify(page);
}
