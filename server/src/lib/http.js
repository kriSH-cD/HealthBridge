// Errors keep FastAPI's {"detail": ...} shape so the frontend reads them unchanged.
export class HttpError extends Error {
  constructor(status, detail) {
    super(typeof detail === "string" ? detail : "HTTP error");
    this.status = status;
    this.detail = detail;
  }
}

/** Parse with a zod schema or throw 422 like FastAPI did. */
export function parse(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new HttpError(422, result.error.issues.map((i) => ({ loc: i.path, msg: i.message, type: i.code })));
  }
  return result.data;
}
