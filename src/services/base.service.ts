import { Model, Document, ClientSession } from "mongoose";
import logger from "../config/logger";

export abstract class BaseService<T extends Document> {
  constructor(protected model: Model<T>) {}

  async findAll(
    filter: any = {},
    sort: any = {},
    session?: ClientSession,
  ): Promise<T[]> {
    logger.debug(
      { filter, model: this.model.modelName },
      "Finding all documents",
    );
    const query = this.model.find(filter);
    if (session) {
      query.session(session);
    }
    return query.sort(sort);
  }

  async findById(
    id: string,
    populate?: string,
    session?: ClientSession,
  ): Promise<T> {
    logger.debug({ id, model: this.model.modelName }, "Finding document by ID");
    const query = this.model.findById(id);
    if (session) {
      query.session(session);
    }
    if (populate) {
      query.populate(populate);
    }
    return query.orFail();
  }

  async create(data: Partial<T>, session?: ClientSession): Promise<T> {
    logger.debug(
      {
        model: this.model.modelName,
        payloadKeys: Object.keys((data as Record<string, unknown>) || {}),
      },
      "Creating document",
    );
    const document = new this.model(data);
    await document.save(session ? { session } : undefined);
    logger.info(
      { id: document._id, model: this.model.modelName },
      "Document created",
    );
    return document;
  }

  async update(
    id: string,
    data: Partial<T>,
    session?: ClientSession,
  ): Promise<T> {
    logger.debug(
      {
        id,
        model: this.model.modelName,
        payloadKeys: Object.keys((data as Record<string, unknown>) || {}),
      },
      "Updating document",
    );
    const document = await this.model
      .findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
        session,
      })
      .orFail();
    logger.info({ id, model: this.model.modelName }, "Document updated");
    return document;
  }

  async delete(id: string, session?: ClientSession): Promise<T> {
    logger.debug({ id, model: this.model.modelName }, "Deleting document");
    const document = await this.model
      .findByIdAndDelete(id, { session })
      .orFail();
    logger.info({ id, model: this.model.modelName }, "Document deleted");
    return document;
  }

  async exists(filter: any, session?: ClientSession): Promise<boolean> {
    const query = this.model.countDocuments(filter);
    if (session) {
      query.session(session);
    }
    const count = await query;
    return count > 0;
  }
}
