import logger from "../config/logger";
import { AppError } from "../utils/AppError";

export abstract class BaseService<T> {
  protected modelName: string;

  constructor(modelName: string) {
    this.modelName = modelName;
  }

  async findAll(
    _filter: any = {},
    _sort: any = {},
    _session?: unknown,
  ): Promise<T[]> {
    logger.warn({ model: this.modelName }, "BaseService.findAll is deprecated");
    return [];
  }

  async findById(
    _id: string,
    _populate?: string,
    _session?: unknown,
  ): Promise<T> {
    throw new AppError("Not implemented", 501);
  }

  async create(_data: Partial<T>, _session?: unknown): Promise<T> {
    logger.debug(
      { model: this.modelName },
      "Creating document",
    );
    throw new AppError("Not implemented", 501);
  }

  async update(
    _id: string,
    _data: Partial<T>,
    _session?: unknown,
  ): Promise<T> {
    throw new AppError("Not implemented", 501);
  }

  async delete(_id: string, _session?: unknown): Promise<T> {
    throw new AppError("Not implemented", 501);
  }

  async exists(_filter: any, _session?: unknown): Promise<boolean> {
    return false;
  }
}
