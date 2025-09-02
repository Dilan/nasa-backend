import { IsOptional, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryApodDto {
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value;
    }
    return value;
  })
  start_date?: string;

  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value;
    }
    return value;
  })
  end_date?: string;
}
