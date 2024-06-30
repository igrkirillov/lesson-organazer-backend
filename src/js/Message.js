export default class Message {
  constructor(id, type, data, dateTime, attachmentNames, location) {
    this.id = id;
    this.type = type;
    this.data = data;
    this.dateTime = dateTime;
    this.attachmentNames = attachmentNames;
    this.location = location;
  }
}
