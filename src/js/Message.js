export default class Message {
  constructor(clientId, id, type, data, dateTime, attachmentNames, location) {
    this.clientId = clientId;
    this.id = id;
    this.type = type;
    this.data = data;
    this.dateTime = dateTime;
    this.attachmentNames = attachmentNames;
    this.location = location;
  }
}
