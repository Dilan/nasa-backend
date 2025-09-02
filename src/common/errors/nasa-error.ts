export class NasaError extends Error {
  constructor(
    public readonly code: number,
    public readonly msg: string,
    public readonly service_version: string = 'v1',
  ) {
    super(msg);
    this.name = 'NasaError';
  }

  toJSON() {
    return {
      code: this.code,
      msg: this.msg,
      service_version: this.service_version,
    };
  }
}
