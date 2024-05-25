export default class Ticket {
  constructor(id, name, status, description, created) {
    this.id = id; // идентификатор (уникальный в пределах системы)
    this.name = name; // краткое описание
    this.status = status; // boolean - сделано или нет
    this.description = description; // полное описание
    this.created = created; // дата создания (timestamp)
  }
}
