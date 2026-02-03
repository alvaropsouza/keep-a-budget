import { Model, Document } from "mongoose";
import logger from "../config/logger";

export abstract class BaseService<T extends Document> {
  constructor(protected model: Model<T>) {}

  async findAll(filter: any = {}, sort: any = {}): Promise<T[]> {
    logger.debug(
      { filter, model: this.model.modelName },
      "Finding all documents",
    );
    return this.model.find(filter).sort(sort);
  }

  async findById(id: string, populate?: string): Promise<T> {
    logger.debug({ id, model: this.model.modelName }, "Finding document by ID");
    const query = this.model.findById(id);
    if (populate) {
      query.populate(populate);
    }
    return query.orFail();
  }

  async create(data: Partial<T>): Promise<T> {
    logger.debug({ data, model: this.model.modelName }, "Creating document");
    const document = new this.model(data);
    await document.save();
    logger.info(
      { id: document._id, model: this.model.modelName },
      "Document created",
    );
    return document;
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    logger.debug(
      { id, data, model: this.model.modelName },
      "Updating document",
    );
    const document = await this.model
      .findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      })
      .orFail();
    logger.info({ id, model: this.model.modelName }, "Document updated");
    return document;
  }

  async delete(id: string): Promise<T> {
    logger.debug({ id, model: this.model.modelName }, "Deleting document");
    const document = await this.model.findByIdAndDelete(id).orFail();
    logger.info({ id, model: this.model.modelName }, "Document deleted");
    return document;
  }

  async exists(filter: any): Promise<boolean> {
    const count = await this.model.countDocuments(filter);
    return count > 0;
  }
}
