import * as fs from "fs";

const messagesPath = "./data/messages.json";
const dirs = ["./data", "./data/audio", "./data/files", "./data/video"];

export function loadMessages() {
  initDirs();
  return (
    fs.existsSync(messagesPath) &&
    JSON.parse(fs.readFileSync(messagesPath).toString())
  );
}

export function saveMessages(json) {
  initDirs();
  fs.writeFileSync(messagesPath, JSON.stringify(json));
}

export function saveAttachments(attachments) {
  initDirs();
  for (const attachment of attachments) {
    const dirPath = `./data/files/${attachment.messageId}`;
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath);
    }
    const filePath = dirPath + `/${attachment.name}`;
    fs.writeFileSync(filePath, Buffer.from(attachment.arrayBuffer));
  }
}

export function getAttachmentPath(messageId, name) {
  return `./data/files/${messageId}/${name}`;
}

export function initDirs() {
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
  }
}
