import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { QueryApodDto } from './query-apod.dto';

describe('QueryApodDto', () => {
  it('should be defined', () => {
    expect(new QueryApodDto()).toBeDefined();
  });

  describe('validation', () => {
    it('should validate with valid dates', async () => {
      const dto = plainToClass(QueryApodDto, {
        start_date: '2024-01-01',
        end_date: '2024-01-02',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate with only start_date', async () => {
      const dto = plainToClass(QueryApodDto, {
        start_date: '2024-01-01',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate with only end_date', async () => {
      const dto = plainToClass(QueryApodDto, {
        end_date: '2024-01-02',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate with no dates', async () => {
      const dto = plainToClass(QueryApodDto, {});

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject invalid start_date format', async () => {
      const dto = plainToClass(QueryApodDto, {
        start_date: 'invalid-date',
        end_date: '2024-01-02',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isDateString).toBeDefined();
    });

    it('should reject invalid end_date format', async () => {
      const dto = plainToClass(QueryApodDto, {
        start_date: '2024-01-01',
        end_date: 'invalid-date',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isDateString).toBeDefined();
    });
  });

  describe('transformation', () => {
    it('should transform string values correctly', () => {
      const dto = plainToClass(QueryApodDto, {
        start_date: '2024-01-01',
        end_date: '2024-01-02',
      });

      expect(dto.start_date).toBe('2024-01-01');
      expect(dto.end_date).toBe('2024-01-02');
    });

    it('should handle non-string values', () => {
      const dto = plainToClass(QueryApodDto, {
        start_date: 123,
        end_date: true,
      });

      expect(dto.start_date).toBe(123);
      expect(dto.end_date).toBe(true);
    });
  });
});
