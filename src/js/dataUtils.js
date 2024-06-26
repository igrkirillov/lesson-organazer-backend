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
