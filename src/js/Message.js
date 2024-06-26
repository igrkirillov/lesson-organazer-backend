export default class Message {
  constructor(id, type, data, dateTime, attachments) {
    this.id = id;
    this.type = type;
    this.data = data;
    this.dateTime = dateTime;
    this.attachments = attachments;
  }
}
