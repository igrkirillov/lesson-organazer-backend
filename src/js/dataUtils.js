import * as fs from "fs";

const messagesPath = "./data/messages.json";

export function loadMessages() {
  return (
    fs.existsSync(messagesPath) &&
      JSON.parse(fs.readFileSync(messagesPath).toString())
  );
}

export function saveMessages(json) {
  fs.writeFileSync(messagesPath, JSON.stringify(json));
}

export function saveAttachments(attachments) {
  for (const attachment of attachments) {
    const dirPath = `./data/files/${attachment.messageId}`;
    fs.mkdirSync(dirPath);
    const filePath = dirPath + `/${attachment.name}`;
    fs.writeFileSync(filePath, Buffer.from(attachment.arrayBuffer));
  }
}

export function getAttachmentPath(messageId, name) {
  return `./data/files/${messageId}/${name}`;
}
