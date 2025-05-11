export class WrongTaskStatusException extends Error {
  constructor() {
    super('Wrong task status transiton!');
    this.name = 'WrongTaskStatusException';
  }
}
