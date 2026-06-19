type RangeFilter = {
  $gte?: number;
  $lte?: number;
};

type DateRangeFilter = {
  $gte?: Date;
  $lte?: Date;
};

export class FilterBuilder {
  private filter: Record<string, unknown> = {};

  addEquals(field: string, value: unknown): this {
    if (value !== undefined && value !== null) {
      this.filter[field] = value;
    }
    return this;
  }

  addNumberRange(
    field: string,
    min?: number | string,
    max?: number | string,
  ): this {
    const range: RangeFilter = {};

    if (min !== undefined) {
      range.$gte = typeof min === "string" ? Number.parseFloat(min) : min;
    }
    if (max !== undefined) {
      range.$lte = typeof max === "string" ? Number.parseFloat(max) : max;
    }

    if (Object.keys(range).length > 0) {
      this.filter[field] = range;
    }

    return this;
  }

  addDateRange(field: string, startDate?: string, endDate?: string): this {
    const range: DateRangeFilter = {};

    if (startDate) {
      range.$gte = new Date(startDate);
    }
    if (endDate) {
      range.$lte = new Date(endDate);
    }

    if (Object.keys(range).length > 0) {
      this.filter[field] = range;
    }

    return this;
  }

  addDate(field: string, dateString?: string): this {
    if (dateString) {
      this.filter[field] = new Date(dateString);
    }
    return this;
  }

  build(): Record<string, unknown> {
    return this.filter;
  }
}
