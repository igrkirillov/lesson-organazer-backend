import * as http from "http";
import Application from "koa";
import { koaBody } from "koa-body";
import Ticket from "./Ticket.js";
import { saveTickets, loadTickets } from "./dataUtils.js";

const app = new Application();
const tickets = loadTickets() || [];
let maxId = tickets.reduce((maxId, t) => Math.max(maxId, t.id), 0);

app.use(
  koaBody({
    urlencoded: true,
    multipart: true,
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

app.use(createTicket);
app.use(updateById);
app.use(allTickets);
app.use(ticketById);
app.use(deleteById);

const server = http.createServer(app.callback());
const port = 7070;
server.listen(port, (err) => {
  if (err) {
    console.log(err);
    return;
  }
  console.log("Server is listening to " + port);
});

function createTicket(context, next) {
  if (
    context.request.method !== "POST" ||
    getMethodName(context.request) !== "createTicket"
  ) {
    next();
    return;
  }
  const { name, status, description } = context.request.body;
  context.response.set("Access-Control-Allow-Origin", "*");
  const ticket = new Ticket(getNextId(), name, status, description, Date.now());
  tickets.push(ticket);
  saveTickets(tickets);
  context.response.body = JSON.stringify(ticket);
  context.type = "json";
  next();
}

function updateById(context, next) {
  if (
    context.request.method !== "PATCH" ||
    getMethodName(context.request) !== "updateById"
  ) {
    next();
    return;
  }
  const id = getId(context.request);
  context.response.set("Access-Control-Allow-Origin", "*");
  const ticket = tickets.find((t) => t.id === id);
  if (!ticket) {
    context.response.status = 404;
    context.response.body = "Not Found";
  } else {
    const { name, status, description } = context.request.body;
    ticket.name = name;
    ticket.status = status;
    ticket.description = description;
    saveTickets(tickets);
    context.response.body = JSON.stringify(ticket);
    context.type = "json";
  }
  next();
}

function allTickets(context, next) {
  if (
    context.request.method !== "GET" ||
    getMethodName(context.request) !== "allTickets"
  ) {
    next();
    return;
  }
  context.response.set("Access-Control-Allow-Origin", "*");
  context.response.body = JSON.stringify(tickets);
  context.type = "json";
  next();
}

function ticketById(context, next) {
  if (
    context.request.method !== "GET" ||
    getMethodName(context.request) !== "ticketById"
  ) {
    next();
    return;
  }
  const id = getId(context.request);
  context.response.set("Access-Control-Allow-Origin", "*");
  const ticket = tickets.find((t) => t.id === id);
  if (!ticket) {
    context.response.status = 404;
    context.response.body = "Not Found";
  } else {
    context.response.body = JSON.stringify(ticket);
    context.type = "json";
  }
  next();
}

function deleteById(context, next) {
  if (
    context.request.method !== "DELETE" ||
    getMethodName(context.request) !== "deleteById"
  ) {
    next();
    return;
  }
  const id = getId(context.request);
  context.response.set("Access-Control-Allow-Origin", "*");
  const index = tickets.findIndex((t) => t.id === id);
  if (index < 0) {
    context.response.status = 404;
    context.response.body = "Not Found";
  } else {
    tickets.splice(index, 1);
    saveTickets(tickets);
    context.response.status = 202;
  }
  next();
}

function getMethodName(request) {
  return request.query && request.query["method"];
}

function getId(request) {
  return request.query && +request.query["id"];
}

function getNextId() {
  return ++maxId;
}
