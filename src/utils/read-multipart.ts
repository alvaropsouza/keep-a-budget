import { FastifyRequest } from "fastify";

export interface MultipartFile {
  buffer: Buffer;
  filename: string;
  mimetype: string;
}

export interface MultipartData {
  fields: Record<string, string>;
  file?: MultipartFile;
}

export interface MultipartFilesData {
  fields: Record<string, string>;
  files: MultipartFile[];
}

export const readMultipart = async (req: FastifyRequest): Promise<MultipartData> => {
  const fields: Record<string, string> = {};
  let file: MultipartFile | undefined;

  for await (const part of req.parts()) {
    if (part.type === "file") {
      file = {
        buffer: await part.toBuffer(),
        filename: part.filename,
        mimetype: part.mimetype,
      };
    } else {
      fields[part.fieldname] = part.value as string;
    }
  }

  return { fields, file };
};

export const readMultipartFiles = async (req: FastifyRequest): Promise<MultipartFilesData> => {
  const fields: Record<string, string> = {};
  const files: MultipartFile[] = [];

  for await (const part of req.parts()) {
    if (part.type === "file") {
      files.push({
        buffer: await part.toBuffer(),
        filename: part.filename,
        mimetype: part.mimetype,
      });
    } else {
      fields[part.fieldname] = part.value as string;
    }
  }

  return { fields, files };
};
