export default class Attachment {
  constructor(messageId, name, arrayBuffer) {
    this.messageId = messageId;
    this.name = name;
    this.arrayBuffer = arrayBuffer;
  }
}
