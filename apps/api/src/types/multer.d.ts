declare namespace Express {
  export namespace Multer {
    export interface File {
      /** Name of the form field associated with this file. */
      fieldname: string;
      /** Name of the file on the uploader's computer. */
      originalname: string;
      /** Value of the `Content-Transfer-Encoding` header for this file. */
      encoding: string;
      /** Value of the `Content-Type` header for this file. */
      mimetype: string;
      /** Size of the file in bytes. */
      size: number;
      /** `Readable` stream of this file. Only available for `DiskStorage`. */
      stream: any;
      /** A point to the location of the file on the system. */
      destination: string;
      /** Name of the file within the `destination`. */
      filename: string;
      /** Full path to the uploaded file. */
      path: string;
      /** A `Buffer` of the entire file. Only available for `MemoryStorage`. */
      buffer: Buffer;
    }
  }
}
