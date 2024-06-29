export default class MessagesPage {
  constructor(pageIndex, pageSize, beforeCount, afterCount, messages) {
    this.pageIndex = pageIndex;
    this.pageSize = pageSize;
    this.afterCount = afterCount;
    this.beforeCount = beforeCount;
    this.messages = messages;
  }
}
