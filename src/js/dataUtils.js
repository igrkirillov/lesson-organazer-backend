import * as fs from "fs";

const ticketsPath = "./tickets.json";
export function loadTickets() {
  return (
    fs.existsSync(ticketsPath) &&
      JSON.parse(fs.readFileSync(ticketsPath).toString())
  );
}

export function saveTickets(json) {
  fs.writeFileSync(ticketsPath, JSON.stringify(json));
}
