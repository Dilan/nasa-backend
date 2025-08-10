import { IsOptional, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryEpicDto {
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value;
    }
    return value;
  })
  date?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true';
    }
    return value;
  })
  natural?: boolean = true;
}
