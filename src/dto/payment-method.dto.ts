import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min, MinLength } from "class-validator";
import { Transform } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PaymentMethodTypeEnum } from "../enums/payment-method-type.enum";

const toOptionalBoolean = ({ value }: { value: unknown }): boolean | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
};

export class CreatePaymentMethodDto {
  @ApiProperty({ example: "Nubank" })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ enum: PaymentMethodTypeEnum })
  @IsEnum(PaymentMethodTypeEnum)
  type!: PaymentMethodTypeEnum;

  @ApiPropertyOptional({ example: "#820AD1" })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 31, example: 7 })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(31)
  closingDay?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 31, example: 15 })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(31)
  dueDay?: number;
}

export class UpdatePaymentMethodDto {
  @ApiPropertyOptional()
  @IsString()
  @MinLength(1)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 31 })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(31)
  closingDay?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 31 })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(31)
  dueDay?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class PaymentMethodQueryParamsDto {
  @ApiPropertyOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
